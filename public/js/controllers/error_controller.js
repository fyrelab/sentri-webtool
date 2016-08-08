(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('ErrorController', ['$rootScope', function($rootScope) {
    var that = this;

    this.errors = [];

    $rootScope.$on('Error.showError', function(event, args) {
      if (args.length > 0) {
        that.errors = args;
      }
    });
  }]);
})();
