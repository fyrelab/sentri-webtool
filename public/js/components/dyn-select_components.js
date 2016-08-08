(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * Component for a dyn select. Uses hook data to get the possible options.
   */
  app.component('dynSelect', {
    bindings: {
      configKey: '@',  // key of the config pair
      module: '@',  // module name to get the hook data
      startValue: '@',  // start value to set in the beginning
      onChange: '&'  // method to be called when the value changes
    },
    template: '<select class="c-select" ng-model="$ctrl.startValue" ng-change="$ctrl.update()">' +
              '<option ng-repeat="item in $ctrl.options" value="{{item.value}}">{{item.title}}</option>' +
              '</select>',
    controller: function(DataService) {
      var that = this;

      /**
       * Loads the hook data and sets the options loaded
       */
      this.$onInit = function() {
        DataService.getData('hookData', that.module).then(function(data) {
          if (data.forms && data.forms.options && data.forms.options[that.configKey]) {
            that.options = data.forms.options[that.configKey];
          }
        });
      };

      /**
       * Is called when the value changes, calls the onChanges function of the parent
       */
      this.update = function() {
        that.onChange({ key: that.configKey, value: that.startValue });
      };
    }
  });

})();
