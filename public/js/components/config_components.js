(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * Component which shows many config values
   */
  app.component('config', {
    bindings: {
      prefixId: '<',  // a prefix to set in front of the id
      configValues: '<',  // all the values to use with ng-model
      configInfo: '<',  // info of the config, to show the title and description
      module: '@',  // module name, to get hook data if needed
      vars: '<'  // vars for the vars-select config type
    },
    templateUrl: '/views/configvalues',

    controller: function() {
      var that = this;

      /**
       * Sets the value to a given key. Is needed by components inside this component.
       * For example: areapicker, dyn-select
       */
      this.setValue = function(key, value) {
        that.configValues[key] = value;
      };

      this.getHint = function(type, config) {
        if (config.min && config.max) {
          return "Must be an " + type + " between " + config.min + " and " + config.max;
        }

        if (config.min) {
          return "Must be an " + type + " greater than " + config.min;
        }

        if (config.max) {
          return "Must be an " + type + " lower than " + config.max;
        }

        return "Must be an " + type;
      };
    }
  });

  /**
   * Directive to show a tooltip when the mouse hovers a element
   */
  app.directive('tooltip', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $(element).hover(function() {
                // on mouseenter
                $(element).tooltip('show');
            }, function() {
                // on mouseleave
                $(element).tooltip('hide');
            });
        }
    };
  });
})();
