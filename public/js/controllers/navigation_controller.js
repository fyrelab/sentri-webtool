(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('NavigationController', ['$rootScope', '$scope', '$location', '$http', 'DataService', function($rootScope, $scope, $location, $http, DataService) {
    this.items = [
      { title: 'sentri webtool', url: '/' },
      { title: 'Rules', url: '/rules' },
      { title: 'Settings' , url: '/settings', icon: 'fa fa-cog fa-fw settings' },
      { title: 'Sign out' , url: '/signout', icon: 'fa fa-sign-out' }
    ];

    var that = this;

    this.lockStatus = false;

    this.isActive = function(index) {
      return that.items[index].url === $location.path();
    };

    /**
     * Sends a post request to apply the changes.
     */
    this.applyChanges = function() {
      // Assume lock status got removed until it gets refreshed
      DataService.injectData(false, 'lockStatus');

      $http.post('/action/system/apply-changes').then(function(res) {
        // if errors occurred, show them
        if (res.data.errors) {
          $rootScope.$emit('Error.showError', res.data.errors);
        }
      });
    };

    /**
     * Get the lock status as live data. This means that the callback is called every time the lock status
     * changes.
     */
    var revokeLive = DataService.getLiveData(function(data) {
      that.lockStatus = data;
    }, 'lockStatus');

    /**
     * Revoke the live data when this controller is destroyed.
     */
    $scope.$on("$destroy", function() {
      revokeLive();
    });
  }]);
})();
