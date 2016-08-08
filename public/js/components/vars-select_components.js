(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * shows the vars of a given type in a multiselect. The value is the keys seperated by ','
   */
  app.component('varsSelect', {
    bindings: {
      configKey: '@',  // key of the config pair
      startValue: '@',  // start value to set in the beginning
      onChange: '&',  // method to be called when the value changes
      vars: '<',  // the vars to show
      type: '@'  // the type of vars to show
    },
    template: '<select id="multiselect" multiple="multiple"></select>',
    controller: function(DataService) {
      var that = this;

      this.$onChanges = function() {
        // create array with options
        var options = [];

        that.vars.forEach(function(variable) {
          if (variable.type == that.type) {
            options.push({
              label: variable.title,
              value: variable.key,
              title: variable.description
            });
          }
        });

        // initialize multiselect
        $('#multiselect').multiselect({ onChange: that.update });
        $('#multiselect').multiselect('dataprovider', options);
        $('#multiselect').multiselect('select', that.startValue.split(','));
      };

      /**
       * is called when the selection changes and calls the onChanges function of the parent with the new value
       */
      this.update = function(element, checked) {
        var valueArray = $('#multiselect').val();
        var valueString = valueArray ? valueArray.toString() : '';
        that.onChange({ key: that.configKey, value: valueString });
      };
    }
  });

})();
