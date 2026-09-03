import mongoose, { Schema } from 'mongoose';
import { IEnrollment } from '../types/enrollment';

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'],
      default: 'ACTIVE'
    },
    enrolledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completionDate: Date,
    notes: String
  },
  {
    timestamps: true
  }
);

// Compound unique index: prevent enrolling the same student in the same batch multiple times
enrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
export default Enrollment;
