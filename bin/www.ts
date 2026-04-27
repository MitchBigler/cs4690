#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import http from 'http';
import { createApp } from '../app';

const mongoUri = process.env.MONGO_DB_URI as string;
const port = normalizePort(process.env.PORT || '3000');

mongoose.connect(mongoUri).then(() => {
  console.log('Connected to MongoDB');
  const app = createApp(mongoUri);
  app.set('port', port);
  const server = http.createServer(app);
  server.listen(port);
  server.on('error', onError);
  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    console.log('========================');
    console.log(` Listening on ${bind}`);
    console.log('========================');
  });
}).catch((err: Error) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

function normalizePort(val: string): number | string | false {
  const p = parseInt(val, 10);
  if (isNaN(p)) return val;
  if (p >= 0) return p;
  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  if (error.code === 'EACCES') { console.error(`${bind} requires elevated privileges`); process.exit(1); }
  if (error.code === 'EADDRINUSE') { console.error(`${bind} is already in use`); process.exit(1); }
  throw error;
}
