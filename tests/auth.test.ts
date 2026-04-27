import request from 'supertest';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { PersonModel } from '../server/models/Person';

let mongod: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_DB_URI = mongod.getUri();
  process.env.SESSION_SECRET = 'test-secret';
  await mongoose.connect(mongod.getUri());
  app = createApp(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  for (const key of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[key].deleteMany({});
  }
});

describe('POST /:university/api/login', () => {
  beforeEach(async () => {
    const hash = await bcrypt.hash('willy', 10);
    await PersonModel.create({ username: 'root_uvu', password: hash, role: 'admin', university: 'uvu' });
  });

  it('returns 200 with valid UVU credentials', async () => {
    const res = await request(app)
      .post('/uvu/api/login')
      .send({ username: 'root_uvu', password: 'willy' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
    expect(res.body.university).toBe('uvu');
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/uvu/api/login')
      .send({ username: 'root_uvu', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when UVU user tries UofU portal', async () => {
    const res = await request(app)
      .post('/uofu/api/login')
      .send({ username: 'root_uvu', password: 'willy' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/uvu/api/login')
      .send({ username: 'root_uvu' });
    expect(res.status).toBe(400);
  });
});

describe('GET /:university/api/me', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/uvu/api/me');
    expect(res.status).toBe(401);
  });

  it('returns session data when authenticated', async () => {
    const hash = await bcrypt.hash('pass', 10);
    await PersonModel.create({ username: 'teacher1', password: hash, role: 'teacher', university: 'uvu' });
    const agent = request.agent(app);
    await agent.post('/uvu/api/login').send({ username: 'teacher1', password: 'pass' });
    const res = await agent.get('/uvu/api/me');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('teacher');
    expect(res.body.university).toBe('uvu');
  });
});

describe('POST /:university/api/logout', () => {
  it('clears session so subsequent /me returns 401', async () => {
    const hash = await bcrypt.hash('pass', 10);
    await PersonModel.create({ username: 'admin1', password: hash, role: 'admin', university: 'uvu' });
    const agent = request.agent(app);
    await agent.post('/uvu/api/login').send({ username: 'admin1', password: 'pass' });
    const logoutRes = await agent.post('/uvu/api/logout');
    expect(logoutRes.status).toBe(200);
    const meRes = await agent.get('/uvu/api/me');
    expect(meRes.status).toBe(401);
  });
});

describe('POST /:university/api/signup', () => {
  it('allows unauthenticated user to create a student account', async () => {
    const res = await request(app)
      .post('/uvu/api/signup')
      .send({ username: 'stu1', password: 'pass123', role: 'student', uvuId: '10234567' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('student');
    expect(res.body.university).toBe('uvu');
  });

  it('rejects unauthenticated attempt to create teacher', async () => {
    const res = await request(app)
      .post('/uvu/api/signup')
      .send({ username: 'tea1', password: 'pass123', role: 'teacher' });
    expect(res.status).toBe(403);
  });

  it('returns 409 on duplicate username within same university', async () => {
    await request(app).post('/uvu/api/signup').send({ username: 'dup', password: 'pass', role: 'student' });
    const res = await request(app).post('/uvu/api/signup').send({ username: 'dup', password: 'pass', role: 'student' });
    expect(res.status).toBe(409);
  });

  it('allows same username in different universities', async () => {
    await request(app).post('/uvu/api/signup').send({ username: 'shared', password: 'pass', role: 'student' });
    const res = await request(app).post('/uofu/api/signup').send({ username: 'shared', password: 'pass', role: 'student' });
    expect(res.status).toBe(201);
  });

  it('allows admin to create teacher', async () => {
    const hash = await bcrypt.hash('pass', 10);
    await PersonModel.create({ username: 'admin1', password: hash, role: 'admin', university: 'uvu' });
    const agent = request.agent(app);
    await agent.post('/uvu/api/login').send({ username: 'admin1', password: 'pass' });
    const res = await agent.post('/uvu/api/signup').send({ username: 'newteacher', password: 'pass', role: 'teacher' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('teacher');
  });

  it('prevents teacher from creating another teacher', async () => {
    const hash = await bcrypt.hash('pass', 10);
    await PersonModel.create({ username: 'teacher1', password: hash, role: 'teacher', university: 'uvu' });
    const agent = request.agent(app);
    await agent.post('/uvu/api/login').send({ username: 'teacher1', password: 'pass' });
    const res = await agent.post('/uvu/api/signup').send({ username: 'teacher2', password: 'pass', role: 'teacher' });
    expect(res.status).toBe(403);
  });
});
