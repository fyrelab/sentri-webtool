(() => {
  'use strict';

  // Internal requirements
  const loginFunc = require(__dirname + '/login_functions.js');

  /**
   * This middleware can be used if a routing should be only visible when signed in
   * If not the user is redirected to the login page
   */
  exports.signinRedirect = (req, res, next) => {
    if (loginFunc.isSignedIn(req)) {
      next();
    } else {
      res.redirect('/signin');
    }
  };

  /**
   * This middleware can be used if a routing should be only visible when signed in
   * If not the user gets a Forbidden 403 response
   */
  exports.signinForbidden = (req, res, next) => {
    if (loginFunc.isSignedIn(req)) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
})();
