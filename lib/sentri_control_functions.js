/**
 * sentri control functions
 */
(() => {
  'use strict';

  const exec = require('child_process').exec;
  const ErrorCatcher = require(__dirname + '/error_catcher.js').ErrorCatcher;

  /**
   * Controls the sentri systemd service. The mode must be 'start', 'stop' or 'restart'.
   * Calls the callback with errors and the new status.
   * @param mode start|stop|restart
   * @param callback(err, status) Details in getSystemStatus
   * @see getSystemStatus
   */
  exports.controlSystem = (mode, callback) => {
    var errors = new ErrorCatcher();
    var safeMode = null;

    switch (mode) {
      case 'start':
        safeMode = 'start';
        break;
      case 'stop':
        safeMode = 'stop';
        break;
      case 'restart':
        safeMode = 'restart';
        break;
    }

    if (safeMode !== null) {
      exec('systemctl --user ' + safeMode + ' sentri.service', function(err, stdout, stderr) {
        if (err) {
          console.error(err);
          errors.addError('System could not be controlled');
        }

        exports.getSystemStatus((statusErrors, status) => {
          callback(errors.addErrors(statusErrors), status);
        });
      });
    }
  };

  /**
   * Determines the status of the sentri systemd service.
   * @param callback(err, status) Callback for response, status is object with { running: bool, failed: bool }
   *                              If status could not be detected running is undefined
   */
  exports.getSystemStatus = (callback) => {
    var errors = new ErrorCatcher();
    var status = { running: undefined, failed: false };

    exec('systemctl --user is-active sentri.service', function(error, stdout, stderr) {
      if (error && error.code != 3) {
        console.error(error);
        errors.addError('System status could not be detected');
      } else {
        if (stdout.startsWith('active')) {
          status.running = true;
        } else if (stdout.startsWith('inactive')) {
          status.running = false;
        } else if (stdout.startsWith('failed')) {
          status.running = false;
          status.failed = true;
        }
      }

      callback(errors, status);
    });
  };
})();
