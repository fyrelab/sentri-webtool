(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('ModuleController', ['DataService', '$route', '$location', function(DataService, $route, $location) {
    var that = this;

    this.module = {};
    this.id = $route.current.params.module;

    DataService.getData('rules').then(function(data) {
      that.rules = data.rules;
    });

    DataService.getData('modules').then(function(modules) {
      that.module = modules.map[that.id];
    });

    this.openConfigPage = function() {
      $location.path("/module/" + this.id + "/config");
    };

    this.rules = [];

    this.createNewRule = function(type, module, key) {
      $location.path('rule/new/config/' + type + '/' + module + '/' + key);
    }
  }]);
})();
