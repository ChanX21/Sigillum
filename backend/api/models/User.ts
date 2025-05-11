import { Schema, model } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INonce extends Document {
  nonce: string;
  user: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession extends Document {
  sessionId: string;
  user: IUser;
  createdAt: Date;
  updatedAt: Date;
}

const nonceSchema = new Schema<INonce>({
  nonce: { type: String, required: true, unique: true },
  user: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new Schema<IUser>({
  walletAddress: { type: String, required: true, unique: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const sessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = model<IUser>('User', userSchema);
const Nonce = model<INonce>('Nonce', nonceSchema);
const Session = model<ISession>('Session', sessionSchema);
export { User, Nonce, Session };
