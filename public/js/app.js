/**
 * This is the angularJS app for the whole system
 */

(function() {
  'use strict';
  var app = angular.module('webtool', ['ngRoute', 'ngAnimate', 'vjs.video']);

  // Enable hrefs for sentri:// to make an injection on apps
  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|sentri):/);
  }]);
})();
