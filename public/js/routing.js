/**
 * The angularJS routing for all pages available on the webtool and define there urls and controllers
 */

(function() {
  'use strict';

  var app = angular.module('webtool');

  app.config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/views/overview',
        controller: 'OverviewController',
        controllerAs: 'ovwCtrl'
      })
      .when('/rules', {
        templateUrl: '/views/rules',
        controller: 'RulesController',
        controllerAs: 'rlsCtrl'
      })
      .when('/module/:module', {
        templateUrl: '/views/module',
        controller: 'ModuleController',
        controllerAs: 'modCtrl'
      })
      .when('/module/:module/config', {
        templateUrl: '/views/moduleconfig',
        controller: 'ModuleConfigController',
        controllerAs: 'modConfCtrl'
      })
      .when('/rule/:id/config', {
        templateUrl: '/views/ruleconfig',
        controller: 'RuleConfigController',
        controllerAs: 'ruleConfCtrl'
      })
      .when('/rule/:id/config/:type/:module/:key', {
        templateUrl: '/views/ruleconfig',
        controller: 'RuleConfigController',
        controllerAs: 'ruleConfCtrl'
      })
      .when('/settings', {
        templateUrl: '/views/settings',
        controller: 'SettingsController',
        controllerAs: 'stgCtrl'
      })
      .when('/signout', {
        template: '',
        controller: function() {
          window.location = '/signout';
        }
      })
      .otherwise({
        redirectTo: '/'
      });

      $locationProvider.html5Mode(true);
  });
})();
