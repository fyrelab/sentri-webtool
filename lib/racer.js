/**
 * Racer to handle race conditions
 */
(() => {
  'use strict';

  /**
   * Private method to make callback run
   * @param racer Racer object to apply run to
   * @param runner Callback of an attendee
   */
  var makeRun = (racer, runner) => {
    runner.call(
      this,
      () => {  // done function to decrement runners and if last one call final
        if (--racer.activeRunners == 0 && racer.isRunning) {
          // All runners done, call final callback
          racer.finalCallback.call(this);
          racer.isRunning = false;
        }
      },
      (err) => {  // error function to directly call error callback and stop race
        if (racer.activeRunners > 0 && racer.isRunning) {
          racer.activeRunners = 0;
          racer.isRunning = false;
          if (typeof racer.errorCallback === 'function') {
            racer.errorCallback.call(this, err);
          }
        }
      }
    );
  }

  class Racer {
    /**
     * Create racer with final callback
     */
    constructor() {
      this.attendees = new Array();
      this.isRunning = false;
      this.activeRunners = 0;

      return this;
    }

    /**
     * Add a callback to the racer list
     * @param callback function to the handler being executed when applying run
     */
    add(callback) {
      this.attendees.push(callback);

      if (this.isRunning) {
        // Add runner to active race
        this.activeRunners++;
        makeRun.call(null, this, callback);
      }

      return this;
    }

    /**
     * Runs all callbacks added to the racer and when all done the final one given with the constructor
     * @param finalCallback function after all racers are done
     * @param errorCallback [optional] function called if racer calls error function
     */
    run(finalCallback, errorCallback) {
      if (!this.isRunning) {
        var that = this;

        this.finalCallback = finalCallback;
        this.errorCallback = errorCallback;

        this.isRunning = true;
        this.activeRunners = this.attendees.length;

        // Start the race
        this.attendees.forEach((v) => {
          makeRun.call(null, that, v);
        });
      }
    }
  }

  exports.Racer = Racer;
})();
