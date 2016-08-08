(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * rule config controller
   */
  app.controller('RuleConfigController', ['DataService', '$http', '$location', '$route', function(DataService, $http, $location, $route) {
    var that = this;

    // id of the rule in the rules array
    this.id = $route.current.params.id;


    this.rules = []; // array of all rules
    this.rule = { constraints: {} };  // the current rule
    this.modules = { list: [] };  // all modules
    this.eventModule = {};  // the module wich is used for the event
    this.actionModule = {};  // the module wich is used for the action
    this.event = {};  // the event wich is choosen
    this.action = {};  // the action which is choosen

    this.eventConfig = {};  // the event config to use in the config component
    this.actionConfig = {};  // the action config to use in the config component

    /**
     * Loads all the rules
     */
    this.loadRule = function() {
      DataService.getData('rules').then(function(data) {
        // set rules to loaded array, or to an empty array if there is no loaded array
        that.rules = data.rules ? data.rules : [];

        if (data.rules && data.rules.length > that.id) {
          // if rules are found and this rule is one of them: set it
          that.rule = jQuery.extend(true, {}, data.rules[that.id]);
        } else if ($route.current.params.type == 'event') {
          // if params.type == event, this should be a new rule with the event given in the params
          that.rule.event = {};
          that.rule.event.module = $route.current.params.module;
          that.rule.event.key = $route.current.params.key;

        } else if ($route.current.params.type == 'action') {
          // if params.type == action, this should be a new rule with the action given in the params
          that.rule.action = {};
          that.rule.action.module = $route.current.params.module;
          that.rule.action.key = $route.current.params.key;
        }

        that.loadEventModule();
        that.loadActionModule();
      });
    };

    /**
     * loads the modules
     */
    DataService.getData('modules').then(function(data) {
      that.modules = data;
    });

    /**
     * if a event is already set, this function loads the eventModule
     * and calls loadEvent() to load the event
     */
    this.loadEventModule = function() {
      if (that.rule.event) {
        DataService.getData('modules').then(function(data) {
          that.eventModule = data.map[that.rule.event.module];
          that.loadEvent();
        });
      }
    };


    /**
     * if a action is already set, this function loads the action module
     * and calls loadAction() to load the action
     */
    this.loadActionModule = function() {
      if (that.rule.action) {
        DataService.getData('modules').then(function(data) {
          that.actionModule = data.map[that.rule.action.module];
          that.loadAction();
        });
      }
    };

    /**
     * load the event that is choosen. Also fills the eventConfig with the set values, or
     * with the default values if there are none
     */
    this.loadEvent = function() {
      var eventFound = false;

      // loop over all events of the eventModule and check if the key is right
      if (that.rule.event.key) {
        that.eventModule.info.events.every(function(event) {
          if (event.key == that.rule.event.key) {
            that.event = event;
            eventFound = true;

            return false;
          }

          return true;
        });
      }

      // if event was not found but only one event exists preselect that one
      if (!eventFound && that.eventModule.info.events.length === 1) {
        that.rule.event.key = that.eventModule.info.events[0].key;
        that.event =  that.eventModule.info.events[0];
        eventFound = true;
      }

      // if no event was found, just set event to an empty js object
      if (!eventFound) {
        that.event = {};
      } else if (that.event.configuration) {
        // Set default values for event
        that.event.configuration.forEach(function(event) {
          // set the value to the default value
          that.eventConfig[event.key] = event.default;
        });

        // Override default values with existing values
        if (that.rule.event.configuration) {
          that.rule.event.configuration.forEach(function(event) {
            that.eventConfig[event.id] = event.value;
          });
        }
      }
    };

    /**
     * load the action that is choosen. Also fills the actionConfig with the set values, or
     * with the default values if there are none
     */
    this.loadAction = function() {
      var actionFound = false;

      // loop over all actions of the actionModule and check if the key is right
      for (var i = 0; i < that.actionModule.info.actions.length && !actionFound; i++) {
        if (that.actionModule.info.actions[i].key == that.rule.action.key) {
          that.action = that.actionModule.info.actions[i];
          actionFound = true;
        }
      }

      // if action was not found but only one action exists, use that
      if (!actionFound && that.actionModule.info.actions.length === 1) {
        that.rule.action.key = that.actionModule.info.actions[0].key;
        that.action =  that.actionModule.info.actions[0];
        actionFound = true;
      }

      // if no action was found, just set action to an empty js object
      if (!actionFound) {
        that.action = {};
      } else if (that.action.configuration) {
        // Set default values for event
        that.action.configuration.forEach(function(action) {
          // set the value to the default value
          that.actionConfig[action.key] = action.default;
        });

        // Override default values with existing values
        if (that.rule.action.configuration) {
          that.rule.action.configuration.forEach(function(action) {
            that.actionConfig[action.id] = action.value;
          });
        }
      }
    };

    /**
     * saves the settings to the rules array and makes a post request with the
     * new rules
     */
    this.applySettings = function() {
      // save the event configuration
      // note: in the config array there are JSON Objects like: { id: <key>, value: <value> }
      //    not: { <key>: <value> } like in the eventConfig array which is be used in this controller
      that.rule.event.configuration = [];
      Object.keys(that.eventConfig).forEach(function(key) {
        if (that.eventConfig[key] != '') {
          that.rule.event.configuration.push({ id: key, value: that.eventConfig[key] });
        }
      });

      // save the action configuration
      // note: in the config array there are JSON Objects like: { id: <key>, value: <value> }
      //    not: { <key>: <value> } like in the eventConfig array which is be used in this controller
      that.rule.action.configuration = [];
      Object.keys(that.actionConfig).forEach(function(key) {
        if (that.actionConfig[key] != '') {
          that.rule.action.configuration.push({ id: key, value: that.actionConfig[key] });
        }
      });

      if (that.id == 'new') {
        // if this was a new rule, push it to the array
        that.rules.push(that.rule);
      } else {
        // if this was a edit of a existing rule, replace the existing rule
        that.rules[that.id] = that.rule;
      }

      // make the post request with the new rules array
      $http.post('/action/rules/config', { rules: that.rules } ).then(function() {
        // invalidate the data to force the data_service to reload the data next time
        DataService.invalidateData('lockStatus');
        DataService.invalidateData('rules');
      });

      // go back to the rules
      $location.path('/rules');
    };

    /**
     * deletes the current rule
     */
    this.deleteRule = function() {
      // make sure the rule id is properly set and remove this rule from the rules array
      if (that.id >= 0) {
        that.rules.splice(that.id, 1);
      }

      // make the post request with the new rules array
      $http.post('/action/rules/config', { rules: that.rules }).then(function() {
        // invalidate the data to force the data_service to reload the data next time
        DataService.invalidateData('lockStatus');
        DataService.invalidateData('rules');
      });
      // go back to the rules
      $location.path('/rules');
    };

    // start working by loading the rules first
    this.loadRule();
  }]);


  /**
   * angular directive to check that the rule name is unique. Is used as a validator.
   * This means that if the rule name is not unique, the form will be invalid an can't be
   * sent. Also the form will have the class ng-invalid.
   */
  app.directive('uniqueRuleName', function() {
    return {
      scope: {
        uniqueRuleName: '=',  // id of the current rule
        rulesArray: '='  // all rules
      },
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$validators.uniqueRuleName = function(modelValue, viewValue) {

          // loop over rules and check for equal titles
          // if no rule with a same name was found it's valid
          // if it's not the same rule and the title is equal it's not valid
          return scope.rulesArray.every(function(rule, i) {
            return (i == scope.uniqueRuleName || rule.title != viewValue);
          });
        };
      }
    };
  });
})();
