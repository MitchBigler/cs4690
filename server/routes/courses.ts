import express, { Request, Response, NextFunction } from 'express';
import { Repository as Repository } from '../db/Repository';
import { Course, CourseModel } from '../models/Course';

const router = express.Router();

// GET courses with optional filters (courseId, uvuId, logId, etc.) 
router.get('/', async function(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("GET /courses");
    // Convert URL query parameters to Map for filtering
    // Only include string values, skip arrays/objects
    const filters = new Map(
      Object.entries(req.query)
        .filter(([_key, value]) => typeof value === 'string')
        .map(([key, value]) => [key, value as string])
    );

    const courseRepo : Repository<Course> = new Repository(CourseModel);
    const courses = await courseRepo.get(filters);

    console.log(courses)
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.post('/', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const courseRepo: Repository<Course> = new Repository(CourseModel);
    const { id, display, updateCourse, originalId } = req.body;

    if (updateCourse) {
      const updated = await courseRepo.update(
        { id: originalId } as Partial<Course>,
        { id, display } as Partial<Course>
      );
      if (!updated) {
        return res.status(404).json({ message: "Course not found." });
      }
      return res.status(200).json(updated);
    }

    // insert new
    let course: Course = req.body;
    course = await courseRepo.save(course);
    return res.status(201).json(course);

  } catch (error) {
    return next(error);
  }
});


export default router;