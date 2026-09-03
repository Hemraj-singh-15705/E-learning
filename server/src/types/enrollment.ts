import { Document, Types } from 'mongoose';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  batch: Types.ObjectId;
  enrollmentDate: Date;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  enrolledBy: Types.ObjectId;
  completionDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
