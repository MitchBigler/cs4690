#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config() // load env

console.log("starting...")

/**
 * Module dependencies.
 */

var app = require('../app').default;
var debug = require('debug')('helloworld:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Connect to mongo db then listen on provided port
 */
mongoose.connect(process.env.MONGO_DB_URI as string).then(() => {
  console.log("Connected to MongoDB")

    // server start after connection
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});



/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val : string) {
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

function onError(error: NodeJS.ErrnoException) {
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
  console.log('======================');
  console.log('Listening on ' + bind);
  console.log('======================');
}
