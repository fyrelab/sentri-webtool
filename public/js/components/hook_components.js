(function() {
  'use strict';

  var app = angular.module('webtool');

  function genHookObj(id, loc) {
    return {
      module: id,
      url: '/hooks/' + id + '/' + loc
    };
  }

  /** Hooks controller for listing all hooks */
  app.component('hooks', {
    bindings: {
      hookLoc: '@',
      hookModule: '@'
    },
    template: '<hook ng-repeat="hook in $ctrl.hooks" hook-obj="hook"><hr ng-if="$last"></hook>',
    controller: function(DataService) {
      var that = this;

      this.$onInit = function() {
        that.hooks = [];

        DataService.getData('modules').then(function(modules) {
          if (!that.hookModule) {
            modules.list.forEach(function(v, k) {
              if (v.info.hooks && v.info.hooks.indexOf(that.hookLoc) != -1) {
                that.hooks.push(genHookObj(v.id, that.hookLoc));
              }
            });
          } else {
            var module = modules.map[that.hookModule];

            if (module.info.hooks && module.info.hooks.indexOf(that.hookLoc) != -1) {
              that.hooks.push(genHookObj(that.hookModule, that.hookLoc));
            }
          }
        });
      };
    }
  });

  app.component('hook', {
    bindings: {
      hookObj: '<'
    },
    template: '<div ng-include="$ctrl.hookObj.url"></div>',
    controller: function(DataService) {
      var that = this;

      this.getConf = function(key) {
        var value = null;

        if (that.conf.configuration) {
          that.conf.configuration.some(function(conf) {
            if (conf.key == key) {
              value = conf.value;
              return true;
            }
          });
        }

        // Fallback info file
        if (value === null && that.module.info) {
          var len = that.module.info.configuration.length;

          that.module.info.configuration.some(function(conf) {
            if (conf.key == key) {
              value = conf.default;
              return true;
            }
          });
        }

        return (value ? value : '');
      };

      this.$onInit = function() {
        that.data = {};
        that.conf = {};
        that.module = {};

        DataService.getData('hookData', that.hookObj.module).then(function(data) {
          that.data = data;
        });

        DataService.getData('moduleConf', that.hookObj.module).then(function(data) {
          that.conf = data;
        });

        DataService.getData('modules').then(function(modules) {
          that.module = modules.map[that.hookObj.module];
        });
      };
    }
  });
})();
