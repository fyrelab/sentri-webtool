(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * Areapicker to choose a area of a picture
   */
  app.component('areaPicker', {
    bindings: {
      configKey: '@',  // key of the config pair, to use as unique id
      module: '@',  // module to get hook data
      startValue: '@',  // startValue which is set in the beginning
      onChange: '&'  // method to be called, when the selection changes, arguments are the configKey and the value as string
    },

    // as template only a img tag is needed, the rest will be added by javascript
    template: '<img id="jcrop-{{$ctrl.configKey}}" class="areapicker-img">',

    controller: function(DataService, $window) {
      var that = this;
      var jcrop;

      /**
       * Is called in the beginning and loads the hook data using the data_service
       */
      this.$onInit = function() {
        DataService.getData('hookData', that.module).then(function(data) {
          if (data.forms && data.forms.images && data.forms.images[that.configKey]) {
              that.path = data.forms.images[that.configKey].path;
              that.width = data.forms.images[that.configKey].width;
              that.height = data.forms.images[that.configKey].height;
              that.$onChanges();
          }
        });
      };

      /**
       * Is called when something changes.
       * if the jcrop object is not created jet, and all the information is set,
       * create the jcrop object.
       * sets the start value
       */
      this.$onChanges = function(changesObj) {
        if (!that.jcrop && that.path && that.width && that.height) {
          that.createJcrop();
        }

        that.setValue();
      };

      /**
       * Creates an new jcrop object
       */
      this.createJcrop = function() {
        // destroy old jcrop
        if (that.jcrop) {
          that.jcrop.destroy();
        }

        // the element to set the jcrop on
        var element = $('#jcrop-' + that.configKey);

        // continue if all data is available
        if (element.length && that.width && that.height) {
          // calculate the width of the jcrop element, by taking the width of a config-group
          var imgWidth = $('.config-group').width() * 0.95;
          var imgHeight = imgWidth * that.height / that.width;

          // continue if the width is set to a valid value
          if (imgWidth != 0) {

            // set the width and height on the element and set the image
            element.width(imgWidth);
            element.height(imgHeight);
            element.attr("src", that.path);

            // finally create the jcrop object
            that.jcrop = $.Jcrop('#jcrop-' + that.configKey, {
              onChange: that.update,
              bgColor: 'black',
              bgOpacity: .3,
              trueSize: [that.width, that.height]
            });

            // set the value
            that.setValue();
          }
        }
      };

      /**
       * Selects the startValue on the jcrop object
       */
      this.setValue = function() {
        if (that.startValue != '') {
          // first, geht the coords
          var coords = that.stringToCoords(that.startValue);

          // if there are coords and the jcrop object is set, select the coords
          if (coords && that.jcrop) {
            that.jcrop.setSelect([ coords.x, coords.y, coords.x2, coords.y2 ]);
          }
        }
      };

      /**
       * On resize, the jcrop object must be created again, to get the right width
       */
      $window.onresize = function() {
        that.createJcrop();
      };

      /**
       * Parses the coords out of a string
       */
      this.stringToCoords = function(stringValue) {
        var coords = { x: 0, x2: 0, y: 0, y2: 0 };

        var boxPattern = /^BOX\(([0-9]+) ([0-9]+),([0-9]+) ([0-9]+)\)$/;

        var match = boxPattern.exec(stringValue);

        if (match !== null) {
          coords.x = match[1];
          coords.y = match[2];
          coords.x2 = match[3];
          coords.y2 = match[4];

          return coords;
        }

        return null;
      };

      /**
       * makes a string out of coords
       */
      this.coordsToString = function(coords) {
        return 'BOX(' + Math.round(coords.x) +  ' ' + Math.round(coords.y)  + ',' +
                        Math.round(coords.x2) + ' ' + Math.round(coords.y2) + ')';
      };

      /**
       * When the jcrop object updates, the onChange function is called with the new value
       */
      this.update = function(c) {
        that.onChange({ key: that.configKey, value: that.coordsToString(c) });
      };
    }
  });
})();
