// Internal requirements
const conf = require(__dirname + '/config');
const mdw = require(__dirname + '/lib/middlewares');
const paths = require(__dirname + '/lib/paths.js');

// External requirements
const express = require('express');
const cookieParser = require('cookie-parser');
const sass = require('node-sass-middleware');
const bodyParser = require('body-parser');
const app = express();

// Set template engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.locals.pretty = true;

// Include sass middleware
app.use(sass({
    src: __dirname + '/private/sass',
    dest: __dirname + '/cache/css',
    outputStyle: 'compressed', // alternative: expanded
    prefix: '/cache/css'
}));

// Use parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set public directory for static files
app.use('/cache', express.static(__dirname + '/cache'));
app.use('/static', express.static(__dirname + '/public'));
app.use('/data', mdw.signinForbidden, express.static(paths.tmpDir()));

// Get routes for web access
require(__dirname + '/lib/routes')(app);

// Get routes for config handling
require(__dirname + '/lib/config_handling')(app);

// Start HTTP server
app.listen(conf.port, () => {
  console.log('sentri web tool listening on port ' + conf.port);
});
