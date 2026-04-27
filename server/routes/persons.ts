import express, { Request, Response, NextFunction } from 'express';
import { PersonModel } from '../models/Person';
import { requireAuth, requireUniversity, requireRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

// GET /:university/api/persons  (admin/teacher/ta)
router.get('/', requireAuth, requireUniversity, requireRole('admin', 'teacher', 'ta'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = req.params.university;
    const { role } = req.session!;
    const filter: Record<string, unknown> = { university };
    if (role === 'teacher') filter.role = { $in: ['student', 'ta'] };
    else if (role === 'ta') filter.role = 'student';
    const persons = await PersonModel.find(filter).select('-password');
    res.json(persons);
  } catch (err) { next(err); }
});

export default router;
