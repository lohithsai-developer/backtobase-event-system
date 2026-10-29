import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface AuthUser {
  userId: string;
  username: string;
  role: 'admin' | 'volunteer';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    return;
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
      return;
    }
    next();
  });
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
    req.user = decoded;
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};

export const requireVolunteerOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'volunteer') {
      res.status(403).json({ success: false, message: 'Access denied. Volunteer or Admin privileges required.' });
      return;
    }
    next();
  });
};
