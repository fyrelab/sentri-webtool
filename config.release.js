exports.port = 3000;

exports.staticPath = '/usr/share/sentri';
exports.configPath = process.env.HOME + '/.config/sentri';
exports.tempFolder = '/tmp/sentri';

exports.sessionTimeout = 600000;  // 10 minutes
exports.sessionCookieName = 'SESSION_SENTRI';
