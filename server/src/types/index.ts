import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  otp?: string;
  otpExpires?: Date;
  otpVerified?: boolean;
  avatarColor?: string;
  settings?: {
    theme: string;
  };
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  title: string;
  category: string;
  status: 'pending' | 'completed';
  userId: Types.ObjectId | string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}
