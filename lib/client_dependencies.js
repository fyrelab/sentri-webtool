(() => {
  'use strict';

  exports.javascript = [
    // Polyfills
    { src: '/static/js/polyfill_array_from.js', use: 'all' },

    // Angular libs
    { src: '/static/ext/angular/angular.min.js', use: 'all' },

    { src: '/static/ext/angular-route/angular-route.min.js', use: 'app' },
    { src: '/static/ext/angular-animate/angular-animate.min.js', use: 'app' },

    // Angular apps
    { src: '/static/js/app.js', use: 'app' },
    { src: '/static/js/direct_hook.js', use: 'hook' },

    // Controllers without dependencies
    { src: '/static/js/controllers/error_controller.js', use: 'app' },
    { src: '/static/js/controllers/loading_controller.js', use: 'app' },
    { src: '/static/js/controllers/settings_controller.js', use: 'app' },

    // Other Angular extentions
    { src: '/static/js/data_service.js', use: 'all' },

    // Controllers with DataService dependency
    { src: '/static/js/controllers/navigation_controller.js', use: 'app' },
    { src: '/static/js/controllers/module_controller.js', use: 'app' },
    { src: '/static/js/controllers/module_config_controller.js', use: 'app' },
    { src: '/static/js/controllers/overview_controller.js', use: 'app' },
    { src: '/static/js/controllers/rules_controller.js', use: 'app' },
    { src: '/static/js/controllers/rule_config_controller.js', use: 'app' },

    // Components and directives
    { src: '/static/js/components/hook_components.js', use: 'all' },

    { src: '/static/js/components/config_components.js', use: 'app' },
    { src: '/static/js/components/dyn-select_components.js', use: 'app' },
    { src: '/static/js/components/areapicker_components.js', use: 'app' },
    { src: '/static/js/components/vars-select_components.js', use: 'app' },
    { src: '/static/js/components/converter_directives.js', use: 'app' },
    { src: '/static/js/routing.js', use: 'app' },

    // Other JavaScript dependencies
    { src: '/static/ext/jquery/jquery.min.js', use: 'all' },
    { src: '/static/ext/tether/js/tether.min.js', use: 'all' },
    { src: '/static/ext/bootstrap/js/bootstrap.min.js', use: 'all' },
    { src: '/static/ext/video.js/dist/video.min.js', use: 'all' },
    { src: '/static/ext/videojs-contrib-hls/dist/videojs-contrib-hls.min.js', use: 'all' },
    { src: '/static/ext/vjs-video/dist/vjs-video.min.js', use: 'all' },

    { src: '/static/ext/jcrop/jcrop.min.js', use: 'app' },
    { src: '/static/ext/bootstrap-multiselect/dist/js/bootstrap-multiselect.js', use: 'app' }
  ];

})();
