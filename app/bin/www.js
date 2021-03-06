/**
 * Module dependencies.
 */
var express = require('express');
var app = require('../app');
var kue = require('kue');
var debug = require('debug')('dnnserver:server');
var ssl = require('../sslCert');
var http = require('http');
var https = require('https');
var http2 = require('spdy');
var config = require('../config');

var env = process.env.NODE_ENV || 'development';
console.log('enviroment:' + env);
var serverConfig = config.server;
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(serverConfig.httpPort);
var ports = normalizePort(serverConfig.httpsPort);
app.set('port', port);
app.set('httpsport', ports);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);
// var servers = https.createServer(ssl.options, app);
var servers = http2.createServer(ssl.options, app);

/**
 * Create kue console server
 */

/*var kueApp = express();
kueApp.use(kue.app);
kueApp.listen(3000);*/

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
servers.listen(ports);
servers.on('error', onError);
servers.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
