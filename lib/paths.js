/**
 * Path constants and path builders for system files
 */

(() => {
  'use strict';

  const conf = require(__dirname + '/../config.js');


  exports.isSafeModuleName = (moduleName) => {
    return moduleName.match(/^module_[a-zA-Z0-9-_]+$/);
  };

  exports.isSafePathComponent = (pathComp) => {
    return pathComp.indexOf('/') == -1 && pathComp != '.' && pathComp != '..';
  };

  exports.moduleShareDir = (module) => {
    return exports.isSafeModuleName(module) ? conf.staticPath + '/' + module : null;
  };

  exports.moduleConfDir = (module) => {
    return exports.isSafeModuleName(module) ? conf.configPath + '/' + module : null;
  };

  exports.infoFilePath = (module) => {
    return exports.isSafeModuleName(module) ? exports.moduleShareDir(module) + '/' + module + '.info' : null;
  };

  exports.confFilePath = (module) => {
    return exports.isSafeModuleName(module) ? exports.moduleConfDir(module) + '/' + module + '.conf' : null;
  };

  exports.confNewFilePath = (module) => {
    return exports.isSafeModuleName(module) ? exports.confFilePath(module) + '.new' : null;
  };

  exports.rulesFilePath = () => {
    return conf.configPath + '/rules.conf';
  };

  exports.rulesNewFilePath = () => {
    return exports.rulesFilePath() + '.new';
  };

  exports.lockFilePath = () => {
    return conf.configPath + '/lock';
  };

  exports.hookDataFilePath = (module) => {
    return exports.isSafeModuleName(module) ? exports.moduleConfDir(module) + '/hook_data.json' : null;
  };

  exports.hookTemplateFilePath = (module, location) => {
    return exports.isSafeModuleName(module) && exports.isSafePathComponent(location) ?
           exports.moduleShareDir(module) + '/hook_' + location + '.html' : null;
  };

  exports.tmpDir = () => {
    return conf.tempFolder;
  };

  exports.streamDir = () => {
    return exports.tmpDir() + '/stream';
  };

  exports.webtoolConfPath = () => {
    return conf.configPath + '/webtool.json';
  };

})();
