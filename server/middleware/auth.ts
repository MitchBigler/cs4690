import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/Person';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

export function requireUniversity(req: Request, res: Response, next: NextFunction): void {
  const uni = req.params.university;
  if (!['uvu', 'uofu'].includes(uni)) {
    res.status(400).json({ message: 'Invalid university' });
    return;
  }
  if (req.session?.userId && req.session.university !== uni) {
    res.status(403).json({ message: 'Forbidden: university mismatch' });
    return;
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.session.role as Role)) {
      res.status(403).json({ message: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}
