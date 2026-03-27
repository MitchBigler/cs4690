import express, { Request, Response, NextFunction } from 'express';
import { Repository } from '../db/Repository';
import { Log, LogModel } from '../models/Log';

const router = express.Router();

/* GET logs with optional filters (courseId, uvuId, logId, etc.) */
router.get('/', async function(req: Request, res: Response, next: NextFunction) {
  try {
    // Convert URL query parameters to Map for filtering
    // Only include string values, skip arrays/objects
    const filters = new Map(
      Object.entries(req.query)
        .filter(([_key, value]) => typeof value === 'string')
        .map(([key, value]) => [key, value as string])
    );

    const logRepo : Repository<Log> = new Repository<Log>(LogModel);
    const logs : Log[] | null = await logRepo.get(filters);

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.post('/', async function(req: Request, res: Response, next: NextFunction) {
  try {
    const logRepo : Repository<Log> = new Repository<Log>(LogModel);
    const { id, courseId, uvuId, text, date, logId } = req.body;

    // if log id then update
    if (logId) {
      const updated = await logRepo.update(
        { _id: logId } as Partial<Log>,
        { text, date } as Partial<Log>
      );

      if (!updated) {
        return res.status(404).json({ message: "Log not found." });
      }
      return res.status(200).json(updated);
    }

    let log : Log = req.body;
    delete (log as any).logId; // dont insert empty string

    log = await logRepo.save(log);
    res.status(201).json(log);

  } catch (error) {
    return next(error);
  }
});

export default router;