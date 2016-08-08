(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('SettingsController', ['$rootScope', 'DataService', function($rootScope, DataService) {
    var that = this;

    this.user = '';
    this.email = '';

    DataService.getData('userData').then(function(data) {
      that.user = data.user;
      that.email = data.email;
    });
  }]);
})();
