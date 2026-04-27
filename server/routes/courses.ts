import express, { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { CourseModel } from '../models/Course';
import { PersonModel } from '../models/Person';
import { requireAuth, requireUniversity, requireRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

// GET /:university/api/courses
router.get('/', requireAuth, requireUniversity, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const university = req.params.university;
    const { role, userId } = req.session!;
    const oid = new Types.ObjectId(userId);
    let courses;
    if (role === 'admin')        courses = await CourseModel.find({ university });
    else if (role === 'teacher') courses = await CourseModel.find({ university, createdBy: oid });
    else if (role === 'ta')      courses = await CourseModel.find({ university, taIds: oid });
    else                         courses = await CourseModel.find({ university, studentIds: oid });
    res.json(courses);
  } catch (err) { next(err); }
});

// POST /:university/api/courses  (admin or teacher)
router.post('/', requireAuth, requireUniversity, requireRole('admin', 'teacher'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, display } = req.body;
    if (!id || !display) { res.status(400).json({ message: 'id and display are required' }); return; }
    const course = await CourseModel.create({
      id,
      display,
      university: req.params.university,
      createdBy:  new Types.ObjectId(req.session!.userId),
      studentIds: [],
      taIds:      [],
    });
    res.status(201).json(course);
  } catch (err) { next(err); }
});

// PUT /:university/api/courses/:courseId  (admin or teacher who owns it)
router.put('/:courseId', requireAuth, requireUniversity, requireRole('admin', 'teacher'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { university, courseId } = req.params;
    const { display } = req.body;
    const filter: Record<string, unknown> = { id: courseId, university };
    if (req.session!.role === 'teacher') filter.createdBy = new Types.ObjectId(req.session!.userId);
    const updated = await CourseModel.findOneAndUpdate(filter, { $set: { display } }, { new: true });
    if (!updated) { res.status(404).json({ message: 'Course not found or access denied' }); return; }
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /:university/api/courses/:courseId/enroll  (student self-enroll)
router.post('/:courseId/enroll', requireAuth, requireUniversity, requireRole('student'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { university, courseId } = req.params;
    const updated = await CourseModel.findOneAndUpdate(
      { id: courseId, university },
      { $addToSet: { studentIds: new Types.ObjectId(req.session!.userId) } },
      { new: true }
    );
    if (!updated) { res.status(404).json({ message: 'Course not found' }); return; }
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /:university/api/courses/:courseId/add-student  (admin/teacher/ta)
router.post('/:courseId/add-student', requireAuth, requireUniversity, requireRole('admin', 'teacher', 'ta'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { university, courseId } = req.params;
    const { studentId } = req.body;
    const student = await PersonModel.findOne({ _id: studentId, university, role: 'student' });
    if (!student) { res.status(404).json({ message: 'Student not found in this university' }); return; }
    const updated = await CourseModel.findOneAndUpdate(
      { id: courseId, university },
      { $addToSet: { studentIds: student._id } },
      { new: true }
    );
    if (!updated) { res.status(404).json({ message: 'Course not found' }); return; }
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /:university/api/courses/:courseId/add-ta  (admin/teacher)
router.post('/:courseId/add-ta', requireAuth, requireUniversity, requireRole('admin', 'teacher'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { university, courseId } = req.params;
    const { taId } = req.body;
    const ta = await PersonModel.findOne({ _id: taId, university, role: 'ta' });
    if (!ta) { res.status(404).json({ message: 'TA not found in this university' }); return; }
    const updated = await CourseModel.findOneAndUpdate(
      { id: courseId, university },
      { $addToSet: { taIds: ta._id } },
      { new: true }
    );
    if (!updated) { res.status(404).json({ message: 'Course not found' }); return; }
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
