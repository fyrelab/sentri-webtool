(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('OverviewController', [
    '$http', '$scope', '$rootScope', '$location', '$timeout', 'DataService',
    function($http, $scope, $rootScope, $location, $timeout, DataService) {
      var that = this;

      // Preset values
      this.modules = {};
      this.systemStatus = { running: undefined };
      this.reloadingStatus = true;
      this.controlDisabled = false;

      /**
       * Redirect to module page
       * @param module Module id
       */
      this.openModulePage = function(module) {
        $location.path("/module/" + module);
      };

      DataService.getData('modules').then(function(data) {
        that.modules = data;
      });

      /**
       * Control system (start, stop, restart) and send request to server
       * @param mode 'start'|'stop'|'restart'
       */
      this.controlSystem = function(mode) {
        that.reloadingStatus = true;
        that.controlDisabled = true;

        $http.post('/action/system/control/' + mode)
        .then(function(res) {
          if (res.data.errors) {
            $rootScope.$emit('Error.showError', res.data.errors);
          }

          if (res.data.data) {
            DataService.injectData(res.data.data, 'systemStatus');
          }
        });
      };

      // Get live data for system status
      var revokeLive = DataService.getLiveData(function(data) {
        that.systemStatus = data;

        that.reloadingStatus = false;

        // Enable buttons after 2 seconds
        $timeout(function() {
          that.controlDisabled = false;
        }, 2500);
      }, 'systemStatus');

      $scope.$on("$destroy", function() {
        revokeLive();
      });
    }
  ]);

  // Filter for module table to distinguish between action, event and service modules
  app.filter('moduleType', function() {
    return function(items, type) {
      if (items) {
        switch (type) {
          case "actions":
            return items.filter(function(v) { return v.info.actions.length > 0; });
          case "events":
            return items.filter(function(v) { return v.info.events.length > 0; });
          case "none":
            return items.filter(function(v) { return v.info.events.length == 0 && v.info.actions.length == 0; });
        }
      }
      return [];
    };
  });

})();
