import { Document, Types } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  student: Types.ObjectId;
  status: AttendanceStatus;
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number; // duration in minutes
  markedBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
