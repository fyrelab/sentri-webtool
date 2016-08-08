/**
 * login functions
 */
(() => {
  'use strict';

  // Internal requirements
  const conf = require(__dirname + '/../config.js');
  const paths = require(__dirname + '/paths.js');
  const sysFunc = require(__dirname + '/system_functions.js');
  const ErrorCatcher = require(__dirname + '/error_catcher.js').ErrorCatcher;

  // External requirements
  const crypto = require('crypto');
  const nodemailer = require('nodemailer');
  const fs = require('fs');


  var settings = {
    users: []
  };
  loadSettings();  // Load settings on init

  var sessionTokens = [];
  var nextLoginAttempt = 0;
  var bruteforceLevel = 0;


  /**
   * Update settings and login credentials
   */
  function loadSettings() {
    fs.readFile(paths.webtoolConfPath(), (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      try {
        var obj = JSON.parse(data);
        settings = obj;
      } catch(e) {
        console.error(e);
      }
    });
  }

  /**
   * Adds a token with a timestamp to the sessionTokens
   * @param token Token to add
   */
  var addToken = (token) => {
    sessionTokens.push({ timestamp: Date.now(), token: token });
  };

  /**
   * Generates a random token and returns it.
   * @return A random token
   */
  exports.generateToken = () => {
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
  }

  /**
   * Removes a token from the sessionTokens
   * @param token Token to remove
   */
  exports.removeToken = (token) => {
    sessionTokens = sessionTokens.filter(function(v) {
      return v.token !== token;
    });
  };

  /**
   * Checks if a token is valid
   * @param tolen Token to be looked for in active sessions
   * @return bool if token is valid
   */
  exports.validateToken = (token) => {
    if (token) {
      // Remove old sessions
      var now = Date.now();

      sessionTokens = sessionTokens.filter(function(v) {
        return v.timestamp + conf.sessionTimeout >= now;
      });

      for (var i = 0; i < sessionTokens.length; i++) {
        if (sessionTokens[i].token === token) {
          sessionTokens[i].timestamp = now;
          return true;
        }
      }
    }

    return false;
  };

  /**
   * @return The default user of the webtool
   */
  exports.getUser = () => {
    return settings.users[0].user;
  };

  /**
   * @return The email of the default user.
   */
  exports.getEmail = () => {
    return settings.users[0].email;
  };

  /**
   * Updates users username, password (also generates new salt and hash) and mail
   * @param user Username to set
   * @param password Password to set
   * @param mail Mail address to set
   */
  exports.updateUser = (user, password, mail) => {
    var salt = exports.generateToken();
    var hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

    var user = {
      user: user,
      email : mail,
      password_salt: salt,
      password_hash: hash
    };

    writeUser(user);
  };

  /**
   * Checks if the username and password are correct
   * @param user User name to look for
   * @param password Password to check together with the user name
   * @return bool if credentials are valid
   */
  var checkUserCredentials = (user, password) => {
    return settings.users.some(function(e) {
      return (
        e.user === user &&
        crypto.createHmac('sha256', e.password_salt).update(password).digest('hex') === e.password_hash
      );
    });
  };

  /**
   * Writes the given user to the webtool.json file
   * @param user User object to set in settings
   */
  var writeUser = (user) => {
    settings.users = [ user ];

    fs.writeFile(paths.webtoolConfPath(), JSON.stringify(settings), (err, data) => {
      if (err) {
        console.error(err);
      }
    });
  };

  /**
   * Checks if the given mail equals a mail of a user
   * @param mail Mail address to check
   * @return bool if mail exists
   */
  var checkMail = (mail) => {
    return settings.users.some((e) => {
      return e.email === mail;
    });
  };

  /**
   * Check if user is signed in via url or cookie
   * @param req Express req object to check against
   */
  exports.isSignedIn = (req) => {
    var token;

    if (sessionTokens !== null) {
      if (req.cookies && req.cookies[conf.sessionCookieName]) {
        token = req.cookies[conf.sessionCookieName];

        // Need to remove second COOKIE data because Android WebView sends faulty HTTP requests
        var idx;
        if ((idx = token.indexOf(',')) > 0) {
          token = token.substr(0, idx).trim();
        }
      } else if (req.query.token) {
        token = req.query.token;
      }
    }

    // Check token
    return exports.validateToken(token);
  };

  /**
   * Signin a given user with the given password.
   * If the user credentials are right the callback will be called with a token, else, with a error message
   * @param user User name
   * @param password passwordP
   * @param callback(false|string) false if invalid sign in attempt, otherwise session token
   */
  exports.signin = (user, password, callback) => {
    var errors = new ErrorCatcher();

    // Bruteforce protection
    if (nextLoginAttempt < Date.now()) {
      // Check credentials
      if (checkUserCredentials(user, password)) {
        // Reset bruteforce level
        bruteforceLevel = 0;

        // Create session token and add to list
        var token = exports.generateToken();
        addToken(token);

        callback(token, errors);
      } else {
        var err = 'Invalid user credentials';

        bruteforceLevel++;

        if (bruteforceLevel > 1) {
          // Set bruteforce timeout
          var timeout = 2000 * Math.pow(2, bruteforceLevel);
          nextLoginAttempt = Date.now() + timeout;

          err += '. Next login attempt: ' + new Date(nextLoginAttempt).toString();
        }

        errors.addError(err);
        callback(false, errors);
      }
    } else {
      errors.addError('Login disabled. Next login attempt: ' + new Date(nextLoginAttempt).toString());
      callback(false, errors);
    }
  };

  /**
   * Send mail for password recovery
   * @param mail Mail address to send to
   * @param callback(bool, ErrorCatcher) Success and errors
   */
  exports.sendMail = (mail, callback) => {
    var errors = new ErrorCatcher();

    sysFunc.getModuleConfiguration('module_mail', (conf) => {
      if (!conf) {
        errors.addError('Internal server error');
        callback(false, errors);
        return;
      }

      // The smtp config for sending the reset mail
      var smtpConfig = {
        host: conf.smtp_server,
        port: conf.smtp_port,
        secure: false, // use SSL
        auth: {
            user: conf.smtp_user,
            pass: conf.smtp_pass
        }
      };

      var transporter = nodemailer.createTransport(smtpConfig);

      // Bruteforce protection
      if (nextLoginAttempt < Date.now()) {
        // Check email address
        if (checkMail(mail)) {
          // Reset bruteforce level
          bruteforceLevel = 0;

          // Create session token and add to list
          var token = exports.generateToken();
          addToken(token);

          // The email content
          var mailOptions = {
            from: conf.from,
            to: mail,
            subject: 'Reset of user input data',
            text: "Enter the following token to regain access to the webtool: " + token
          };

          transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              console.error('Error while sending a message');
              console.error(error);
              return;
            }
            console.log('Sent password recovery email');
          });

          callback(token, errors);
        } else {
          var err = 'Invalid email address';

          bruteforceLevel++;

          if (bruteforceLevel > 2) {
            // Set bruteforce timeout
            var timeout = 2000 * Math.pow(2, bruteforceLevel);
            nextLoginAttempt = Date.now() + timeout;

            err += '. Next login attempt: ' + new Date(nextLoginAttempt).toString();
          }

          errors.addError(err);

          callback(false, errors);
        }
      } else {
        errors.addError('Invalid email address. Next attempt: ' + new Date(nextLoginAttempt).toString());
        callback(false, errors);
      }
    });
  };
})();
