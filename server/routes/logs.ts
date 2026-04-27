import express, { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { LogModel } from '../models/Log';
import { CourseModel } from '../models/Course';
import { requireAuth, requireUniversity } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

// GET /:university/api/logs?courseId=xxx&uvuId=xxx
router.get('/', requireAuth, requireUniversity, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = req.params.university;
    const { role, userId, uvuId: sessionUvuId } = req.session!;
    const { courseId, uvuId } = req.query as { courseId?: string; uvuId?: string };
    const filter: Record<string, unknown> = { university };
    if (courseId) filter.courseId = courseId;

    if (role === 'admin') {
      if (uvuId) filter.uvuId = uvuId;
    } else if (role === 'teacher' || role === 'ta') {
      const field = role === 'teacher' ? 'createdBy' : 'taIds';
      const myCourses = await CourseModel.find({ university, [field]: new Types.ObjectId(userId) }).select('id');
      const myIds = myCourses.map(c => c.id);
      if (courseId && !myIds.includes(courseId)) { res.status(403).json({ message: 'Forbidden: not your course' }); return; }
      filter.courseId = courseId || { $in: myIds };
      if (uvuId) filter.uvuId = uvuId;
    } else {
      // student: own logs only
      filter.uvuId = sessionUvuId;
    }

    const logs = await LogModel.find(filter).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) { next(err); }
});

// POST /:university/api/logs
router.post('/', requireAuth, requireUniversity, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = req.params.university;
    const { role, userId, uvuId: sessionUvuId } = req.session!;
    const { courseId, uvuId, text, date, logId } = req.body;
    if (!courseId || !uvuId || !text) { res.status(400).json({ message: 'courseId, uvuId, and text are required' }); return; }
    if (role === 'student' && uvuId !== sessionUvuId) { res.status(403).json({ message: 'Students can only add logs for themselves' }); return; }
    if (role === 'teacher' || role === 'ta') {
      const field = role === 'teacher' ? 'createdBy' : 'taIds';
      const course = await CourseModel.findOne({ id: courseId, university, [field]: new Types.ObjectId(userId) });
      if (!course) { res.status(403).json({ message: 'Forbidden: not your course' }); return; }
    }
    if (logId) {
      const updated = await LogModel.findOneAndUpdate(
        { _id: logId, university },
        { $set: { text, date: date || new Date().toLocaleString() } },
        { new: true }
      );
      if (!updated) { res.status(404).json({ message: 'Log not found' }); return; }
      res.json(updated);
      return;
    }
    const log = await LogModel.create({
      courseId, uvuId, text,
      date: date || new Date().toLocaleString(),
      university,
    });
    res.status(201).json(log);
  } catch (err) { next(err); }
});

export default router;
