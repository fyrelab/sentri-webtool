(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('LoadingController', ['$rootScope', function($rootScope) {
    var that = this;

    this.loading = true;

    $rootScope.$on('Loading.enable', function() {
      that.loading = true;
    });

    $rootScope.$on('Loading.disable', function() {
      that.loading = false;
    });
  }]);
})();
