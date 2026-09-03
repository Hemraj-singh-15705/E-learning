import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserMethods, UserModel } from '../types/user';

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'STUDENT'],
      default: 'STUDENT'
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'PENDING'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    permissions: {
      type: [String],
      default: []
    },
    lastLoginAt: {
      type: Date
    },
    verificationToken: {
      type: String,
      select: false
    },
    verificationTokenExpires: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    refreshToken: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance optimization
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    const hashed = await (bcrypt.hash(this.password, salt) as Promise<string>);
    this.password = hashed;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to check if password is correct
userSchema.methods.comparePassword = async function (passwordToCheck: string): Promise<boolean> {
  if (!this.password) return false;
  return (bcrypt.compare(passwordToCheck, this.password) as Promise<boolean>);
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
