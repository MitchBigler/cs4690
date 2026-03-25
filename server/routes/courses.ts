import express, { Request, Response, NextFunction } from 'express';
import { Repository as Repository } from '../db/Repository';
import { Course, CourseModel } from '../models/Course';

const router = express.Router();

// GET courses with optional filters (courseId, uvuId, logId, etc.) 
router.get('/', async function(req: Request, res: Response, next: NextFunction) {
  try {
    // Convert URL query parameters to Map for filtering
    // Only include string values, skip arrays/objects
    const filters = new Map(
      Object.entries(req.query)
        .filter(([_key, value]) => typeof value === 'string')
        .map(([key, value]) => [key, value as string])
    );

    const courseRepo : Repository<Course> = new Repository(CourseModel);
    const logs = await courseRepo.get(filters);

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.post('/', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const courseRepo : Repository<Course> = new Repository(CourseModel);

    // use the code that converts json into a log using body-parser
    let course : Course = req.body;


    // we need logRepo to return a log object in case:
    // 1.  it's an insert to get the Id from the returned object on the post, 
    // 2.  for updates, the data should match, unless updates also do something like 
    //     a. updates the version number or 
    //     b. updates the last modified time, etc.
    //     c. in which case, the inserts should do 2.a-2.b type changes also!
    course = await courseRepo.save(course);
    
    res.json(course);
  } catch (error) {
    next(error);
  }

});


export default router;