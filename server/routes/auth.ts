import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PersonModel, University, Role } from '../models/Person';
import { requireUniversity } from '../middleware/auth';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    role: Role;
    university: University;
    uvuId?: string;
  }
}

const router = express.Router({ mergeParams: true });

// POST /:university/api/login
router.post('/login', requireUniversity, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = req.params.university as University;
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }
    const person = await PersonModel.findOne({ username, university });
    if (!person || !(await bcrypt.compare(password, person.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    req.session.userId     = String(person._id);
    req.session.username   = person.username;
    req.session.role       = person.role;
    req.session.university = person.university;
    if (person.uvuId) req.session.uvuId = person.uvuId;
    res.json({
      userId:     req.session.userId,
      username:   person.username,
      role:       person.role,
      university: person.university,
      uvuId:      person.uvuId,
    });
  } catch (err) { next(err); }
});

// POST /:university/api/signup
// Unauthenticated: student only. Admin: any role. Teacher: ta/student. TA: student.
router.post('/signup', requireUniversity, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = req.params.university as University;
    const { username, password, displayName, uvuId, role: requestedRole } = req.body;
    if (!username || !password || !requestedRole) {
      res.status(400).json({ message: 'username, password, and role are required' });
      return;
    }
    const callerRole      = req.session?.role as Role | undefined;
    const callerUniversity = req.session?.university as University | undefined;
    const allowedRolesMap: Record<string, Role[]> = {
      admin:   ['admin', 'teacher', 'ta', 'student'],
      teacher: ['ta', 'student'],
      ta:      ['student'],
      student: [],
    };
    if (!callerRole && requestedRole !== 'student') {
      res.status(403).json({ message: 'Only students may self-register' });
      return;
    }
    if (callerRole) {
      if (callerUniversity !== university) {
        res.status(403).json({ message: 'Cannot create users for another university' });
        return;
      }
      if (!(allowedRolesMap[callerRole] ?? []).includes(requestedRole as Role)) {
        res.status(403).json({ message: `Your role cannot create a '${requestedRole}'` });
        return;
      }
    }
    if (await PersonModel.findOne({ username, university })) {
      res.status(409).json({ message: 'Username already taken at this university' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const person = await PersonModel.create({
      username, password: hashed, role: requestedRole as Role,
      university, displayName,
      uvuId: requestedRole === 'student' ? uvuId : undefined,
    });
    res.status(201).json({
      id:          String(person._id),
      username:    person.username,
      role:        person.role,
      university:  person.university,
      displayName: person.displayName,
    });
  } catch (err) { next(err); }
});

// POST /:university/api/logout
router.post('/logout', (req: Request, res: Response, next: NextFunction): void => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// GET /:university/api/me
router.get('/me', (req: Request, res: Response): void => {
  if (!req.session?.userId) { res.status(401).json({ message: 'Not authenticated' }); return; }
  res.json({
    userId:     req.session.userId,
    username:   req.session.username,
    role:       req.session.role,
    university: req.session.university,
    uvuId:      req.session.uvuId,
  });
});

export default router;
