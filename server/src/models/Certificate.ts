import mongoose, { Schema } from 'mongoose';
import { ICertificate } from '../types/certificate';

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    completionData: {
      grade: { type: String, default: 'A+' },
      score: { type: Number, default: 100 },
      totalHours: { type: Number, default: 40 },
      completedLessonsCount: { type: Number, default: 0 },
      projectTitle: { type: String }
    },
    status: {
      type: String,
      enum: ['ISSUED', 'REVOKED'],
      default: 'ISSUED'
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

CertificateSchema.index({ student: 1, course: 1 });

export const Certificate = mongoose.model<ICertificate>(
  'Certificate',
  CertificateSchema
);

export default Certificate;
