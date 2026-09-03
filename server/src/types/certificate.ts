import { Document, Types } from 'mongoose';

export type CertificateStatus = 'ISSUED' | 'REVOKED';

export interface ICertificateCompletionData {
  grade?: string;
  score?: number;
  totalHours?: number;
  completedLessonsCount?: number;
  projectTitle?: string;
}

export interface ICertificate extends Document {
  _id: Types.ObjectId;
  certificateNumber: string;
  verificationCode: string;
  student: Types.ObjectId;
  course?: Types.ObjectId;
  batch?: Types.ObjectId;
  issueDate: Date;
  completionData?: ICertificateCompletionData;
  status: CertificateStatus;
  issuedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
