import mongoose, { Schema } from 'mongoose';
import { IAttendance } from '../types/attendance';

const AttendanceSchema = new Schema<IAttendance>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipSession',
      required: [true, 'Session reference is required']
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
      default: 'PRESENT',
      required: true
    },
    joinedAt: {
      type: Date
    },
    leftAt: {
      type: Date
    },
    duration: {
      type: Number, // in minutes
      min: 0,
      default: 0
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance records for the same student in the same session
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true });
AttendanceSchema.index({ student: 1, createdAt: -1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
