import { Request, Response, NextFunction } from 'express';
import { Session, User } from '../models/User.js';
import jwt from 'jsonwebtoken';

export const verifySession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (process.env.NODE_ENV === 'development' || process.env.BE_KEY === req.headers['authorization']?.split(' ')[1]) {
    req.user = await User.findOne();
    next();
    return;
  }
  const { token } = req.cookies;
  jwt.verify(token, process.env.JWT_SECRET!, async (err: any, decoded: any) => {
    if (err) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const session = await Session.findOne({ sessionId: decoded.sessionId }).populate('user');
    if (!session) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    req.user = session.user;
    next();
  });
};

