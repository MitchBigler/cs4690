import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import authRouter from './server/routes/auth';
import coursesRouter from './server/routes/courses';
import logsRouter from './server/routes/logs';
import personsRouter from './server/routes/persons';

export function createApp(mongoUri: string): Express {
  const app: Express = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri, collectionName: 'sessions', ttl: 86400 }),
    cookie: { httpOnly: true, secure: false, maxAge: 86400000 },
  }));

  // Static files per university (served before API routes so HTML/CSS/JS load correctly)
  app.use('/uvu',  express.static(path.join(__dirname, '../public/uvu')));
  app.use('/uofu', express.static(path.join(__dirname, '../public/uofu')));
  app.use(express.static(path.join(__dirname, '../public')));

  // HTML page routes
  app.get('/uvu/login',     (_req, res) => res.sendFile(path.resolve(__dirname, '../public/uvu/login.html')));
  app.get('/uvu/signup',    (_req, res) => res.sendFile(path.resolve(__dirname, '../public/uvu/signup.html')));
  app.get('/uvu/dashboard', (_req, res) => res.sendFile(path.resolve(__dirname, '../public/uvu/dashboard.html')));
  app.get('/uofu/login',    (_req, res) => res.sendFile(path.resolve(__dirname, '../public/uofu/login.html')));
  app.get('/uofu/signup',   (_req, res) => res.sendFile(path.resolve(__dirname, '../public/uofu/signup.html')));
  app.get('/uofu/dashboard',(_req, res) => res.sendFile(path.resolve(__dirname, '../public/uofu/dashboard.html')));

  // Landing page
  app.get('/', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Student Logs</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>body{background:#f8f9fa;} .portal-card{transition:transform .2s;} .portal-card:hover{transform:translateY(-4px);}</style>
</head>
<body class="d-flex flex-column align-items-center justify-content-center" style="min-height:100vh">
  <h1 class="mb-2 fw-bold">Student Logs</h1>
  <p class="text-muted mb-5">Select your university portal to continue</p>
  <div class="d-flex gap-4 flex-wrap justify-content-center">
    <a href="/uvu/login" class="text-decoration-none">
      <div class="card portal-card shadow p-4 text-center" style="width:220px;border-top:4px solid #275D38">
        <h3 class="fw-bold" style="color:#275D38">UVU</h3>
        <p class="text-muted mb-0">Utah Valley University</p>
      </div>
    </a>
    <a href="/uofu/login" class="text-decoration-none">
      <div class="card portal-card shadow p-4 text-center" style="width:220px;border-top:4px solid #CC0000">
        <h3 class="fw-bold" style="color:#CC0000">U of U</h3>
        <p class="text-muted mb-0">University of Utah</p>
      </div>
    </a>
  </div>
</body>
</html>`);
  });

  // API routes — all prefixed /:university/api/
  app.use('/:university/api', authRouter);
  app.use('/:university/api/courses', coursesRouter);
  app.use('/:university/api/logs', logsRouter);
  app.use('/:university/api/persons', personsRouter);

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  });

  return app;
}
