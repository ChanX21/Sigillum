import { Request } from 'express';
import { IUser } from '../models/User';
declare module 'express-serve-static-core' {
  interface Request {
    user: IUser;
  }
}
