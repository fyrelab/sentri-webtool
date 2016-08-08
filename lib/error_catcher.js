/**
 * error catcher
 */
(() => {
  'use strict';

  class ErrorCatcher {
    constructor() {
      this.errors = new Array();
    }

    /**
     * Add an error message
     * @param error Message as string or full object
     */
    addError(error) {
      if (typeof error === 'string') {
        this.errors.push({ message: error });
      } else {
        this.errors.push(error);
      }
      return this;
    };

    /**
     * Add multiple error messages from either another ErrorCatcher or an array
     * @param errors Error array or ErrorCatcher
     */
    addErrors(errors) {
      if (errors instanceof Array) {
        this.errors = this.errors.concat(errors);
      } else {
        this.errors = this.errors.concat(errors.errors);
      }
      return this;
    }

    hasErrors() {
      return this.errors.length > 0;
    }
  }

  exports.ErrorCatcher = ErrorCatcher;

})();
