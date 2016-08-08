(function() {
  'use strict';

  var app = angular.module('webtool');

  /**
   * Directive to convert string to int. In order to use a
   * number type input with a string value as ng-model
   */
  app.directive('stringToInt', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {

        // convert to string
        ngModel.$parsers.push(function(value) {
          return '' + value;
        });

        // parse to int
        ngModel.$formatters.push(function(value) {
          return parseInt(value, 10);
        });
      }
    };
  });

  /**
   * Directive to convert string to float. In order to use a
   * number type input with a string value as ng-model
   */
  app.directive('stringToFloat', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {

        // convert to string
        ngModel.$parsers.push(function(value) {
          return '' + value;
        });

        // parse to float
        ngModel.$formatters.push(function(value) {
          return parseFloat(value, 10);
        });
      }
    };
  });


  /**
   * Directive to convert string to boolean. In order to use a
   * checkbox type input with a string value as ng-model
   */
  app.directive('stringToBool', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {

        // convert to string
        ngModel.$parsers.push(function(value) {
          return '' + value;
        });

        // parse to boolean
        ngModel.$formatters.push(function(value) {
          return (value === 'true');
        });
      }
    };
  });


  /**
   * Directive to invert the values of a checkbox in the ng-model
   * used by the checkbox
   */
  app.directive('inverted', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {

        // for the parser and the formater, just invert the value
        ngModel.$parsers.push(function(val) { return !val; });
        ngModel.$formatters.push(function(val) { return !val; });
      }
    };
  });
})();
