/**
 * Routes and handling of config reading/writing
 */

'use strict';

// Internal requirements
const conf = require(__dirname + '/../config.js');
const paths = require(__dirname + '/paths.js');
const mdw = require(__dirname + '/middlewares.js');
const sysFunc = require(__dirname + '/system_functions.js');
const ctrlFunc = require(__dirname + '/sentri_control_functions.js');

const rulesFile = paths.rulesFilePath();
const rulesFileNew = paths.rulesNewFilePath();

module.exports = (app) => {
  app.get('/json/rules.json', mdw.signinForbidden, (req, res) => {
    sysFunc.exists(rulesFileNew, (err, exists) => {
      if (exists) {
        sysFunc.sendJsonFromFile(res, rulesFileNew);
      } else {
        sysFunc.exists(rulesFile, (err, exists) => {
          if (exists) {
            sysFunc.sendJsonFromFile(res, rulesFile);
          } else {
            res.sendStatus(404);
          }
        });
      }
    });
  });

  app.get('/json/config/:module/config.json', mdw.signinForbidden, (req, res) => {
    var confFile = paths.confFilePath(req.params.module);
    var confFileNew = paths.confNewFilePath(req.params.module);

    if (confFile && confFileNew) {
      sysFunc.exists(confFileNew, (err, exists) => {
        if (exists) {
          sysFunc.sendJsonFromFile(res, confFileNew);
        } else {
          sysFunc.exists(confFile, (err, exists) => {
            if (exists) {
              sysFunc.sendJsonFromFile(res, confFile);
            } else {
              res.sendStatus(404);
            }
          });
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  app.post('/action/modules/:module/config', mdw.signinForbidden, (req, res) => {
    sysFunc.writeModuleConfigFile(req.params.module, JSON.stringify(req.body), (err) => {
      res.json({ errors: err.errors });
    });
  });

  app.post('/action/rules/config', mdw.signinForbidden, (req, res) => {
    sysFunc.writeRulesFile(JSON.stringify(req.body), (err) => {
      res.json({ errors: err.errors });
    });
  });

  app.post('/action/system/apply-changes', mdw.signinForbidden, (req, res) => {
    var errors = [];

    // Call apply Changes (renames new files)
    sysFunc.applyChanges((err) => {
      // check if error detected
      if (err.hasErrors()) {
        res.json({ errors: err.errors });
      } else {
        // if no error was detected create a lock file
        sysFunc.createLockFile((err) => {
          // check if error detected
          if(err.hasErrors()) {
            res.json({ errors: err.errors });
          } else {
            // if no error was detected restart the system
            ctrlFunc.controlSystem('restart', (err, status) => {
              res.json({ errors: err.errors, data: status, locked: 'unlocked' });
            });
          }
        });
      }
    });
  });
};
