(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * module config controller
   */
  app.controller('ModuleConfigController', ['DataService', '$http', '$route', '$location', function(DataService, $http, $route, $location) {
    var that = this;

    this.module = {};  // the module
    this.id = $route.current.params.module;  // the id of the module (to load it)
    this.config = {};  // the config of the module

    /**
     * loads the module via the data_service and calls loadConfig()
     */
    DataService.getData('modules').then(function(data) {
      that.module = data.map[that.id];
      that.loadConfig();
    });

    /**
     * Loads the module config via the data_service, and sets the config object
     */
    this.loadConfig = function() {
      DataService.getData('moduleConf', that.id).then(function(conf) {

        // loop over all possible configuration and set the default values
        if (that.module.info.configuration) {
          that.module.info.configuration.forEach(function(v) {
            that.config[v.key] = v.default;
          });
        }

        // loop over all conf values, and set them to replace the default values
        if (conf.configuration) {
          conf.configuration.forEach(function(v) {
            that.config[v.key] = v.value;
          });
        }
      });
    };

    /**
     * makes a post request with the new module config
     */
    this.applySettings = function() {
      // save the configuration
      // note: in the config array there are JSON Objects like: { id: <key>, value: <value> }
      //       not: { <key>: <value> } like in the event_config array which is be used in this controller
      var config = { configuration: [] };

      Object.keys(that.config).forEach(function(key) {
        if (typeof that.config[key] === 'string') {
          config.configuration.push({ key: key, value: that.config[key] });
        }
      });

      // make the post request with the new config file
      $http.post('/action/modules/' + that.id + '/config', config).then(function() {
        // invalidate the data to force the data_service to reload the data next time
        DataService.invalidateData('lockStatus');
        DataService.invalidateData('moduleConf', that.id);
      });
      // go back to the module overview
      $location.path('module/' + that.id);
    };

  }]);  // ModuleConfigController
})();
