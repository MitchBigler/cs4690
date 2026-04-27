import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();
import { PersonModel } from '../models/Person';
import { CourseModel } from '../models/Course';

async function seed(): Promise<void> {
  const uri = process.env.MONGO_DB_URI;
  if (!uri) throw new Error('MONGO_DB_URI not set');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for seeding');

  // Only seed if admins don't exist yet
  const existing = await PersonModel.findOne({ username: { $in: ['root_uvu', 'root_uofu'] } });
  if (existing) {
    console.log('Seed data already exists, skipping.');
    await mongoose.disconnect();
    return;
  }

  const [uvuHash, uofuHash, teacherHash, taHash, studentHash] = await Promise.all([
    bcrypt.hash('willy',      12),
    bcrypt.hash('swoopy',     12),
    bcrypt.hash('teacher123', 12),
    bcrypt.hash('ta123',      12),
    bcrypt.hash('student123', 12),
  ]);

  const [uvuAdmin, , uvuTeacher, , uvuTa, uvuStudent] = await PersonModel.insertMany([
    { username: 'root_uvu',      password: uvuHash,     role: 'admin',   university: 'uvu',  displayName: 'UVU Root Admin' },
    { username: 'root_uofu',     password: uofuHash,    role: 'admin',   university: 'uofu', displayName: 'UofU Root Admin' },
    { username: 'teacher_uvu',   password: teacherHash, role: 'teacher', university: 'uvu',  displayName: 'Dr. Smith (UVU)' },
    { username: 'teacher_uofu',  password: teacherHash, role: 'teacher', university: 'uofu', displayName: 'Dr. Jones (UofU)' },
    { username: 'ta_uvu',        password: taHash,      role: 'ta',      university: 'uvu',  displayName: 'TA Alice (UVU)' },
    { username: 'ta_uofu',       password: taHash,      role: 'ta',      university: 'uofu', displayName: 'TA Bob (UofU)' },
    { username: 'student_uvu',   password: studentHash, role: 'student', university: 'uvu',  uvuId: '10111111', displayName: 'Mitch Bigler' },
    { username: 'student_uofu',  password: studentHash, role: 'student', university: 'uofu', uvuId: '20222222', displayName: 'Utah Student' },
  ]);

  await CourseModel.insertMany([
    {
      id: 'cs4690', display: 'CS 4690 - Dist App Dev',
      university: 'uvu', createdBy: uvuTeacher._id,
      studentIds: [uvuStudent._id], taIds: [uvuTa._id],
    },
    {
      id: 'cs3750', display: 'CS 3750 - Software Engineering',
      university: 'uvu', createdBy: uvuAdmin._id,
      studentIds: [], taIds: [],
    },
  ]);

  console.log('\nSeed complete!');
  console.log('  root_uvu     / willy       (admin, UVU)');
  console.log('  root_uofu    / swoopy      (admin, UofU)');
  console.log('  teacher_uvu  / teacher123  (teacher, UVU)');
  console.log('  teacher_uofu / teacher123  (teacher, UofU)');
  console.log('  ta_uvu       / ta123       (ta, UVU)');
  console.log('  student_uvu  / student123  (student, UVU) uvuId=10111111');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
