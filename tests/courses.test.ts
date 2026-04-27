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

async function loginAs(username: string, password: string, university: string) {
  const agent = request.agent(app);
  await agent.post(`/${university}/api/login`).send({ username, password });
  return agent;
}

describe('Courses API', () => {
  beforeEach(async () => {
    const hash = await bcrypt.hash('pass', 10);
    await PersonModel.insertMany([
      { username: 'admin',   password: hash, role: 'admin',   university: 'uvu' },
      { username: 'teacher', password: hash, role: 'teacher', university: 'uvu' },
      { username: 'ta',      password: hash, role: 'ta',      university: 'uvu' },
      { username: 'student', password: hash, role: 'student', university: 'uvu', uvuId: '10111111' },
    ]);
  });

  it('GET /uvu/api/courses returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/uvu/api/courses');
    expect(res.status).toBe(401);
  });

  it('POST /uvu/api/courses - admin can create course', async () => {
    const agent = await loginAs('admin', 'pass', 'uvu');
    const res = await agent.post('/uvu/api/courses').send({ id: 'cs101', display: 'CS 101' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('cs101');
    expect(res.body.university).toBe('uvu');
  });

  it('POST /uvu/api/courses - teacher can create course', async () => {
    const agent = await loginAs('teacher', 'pass', 'uvu');
    const res = await agent.post('/uvu/api/courses').send({ id: 'cs202', display: 'CS 202' });
    expect(res.status).toBe(201);
  });

  it('POST /uvu/api/courses - TA cannot create course', async () => {
    const agent = await loginAs('ta', 'pass', 'uvu');
    const res = await agent.post('/uvu/api/courses').send({ id: 'cs303', display: 'CS 303' });
    expect(res.status).toBe(403);
  });

  it('POST /uvu/api/courses - student cannot create course', async () => {
    const agent = await loginAs('student', 'pass', 'uvu');
    const res = await agent.post('/uvu/api/courses').send({ id: 'cs404', display: 'CS 404' });
    expect(res.status).toBe(403);
  });

  it('Student only sees enrolled courses (empty when not enrolled)', async () => {
    const teacherAgent = await loginAs('teacher', 'pass', 'uvu');
    await teacherAgent.post('/uvu/api/courses').send({ id: 'cs202', display: 'CS 202' });
    const studentAgent = await loginAs('student', 'pass', 'uvu');
    const res = await studentAgent.get('/uvu/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('Student can self-enroll and then sees the course', async () => {
    const teacherAgent = await loginAs('teacher', 'pass', 'uvu');
    await teacherAgent.post('/uvu/api/courses').send({ id: 'cs202', display: 'CS 202' });
    const studentAgent = await loginAs('student', 'pass', 'uvu');
    const enroll = await studentAgent.post('/uvu/api/courses/cs202/enroll');
    expect(enroll.status).toBe(200);
    const courses = await studentAgent.get('/uvu/api/courses');
    expect(courses.status).toBe(200);
    expect(courses.body.length).toBe(1);
    expect(courses.body[0].id).toBe('cs202');
  });

  it('UVU courses not visible in UofU university route', async () => {
    const hash = await bcrypt.hash('pass', 10);
    await PersonModel.create({ username: 'uofuadmin', password: hash, role: 'admin', university: 'uofu' });
    const uvuAgent = await loginAs('admin', 'pass', 'uvu');
    await uvuAgent.post('/uvu/api/courses').send({ id: 'cs101', display: 'CS 101' });
    const uofuAgent = await loginAs('uofuadmin', 'pass', 'uofu');
    const res = await uofuAgent.get('/uofu/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('Teacher only sees courses they created', async () => {
    const adminAgent = await loginAs('admin', 'pass', 'uvu');
    await adminAgent.post('/uvu/api/courses').send({ id: 'cs-admin', display: 'Admin Course' });
    const teacherAgent = await loginAs('teacher', 'pass', 'uvu');
    await teacherAgent.post('/uvu/api/courses').send({ id: 'cs-teacher', display: 'Teacher Course' });
    const res = await teacherAgent.get('/uvu/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe('cs-teacher');
  });

  it('Returns 404 when enrolling in non-existent course', async () => {
    const studentAgent = await loginAs('student', 'pass', 'uvu');
    const res = await studentAgent.post('/uvu/api/courses/nonexistent/enroll');
    expect(res.status).toBe(404);
  });

  it('Prevents cross-university API access', async () => {
    const uvuAgent = await loginAs('admin', 'pass', 'uvu');
    const res = await uvuAgent.get('/uofu/api/courses');
    expect(res.status).toBe(403);
  });
});
