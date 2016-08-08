/**
 * This is the same as app.js but used for direct hooks with less dependencies
 */

(function() {
  'use strict';
  var app = angular.module('webtool', ['vjs.video']);

  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|sentri):/);
  }]);
})();
