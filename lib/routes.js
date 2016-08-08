/**
 * Rules for routing of pages and data
 * This file is self-documenting because it only consists of get/post routing selectors
 * and what happens on requesting
 */

'use strict';

// Internal requirements
const conf = require(__dirname + '/../config.js');
const paths = require(__dirname + '/paths.js');
const clientDep = require(__dirname + '/client_dependencies.js');
const sysFunc = require(__dirname + '/system_functions.js');
const loginFunc = require(__dirname + '/login_functions.js');
const ctrlFunc = require(__dirname + '/sentri_control_functions.js');
const mdw = require(__dirname + '/middlewares.js');

// External requirements
const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  // Page routing being available for Angular
  const pages = [
    '/',
    '/rules',
    '/module/:module',
    '/module/:module/config',
    '/rule/:id/config',
    '/rule/:id/config/:type/:module/:key',
    '/settings'
  ];

  // JS Client dependencies
  const appDep = clientDep.javascript.filter(sysFunc.dependencyFilter([ 'all', 'app' ]));
  const hookDep = clientDep.javascript.filter(sysFunc.dependencyFilter([ 'all', 'hook' ]));

  /* Register page routing */
  pages.forEach((page) => {
    app.get(page, mdw.signinRedirect, (req, res) => {
      res.render('index', {
        title: 'sentri webtool',
        jsDependencies: appDep,
        angularApp: 'webtool'
      });
    });
  });

  /* Signin */
  app.get('/signin', (req, res) => {
    res.render('signin', {
      title: 'Sign in',
      jsDependencies: [],
      errors: []
    });
  });

  app.post('/signin', (req, res) => {
    loginFunc.signin(req.body.user, req.body.password, (token, err) => {
      if (token !== false) {
        res.cookie(conf.sessionCookieName, token).redirect('/');
        return;
      }

      res.render('signin', {
        title: 'Sign in',
        jsDependencies: [],
        errors: err.errors
      });
    });
  });


  /* User login reset page */
  app.get('/reset', (req, res) => {
    res.render('reset', {
      title: 'Reset user login',
      jsDependencies: [],
      errors: []
    });
  });

  /* The post request for when a email is entered in the password reset page */
  app.post('/reset', (req, res) => {
    loginFunc.sendMail(req.body.email, (token, err) => {
      if (token !== false) {
        res.redirect('/token-signin');
        return;
      }

      res.render('reset', {
        title: 'Reset user login',
        jsDependencies: [],
        errors: err.errors
      });
    });
  });

  /* Token login page */
  app.get('/token-signin', (req, res) => {
    res.render('token_signin', {
      title: 'Login with a token',
      jsDependencies: [],
      errors: []
    });
  });

  /* The post request for when a email is entered in the password reset page*/
  app.post('/token-signin', (req, res) => {
    if (loginFunc.validateToken(req.body.token)) {
      res.cookie(conf.sessionCookieName, req.body.token).redirect('/settings');
    }

    res.render('token_signin', {
      title: 'Wrong token',
      jsDependencies: [],
      errors: [ "The entered token was wrong" ]
    });
  });


  /* Signout redirect (removing session cookie) */
  app.get('/signout', (req, res) => {
    loginFunc.removeToken(req.cookies[conf.sessionCookieName]);
    res.clearCookie(conf.sessionCookieName).redirect('/');
  });


  /* Route for systems to check if webtool is there */
  app.get('/is-sentri', (req, res) => {
    res.send('true');
  });


  /* Fast signin for automated services returning a token */
  app.post('/fastsignin', (req, res) => {
    loginFunc.signin(req.body.user, req.body.password, (token, err) => {
      if (token !== false) {
        res.send(token);
      } else {
        res.sendStatus(403);
      }
    });
  });

  /* Sets cookie from token and redirects to given page (used for automated signin) */
  app.get('/fastauth/:token', (req, res) => {
    res.cookie(conf.sessionCookieName, req.params.token).redirect(req.query.redirect);
  });

  /* Route for direct hook access */
  app.get('/direct-hook/:module/:location', mdw.signinForbidden, (req, res) => {
    if (paths.isSafeModuleName(req.params.module) && req.params.location.indexOf('"') == -1) {
      res.render('hook', {
        title: 'sentri webtool hook',
        jsDependencies: hookDep,
        angularApp: 'webtool',
        hookModule: req.params.module,
        hookLocation: req.params.location
      });
    } else {
      res.sendStatus(400);
    }
  });


  /* Special actions and routings */
  app.post('/settings', mdw.signinRedirect, (req, res) => {
    loginFunc.updateUser(req.body.user, req.body.password, req.body.email);
    res.redirect('/');
  });

  /* Views for Angular pages */
  app.get('/views/:view', mdw.signinForbidden, (req, res) => {
    res.render('page_' + req.params.view, { });
  });

  /* Hook content */
  app.get('/hooks/:module/:location', mdw.signinForbidden, (req, res) => {
    var hookFilePath = paths.hookTemplateFilePath(req.params.module, req.params.location);

    if (hookFilePath) {
      sysFunc.sendFile(res, hookFilePath);
    } else {
      syncFunc.sendStatus(400);
    }
  });

  /* User data for config page */
  app.get('/json/userdata.json', mdw.signinForbidden, (req, res) => {
    res.json({ data: { user: loginFunc.getUser(), email: loginFunc.getEmail()} });
  });

  /* List of all modules with information */
  app.get('/json/modules.json', mdw.signinForbidden, (req, res) => {
    sysFunc.readModules((err, mods) => {
      if (mods) {
        res.json({ errors: err.errors, data: mods });
      } else {
        res.json({ errors: err.errors });
      }
    });
  });

  /* Get all the data the android-notifier needs, including the instance token,
     the firebase server and the firebase server port */
  app.get('/json/android-notifier.json', mdw.signinForbidden, (req, res) => {
    sysFunc.sendAndroidNotifierData(res);
  });

  /* Streaming files */
  app.get('/stream/:file', mdw.signinForbidden, (req, res) => {
    if (paths.isSafePathComponent(req.params.file)) {
      var filename = paths.streamDir() + '/' + req.params.file;

      sysFunc.exists(filename, function (exists) {
        if (!exists) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.write('file not found');
          res.end();
        } else {
          switch (path.extname(filename)) {
            case '.m3u8' :
              fs.readFile(filename, function (err, contents) {
                if (err) {
                  res.writeHead(500);
                  res.end();
                } else if (contents) {
                    res.writeHead(200, { 'Content-Type':'application/vnd.apple.mpegurl' });
                    res.end(contents, 'utf-8');
                  } else {
                    res.writeHead(500);
                    res.end();
                  }
                });
                break;
            case '.ts' :
              res.writeHead(200, { 'Content-Type':'video/MP2T' });
              var stream = fs.createReadStream(filename, { bufferSize: 64 * 1024 });
              stream.pipe(res);
              break;
            default:
              res.writeHead(500);
              res.end();
          }
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  /* Hook data */
  app.get('/json/hooks/:module/data.json', mdw.signinForbidden, (req, res) => {
    var hookDataFilePath = paths.hookDataFilePath(req.params.module);

    if (hookDataFilePath) {
      sysFunc.sendJsonFromFile(res, hookDataFilePath);
    } else {
      res.sendStatus(400);
    }
  });

  /* System status */
  app.get('/json/system/status.json', mdw.signinForbidden, (req, res) => {
    ctrlFunc.getSystemStatus((err, status) => {
      res.json({ errors: err.errors, data: status });
    });
  });

  /* System locked (unapplied changes) */
  app.get('/json/system/locked.json', mdw.signinForbidden, (req, res) => {
    sysFunc.hasUncommitedChanges((err, uncomitted) => {
      res.json({ errors: err.errors, data: uncomitted ? 'locked' : 'unlocked' });
    });
  });

  /* Start|Stop|Restart system */
  app.post('/action/system/control/:mode', mdw.signinForbidden, (req, res) => {
    ctrlFunc.controlSystem(req.params.mode, (err, status) => {
      res.json({ errors: err.errors, data: status });
    });
  });
};
