import { Document, Types } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  slug: string;
  code: string;
  description?: string;
  thumbnail?: string;
  status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate?: Date;
  endDate?: Date;
  capacity: number;
  mentors: Types.ObjectId[];
  courses: Types.ObjectId[];
  settings: Record<string, any>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
