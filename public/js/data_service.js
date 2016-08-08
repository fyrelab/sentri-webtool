/**
 * DataService
 * The DataService is the interface between the controllers and the server to request system data
  */
(function() {
  'use strict';

  var app = angular.module('webtool');

  // Provide for indicating loading data with httpProvider for a loading indicator
  app.config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        'request': function(config) {
          $rootScope.$emit('Loading.enable');
          return config || $q.when(config);
        },
        'response': function(response) {
          $rootScope.$emit('Loading.disable');
          return response || $q.when(response);
        }
      };
    });
  });

  app.service('DataService', ['$http', '$rootScope', '$q', function($http, $rootScope, $q) {
    var that = this;

    /**
     * List of data groups to provide different kind of data that can be requested
     * Depending on given information the data is stored differently and either read from cache
     * or freshly requested from the server.
     * The data group is saved in an array map, so requests use string keys to identify the data group.
     *
     * Options:
     * url (required [or urlFunc], path to data)
     * urlFunc (required [or url], function that generates path depending on data group and additional parameters)
     * expires (required, specifies the time in seconds until data is invalid,
     *          0 is always invalid, false is never invalid)
     * storageType (optional [options: map], data is not stored per data type but for different keys in a map)
     * storageID (optional [required when using storageType map],
     *            function returning the key the data should be stored in)
     * postprocessFunc (optional, function processing data after receiving and before storing)
     */
    this.dataGroups = {
      rules: {
        url: '/json/rules.json',
        expires: 60
      },
      modules: {
        url: '/json/modules.json',
        expires: 60,
        postprocessFunc: function(data) {
          var newData = { map: [], list: [] }
          newData.list = data;

          data.forEach(function(v, k) {
            newData.map[v.id] = v;
          });

          return newData;
        }
      },
      hookData: {
        urlFunc: function(group, module) {
          return '/json/hooks/' + module + '/data.json';
        },
        storageType: 'map',
        storageID: function(group, module) {
          return module;
        },
        expires: 10
      },
      moduleConf: {
        urlFunc: function(group, module) {
          return '/json/config/' + module + '/config.json';
        },
        storageType: 'map',
        storageID: function(group, module) {
          return module;
        },
        expires: 10
      },
      systemStatus: {
        url: '/json/system/status.json',
        expires: 10
      },
      lockStatus: {
        url: '/json/system/locked.json',
        expires: 10
      },
      userData: {
        url: '/json/userdata.json',
        expires: 60
      }
    };

    this.data = {};

    /**
     * Private function to check if data is expired
     * @param group The name of the data group
     * @param storageID (optional) For maps the storage ID the expiration should be checked for
     * @return boolean Is it expired?
     */
    var isExpired = function(group, storageID) {
      if (!that.data[group]) {
        return true;
      }

      var dataGrp = that.dataGroups[group];

      if (dataGrp.storageType && dataGrp.storageType == 'map') {
        var storageID = dataGrp.storageID.apply(dataGrp, arguments);

        if (!that.data[group][storageID] ||
            that.data[group][storageID].invalid ||
            that.data[group][storageID].loading) {
          // Storage either doesn't exist, is invalid or already loading
          return true;
        } else {

          if (dataGrp.expires === false) {
            // Storage exists and cannot expire
            return false;
          }

          // Storage exists, check expiration date
          return (that.data[group][storageID].timestamp + dataGrp.expires < (Date.now() / 1000));
        }
      } else {
        if (that.data[group].invalid || that.data[group].loading) {
          // Storage is invalid or already loading
          return true;
        }

        if (dataGrp.expires === false) {
          // Storage exists and cannot expire
          return false;
        }

        // Storage exists, check expiration date
        return (that.data[group].timestamp + dataGrp.expires < (Date.now() / 1000));
      }
    };

    /**
     * Get data ONCE for a given group and additional parameters
     *
     * Note: If the data is expired and live listeners are registered this will cause a reload of data on the webserver
     * for live data to supply them with the new data
     *
     * @param group The name of the data group
     * @param ... Additional arguments to be used for storageID or urlFunc
     * @return promise with data as first argument
     */
    this.getData = function(group) {
      var dataGrp = that.dataGroups[group];
      var isMap = (dataGrp.storageType && dataGrp.storageType == 'map');
      var storageID;
      var args = Array.from(arguments);

      // Get storage ID for mapping if storage type is map
      if (isMap) {
        storageID = dataGrp.storageID.apply(dataGrp, args);
      }

      // Check if data is actually expired
      if (isExpired(group, storageID)) {
        var oldObj;

        // Get existing object in data storage
        if (isMap) {
          if (that.data[group]) {
            oldObj = that.data[group][storageID];
          }
        } else {
          oldObj = that.data[group];
        }

        // Check if object exists and data is already loading
        if (oldObj && oldObj.loading) {
          // Create promise and wait in queue for first requester to get response
          var deferred = $q.defer();
          oldObj.loadingQueue.push(deferred);

          return deferred.promise;
        }

        // Create new data object
        var obj = { loading: true, loadingQueue: [], listeners: [], timestamp: 0, invalid: true };

        if (oldObj) {
          obj.listeners = oldObj.listeners;
        }

        // Set origin of storage for direct storage and map
        if (isMap) {
          if (!that.data[group]) {
            that.data[group] = {};
          }

          that.data[group][storageID] = obj;
        } else {
          that.data[group] = obj;
        }

        // Get url of request
        var url;
        if (typeof dataGrp.urlFunc === 'function') {
          url = dataGrp.urlFunc.apply(dataGrp, args);
        } else {
          url = dataGrp.url;
        }

        // Do http request
        return $http.get(url)
          .then(function(res) {
            if (res.data.errors) {
              $rootScope.$emit('Error.showError', res.data.errors);
            }

            if (res.data.data) {
              var injectArgs = [ res.data.data ].concat(args);
              that.injectData.apply(null, injectArgs);
            }

            if (isMap) {
              return that.data[group][storageID].storage;
            } else {
              return that.data[group].storage;
            }
          }, function(err) {
            obj.loading = false;

            if (err.status === 403) {
              window.location = '/signin';
            }
          });
      } else {
        // Data is not expired and existing, simply return value promise
        if (isMap) {
          return $q.resolve(that.data[group][storageID].storage);
        } else {
          return $q.resolve(that.data[group].storage);
        }
      }
    };

    /**
     * Invalidate data group (if map is used as storageType only the single storage unit is invalidated)
     *
     * Note: If live listeners are registered data will be updated by a new request to the webserver
     *
     * @param group The name of the data group
     * @param ... Additional arguments to be used for storageID or urlFunc
     */
    this.invalidateData = function(group) {
      var dataGrp = that.dataGroups[group];
      var isMap = (dataGrp.storageType && dataGrp.storageType == 'map');
      var storageID;

      if (isMap) {
        storageID = dataGrp.storageID.apply(dataGrp, arguments);
      }

      var obj;

      // Get existing object in data storage
      if (isMap) {
        obj = that.data[group][storageID];
      } else {
        obj = that.data[group];
      }

      obj.invalid = true;

      // Need to update data if there are live listeners
      if (obj.listeners && obj.listeners.length > 0) {
        that.getData.apply(null, arguments);
      }
    };

    /**
     * Inject data in storage field with own data
     *
     * Note: Can be useful to temporarily manipulate data or if a newer version is available outside of DataService
     *       If live listeners are registered those are updated with the injected data.
     *
     * @param data Data to be stored
     * @param group The name of the data group
     * @param ... Additional arguments to be used for storageID or urlFunc
     */
    this.injectData = function(data, group) {
      var dataGrp = that.dataGroups[group];

      // Remove data from arguments stack for apply
      var args = Array.prototype.slice.call(arguments, 1);

      // Post process data if necessary
      if (typeof dataGrp.postprocessFunc === 'function') {
        data = dataGrp.postprocessFunc(data);
      }

      var obj;

      if (dataGrp.storageType && dataGrp.storageType == 'map') {
        // Create group object if necessary
        if (!that.data[group]) {
          that.data[group] = {};
        }

        // Get storage ID for storage map
        var storageID = dataGrp.storageID.apply(dataGrp, args);

        if (!that.data[group][storageID]) {
          that.data[group][storageID] = {};
        }

        obj = that.data[group][storageID];
      } else {
        if (!that.data[group]) {
          that.data[group] = {};
        }

        obj = that.data[group];
      }

      // Set new data
      obj.timestamp = Date.now() / 1000;
      obj.storage = data;
      obj.invalid = false;

      // Disable loading
      obj.loading = false;

      // Resolve waiting promises on same data
      if (obj.loadingQueue) {
        obj.loadingQueue.forEach(function(v, k) {
          v.resolve(obj.storage);
        });
      }

      // Delete loading queue
      obj.loadingQueue = [];

      // Notify all listeners
      if (obj.listeners) {
        obj.listeners.forEach(function(v) {
          v(obj.storage);
        });
      }
    };

    /**
     * Get live data and call a callback whenever the data expires or updates
     *
     * Note: The callback should be removed before end of usage, otherwise non-existing listerners are still called
     *       If expires is set to 0 (always expired) the data is only updated manually
     *       (every time getData, invalidateData, getLiveData or injectData is called)
     *
     * @param liveCallback(data) Callback function for updated data. First argument is the data
     * @param group The name of the data group
     * @param ... Additional arguments to be used for storageID or urlFunc
     * @return Callback to revoke listener from list
     */
    this.getLiveData = function(liveCallback, group) {
      var dataGrp = that.dataGroups[group];
      var isMap = (dataGrp.storageType && dataGrp.storageType == 'map');
      var storageID;

      // Remove liveCallback from arguments stack for apply
      var args = Array.prototype.slice.call(arguments, 1);

      if (isMap) {
        storageID = dataGrp.storageID.apply(dataGrp, args);
      }

      that.getData.apply(null, args).then(function(data) {
        var obj;

        // Get existing object in data storage
        if (isMap) {
          obj = that.data[group][storageID];
        } else {
          obj = that.data[group];
        }

        // Add new listener to listeners list and get index
        obj.listeners.push(liveCallback);

        if (obj.listeners.length == 1 && dataGrp.expires !== false && dataGrp.expires > 0) {
          // Data expires in a certain period of time and this is the first listener
          // For that case an interval must be started for regularly updating data

          var distribute = function() {
            // Get current object of data set
            var obj;

            if (isMap) {
              obj = that.data[group][storageID];
            } else {
              obj = that.data[group];
            }

            if (obj.listeners && obj.listeners.length > 0) {
              // Listeners are still there, continue with listening

              if (isExpired(group, storageID)) {
                // Is expired: update data

                that.getData.apply(null, args).then(function(data) {
                  // Call all listener callbacks
                  obj.listeners.forEach(function(v, k) {
                    v(data);
                  });
                });

                // Set regular timeout for next refresh
                setTimeout(distribute, dataGrp.expires * 1000);
              } else {
                // Distribute was called when not being expired yet, so refresh when period ends
                var nextInvalidate = (obj.timestamp + dataGrp.expires) * 1000 - Date.now();
                setTimeout(distribute, nextInvalidate);
              }
            }
          };

          distribute();
        }

        // Simply return current data to new live data listener
        liveCallback(data);
      });

      // Return revoke live data function
      return function() {
        // Get data in case object was not created yet
        that.getData.apply(null, args).then(function() {
          var obj;

          if (isMap) {
            obj = that.data[group][storageID];
          } else {
            obj = that.data[group];
          }

          // Delete callback from listeners list
          var idx = obj.listeners.indexOf(liveCallback);

          if (idx >= 0) {
            obj.listeners.splice(idx, 1);
          }
        });
      };
    };
  }]);
})();
