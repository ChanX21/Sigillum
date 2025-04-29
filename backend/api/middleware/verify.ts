import { Request, Response, NextFunction } from 'express';
import { Session } from '../models/User.js';
import jwt from 'jsonwebtoken';

export const verifySession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

