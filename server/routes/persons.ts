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

// DELETE /:university/api/persons/:id  (admin only)
router.delete('/:id', requireAuth, requireUniversity, requireRole('admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { university, id } = req.params;
    if (id === req.session!.userId) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }
    const deleted = await PersonModel.findOneAndDelete({ _id: id, university });
    if (!deleted) { res.status(404).json({ message: 'Person not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
