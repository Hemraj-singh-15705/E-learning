import { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MENTOR' | 'STUDENT';
  avatar?: string;
  bio?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  isEmailVerified: boolean;
  permissions: string[];
  lastLoginAt?: Date;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(passwordToCheck: string): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;
