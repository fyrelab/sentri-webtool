(() => {
  'use strict';

  // Internal requirements
  const conf = require(__dirname + '/../config.js');
  const paths = require(__dirname + '/paths.js');
  const ErrorCatcher = require(__dirname + '/error_catcher.js').ErrorCatcher;
  const Racer = require(__dirname + '/racer.js').Racer;

  // External requirements
  const fs = require('fs');

  /**
   * Sends the given file to the client. If the path is invalid,
   * a 404 File not found error is sent.
   * @param res Express res to send to
   * @param filePath Path to file to read
   */
  exports.sendFile = (res, filePath) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);

        res.sendStatus(404);
        return;
      }

      res.send(data);
    });
  };

  /**
   * Sends a JSON Object from the given file to the client. If the path is invalid a 404
   * error is sent. If the file could not be parsed a 500 error is sent.
   * @param res Express res to send to
   * @param filePath Path to json file to read
   */
  exports.sendJsonFromFile = (res, filePath) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // The file does not exists
        console.error(err);

        res.sendStatus(404);
        return;
      }

      // Reading of the file was successful, try parse it into an JSON object
      try {
        var obj = JSON.parse(data);
        res.json({ errors: [], data: obj });
      } catch(e) {
        console.error(e);
        res.sendStatus(500);
      }
    });
  };


  /**
   * Reads the info files of all modules and puts them into a JSON object.
   * Calls the callback with errors and modules, where modules is the JSON object
   * containing the info about the modules.
   * @param callback(ErrorCatcher, array) Array of modules
   */
  exports.readModules = (callback) => {
    var modules = [];
    var errors = new ErrorCatcher();

    var racer = new Racer();

    fs.readdir(conf.staticPath, (err, files) => {
      if (err) {
        errors.addError({ message: 'Could not open module directory' });
        callback(errors);
      } else {
        files.forEach((dir) => {
          if (dir.startsWith('module_')) {
            var moduleDir = paths.moduleShareDir(dir);

            racer.add((done) => {
              fs.stat(moduleDir, (err, stats) => {
                if (err) {
                  console.error(err);
                } else {
                  if (stats.isDirectory()) {
                    racer.add((done) => {
                      // Try reading module info file
                      var infoFile = paths.infoFilePath(dir);

                      fs.readFile(infoFile, (err, data) => {
                        if (err) {
                          errors.addError({ message: dir + '.info cannot be opened' });
                        } else {
                          // Add module to module list
                          var module = { id: dir, info: {} };
                          try {
                            module.info = JSON.parse(data);
                          } catch(e) {
                            if (e instanceof SyntaxError) {
                              errors.addError({ message: dir + '.info cannot be parsed due to syntax errors' });
                            }
                          }

                          modules.push(module);
                        }

                        done();
                      });
                    });
                  }
                }

                done();
              });
            })
            .run(() => {
              callback(errors, modules);
            });
          }
        });
      }
    });
  };


  /**
   * Writes the given config to the config file of the module with the given id.
   * Only writes a .new file, so the changes musst be applied later.
   * @param id
   */
  exports.writeModuleConfigFile = (module, config, callback) => {
    var errors = new ErrorCatcher();

    fs.writeFile(paths.confNewFilePath(module), config, (err) => {
      if (err) {
        console.error(err);
        errors.addError('Could not save config file');
      }
      callback(errors);
    });
  };

  /**
   * Writes the given rules file.
   * Only writes a .new file, so the changes musst be applied later.
   * @param rules Data to write to rules file
   * @param callback(ErrorCatcher)
   */
  exports.writeRulesFile = (rules, callback) => {
    var errors = new ErrorCatcher();

    fs.writeFile(paths.rulesNewFilePath(), rules, (err) => {
      if (err) {
        console.error(err);
        errors.addError('Could not save rules file');
      }
      callback(errors);
    });
  };

  /**
   * Moves all .new files to the real config files
   * @param callback(ErrorCatcher)
   */
  exports.applyChanges = (callback) => {
    var errors = new ErrorCatcher();
    var racer = new Racer();

    racer.add((done) => {
      // Rename the rules.conf.new file
      fs.rename(paths.rulesNewFilePath(), paths.rulesFilePath(), (err) => {
        if (err && err.code != 'ENOENT') {
          console.error(err);
          errors.addError({ message: 'Could not rename rules file' });
        }

        done();
      });
    }).add((done) => {
      // Rename the config files of the modules
      fs.readdir(conf.configPath, (err, files) => {
        if (err) {
          errors.addError('Could not open module config directory');
        } else {
          files.forEach((dir) => {
            if (dir.startsWith('module_')) {
              var moduleDir = paths.moduleConfDir(dir);

              racer.add((done) => {
                fs.stat(moduleDir, (err, stats) => {
                  if (err) {
                    console.error(err);
                  } else {
                    if (stats.isDirectory()) {
                      racer.add((done) => {
                        // File which must be renamed exists: Mark open writer and rename file
                        fs.rename(paths.confNewFilePath(dir), paths.confFilePath(dir), (err) => {
                          if (err && err.code != 'ENOENT') {
                            errors.addError(dir + '.conf.new cannot be renamed');
                          }

                          done();
                        });
                      });
                    }
                  }

                  done();
                });
              });
            }
          });
        }

        done();
      });
    }).run(() => {
      callback(errors);
    });
  };

  /**
   * Creates an lock file, so the system knows that there are unapplied changes.
   * The lockfile is deleted by the core when it starts.
   * @param callback(ErrorCatcher)
   */
  exports.createLockFile = (callback) => {
    var errors = new ErrorCatcher();
    fs.writeFile(paths.lockFilePath(), 'Locked', (err) => {
      if (err) {
        console.error(err);
        errors.addError('Could not create lock file');
      }
      callback(errors);
    });
  };

  /**
   * Determines if the system has uncommited changes.
   * This is checked by checking for the lock file and .new files
   * Lock files are used to detect if the system has been restarted since updating the configuration
   * @param callback(ErrorCatcher, bool) if lock exists
   */
  exports.hasUncommitedChanges = (callback) => {
    var errors = new ErrorCatcher();
    var racer = new Racer();


    /**
     * Creates a function that checks if the file exists and if so,
     * the function calls the callback.
     * @return function that checks the file
     */
    var checkFile = (path) => {
      // return a function
      return (done, abort) => {
        // check if the file exists
        exports.exists(path, (err, exists) => {
          if (exists) {
            // yes the file exists, so abort the search for .new files
            abort()
          } else if (err.hasErrors()) {
            // there are some errors, add them
            errors.addError({ message: 'Could not determine if file: ' + path + ' exists' });
            done();
          } else {
            done();
          }
        });
      };
    };

    // add lock file check to loc racer
    racer.add(checkFile(paths.lockFilePath()));

    // add rules.new file check to lock racer
    racer.add(checkFile(paths.rulesNewFilePath()));

    // add modules .new file checks to racer
    fs.readdir(conf.configPath, (err, files) => {
      if (err) {
        // errors occurred so add them to the errors
        errors.addError({ message: 'Could not open module config directory' });
      } else {
        // if no errors occurred add for each module a check if the new file exists
        // to the racer
        files.forEach((dir) => {
          var moduleDir = paths.moduleConfDir(dir);

          if (dir.startsWith('module_')) {
            racer.add((done) => {
              fs.stat(moduleDir, (err, stats) => {
                if (err) {
                  console.error(err);
                } else {
                  if (stats.isDirectory()) {
                    // module exists so add check for .new file to the racer
                    racer.add(checkFile(paths.confNewFilePath(dir)));
                  }
                }
                done();
              });
            });
          }
        });
      }
      // Now start the racer
      racer.run(
        // callback if all files are checked and none existed
        () => {
          callback(errors, false);
        },
        // callback if a new file was found
        () => {
          callback(errors, true);
        }
      );

    });  // read config path callback

  };

  /**
   * Determines if a file exists since fs.exists is deprecated
   * @param path Path to file to check
   * @param callback(ErrorCatcher, bool) if file exists
   */
  exports.exists = (path, callback) => {
    var errors = new ErrorCatcher();

    fs.stat(path, (err, stats) => {
      if (err && err.code == 'ENOENT') {
        callback(errors, false);
      } else if (err) {
        error.addError('Can not determine if file ' + path + ' exists');
        console.error(err);
        callback(errors, false);
      } else {
        callback(errors, true);
      }
    });
  };


  /**
   * Sends a json object containing the device token, firebase server and firebase server port.
   * This json object is needed by the android app to register a device.
   * @param res Express res to send data to
   */
  exports.sendAndroidNotifierData = (res) => {
    var response = {};
    var errors = new ErrorCatcher();

    var racer = new Racer();

    racer.add((done) => {
      // Read hook file to get device token
      fs.readFile(paths.hookDataFilePath('module_firebase'), (err, data) => {
        if (err) {
          // If a error occurs add a error to the response
          errors.addError('Could not load device token');
        } else {
          // Else, set the device token and read the config file
          try {
            response.token = JSON.parse(data).token;
          } catch (e) {
            errors.add(e);
          }
        }

        done();
      });
    }).add((done) => {
      exports.getModuleConfiguration('module_firebase', (conf) => {
        if (conf) {
          response.server = conf.server;
          response.port = conf.port;
        }

        done();
      });
    }).run(() => {
      response.err = errors.errors;
      res.json(response);
    });
  };

  /**
   * Get module configuration with info file default values as fallback as a map of keys and values
   * @param module Module name
   * @param callback(array) array map with key value pairs
   */
  exports.getModuleConfiguration = (module, callback) => {
    var modulePath = paths.infoFilePath(module);
    var moduleConfPath = paths.confFilePath(module);

    if (modulePath && moduleConfPath) {
      fs.readFile(modulePath, (err, data) => {
        if (err) {
          console.error(err);
          callback(null);
          return;
        }

        var infoConf = null;

        try {
          infoConf = JSON.parse(data).configuration;
        } catch(e) {
          console.error(e);
          callback(null);
          return;
        }

        fs.readFile(moduleConfPath, (err, data) => {
          var configConf = null;

          if (err) {
            console.error(err);
          }

          try {
            configConf = JSON.parse(data).configuration;
          } catch(e) {
            console.error(e);
          }

          var conf = {};

          infoConf.forEach((v) => {
            conf[v.key] = v.default;
          });

          if (configConf) {
            configConf.forEach((v) => {
              conf[v.key] = v.value;
            });
          }

          callback(conf);
        });
      });
    }
  };

  /**
   * Filter for client dependencies
   * @param allowed Array of allowed use selectors
   * @return Filter function with allowed selectors
   */
  exports.dependencyFilter = (allowed) => {
    return (dep) => {
      return allowed.some((use) => {
        return dep.use === use;
      });
    };
  }
})();
