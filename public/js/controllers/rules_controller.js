(function() {
  'use strict';

  var app = angular.module('webtool');

  app.controller('RulesController', [
    'DataService', '$location', '$http', '$filter',
    function(DataService, $location, $http, $filter) {
      var that = this;

      this.rules = [];
      this.modules = { list: [], map: {} };
      this.event = {};
      this.action = {};

      // Gets the title of an event from the info file matching the id
      this.getEventTitle = function(rule) {
        var name = rule.event.key;
        var module = that.modules.map[rule.event.module];

        if (module) {
          module.info.events.some(function(w) {
            if (w.key == name) {
              name = w.title;
              return true;
            }
          });
        }

        return name;
      };

      this.getActionTitle = function(rule) {
        var name = rule.action.key;

        if (that.modules.map) {
          var module = that.modules.map[rule.action.module];

          if (module) {
            module.info.actions.some(function(w) {
              if (w.key == name) {
                name = w.title;
                return true;
              }
            });
          }
        }

        return name;
      };

      // Gets the description of an event from the info file matching the id
      this.getEventDescription = function(rule) {
        var key = rule.event.key;
        var description;
        var module = that.modules.map[rule.event.module];

        if (module) {
          module.info.events.some(function(w) {
            if (w.key == key) {
              description = w.description;
              return true;
            }
          });
        }

        return description;
      };

      this.getActionDescription = function(rule) {
        var key = rule.action.key;
        var description;
        var module = that.modules.map[rule.action.module];

        if (module) {
          module.info.actions.some(function(w) {
            if (w.key == key) {
              description = w.description;
              return true;
            }
          });
        }

        return description;
      };

      // Gets the title of an event configuration variable from an info file
      this.getEventConfigTitle = function(rule, id) {
        var name = rule.event.key;
        var title = id;
        var module = that.modules.map[rule.event.module];

        if (module) {
          module.info.events.some(function(w) {
            if (w.key == name) {
              w.configuration.forEach(function(conf) {
                if (conf.key == id) {
                  title = conf.title;
                  return true;
                }
              });
            }
          });
        }

        return title;
      };

      // Gets the title of an action configuration variable from an info file
      this.getActionConfigTitle = function(rule, id) {
        var name = rule.action.key;
        var title = id;
        var module = that.modules.map[rule.action.module];

        if (module) {
          module.info.actions.some(function(w) {
            if (w.key == name) {
              w.configuration.forEach(function(conf) {
                if (conf.key == id) {
                  title = conf.title;
                  return true;
                }
              });
            }
          });
        }

        return title;
      };

      // Gets the description of an event configuration variable from an info file
      this.getEventConfigDescription = function(rule, id) {
        var name = rule.event.key;
        var description = id;
        var module = that.modules.map[rule.event.module];

        if (module) {
          module.info.events.some(function(w) {
            if (w.key == name) {
              w.configuration.forEach(function(conf) {
                if (conf.key == id) {
                  description = conf.description;
                  return true;
                }
              });
            }
          });
        }

        return description;
      };

      // Gets the description of an action configuration variable from an info file
      this.getActionConfigDescription = function(rule, id) {
        var name = rule.action.key;
        var description = id;
        var module = that.modules.map[rule.action.module];

        if (module) {
          module.info.actions.some(function(w) {
            if (w.key == name) {
              w.configuration.forEach(function(conf) {
                if (conf.key == id) {
                  description = conf.description;
                  return true;
                }
              });
            }
          });
        }

        return description;
      };

      this.extendRule = function(index) {
        that.extended = index;
      };

      this.toggleRule = function(index) {
        if (that.extended === index) {
          that.extended = null;
        } else {
          that.extended = index;
        }
      }

      this.toggleButton = function(index) {
        if (that.extended == index) {
          return 'fa-chevron-down';
        } else {
          return 'fa-chevron-up';
        }
      };

      this.getTimeFromSeconds = function(seconds) {
        var hours = Math.floor(seconds / 3600);
        seconds -= 3600 * hours;

        var minutes = Math.floor(seconds / 60);
        seconds -= 60 * minutes;

        return (hours > 0 ? hours + 'h ' : '') +
               (minutes > 0 ? minutes + 'min ' : '') +
               (seconds > 0 ? seconds + 's' : '');
      };

      this.createNewRule = function() {
        $location.path('/rule/new/config');
      };

      this.saveRules = function() {
        $http.post('/action/rules/config', { rules: that.rules } ).then(function() {
          DataService.invalidateData('lockStatus');
        });
      };

      this.disableAll = function(value) {
        var filteredRules = $filter('filter')(that.rules, this.query);

        // Disable all rules with current filter
        filteredRules.forEach(function(rule) {
          if (!rule.constraints) {
            rule.constraints = {};
          }

          rule.constraints.is_disabled = value;
        });

        that.saveRules();
      };

      this.editRule = function(rule) {
        that.rules.some(function(r, key) {
          if (r == rule) {
            $location.path('rule/' + key + '/config');
            return true;
          }
        });
      };

      DataService.getData('rules').then(function(data) {
        that.rules = data.rules;
      });

      DataService.getData('modules').then(function(data) {
        that.modules = data;
      });
    }
  ]);

  app.filter('configEventExists', function(){
    return function(items, rule, modules) {
      var eventName = rule.event.key;
      var module = modules.map[rule.event.module];

      if (module) {
        var existing = {};

        module.info.events.some(function(event) {
          if (event.key == eventName) {
            event.configuration.forEach(function(conf) {
              existing[conf.key] = true;
            });

            return true;
          }
        });

        return items.filter(function(e) {
          return existing[e.id];
        });
      }

      return items;
    };
  });

  app.filter('configActionExists', function(){
    return function(items, rule, modules) {
      var actionName = rule.action.key;
      var module = modules.map[rule.action.module];

      if (module) {
        var existing = {};

        module.info.actions.some(function(action) {
          if (action.key == actionName) {
            action.configuration.forEach(function(conf) {
              existing[conf.key] = true;
            });

            return true;
          }
        });

        return items.filter(function(e) {
          return existing[e.id];
        });
      }

      return items;
    };
  });
})();
