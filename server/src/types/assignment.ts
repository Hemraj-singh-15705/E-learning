import { Document, Types } from 'mongoose';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'REVIEWED' | 'RETURNED';

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  course?: Types.ObjectId;
  module?: Types.ObjectId;
  lesson?: Types.ObjectId;
  batch?: Types.ObjectId;
  mentor?: Types.ObjectId;
  dueDate: Date;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
  maxFiles: number;
  status: AssignmentStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubmissionFile {
  fileUrl: string;
  originalName: string;
  fileSize: number; // in bytes
  fileType: string;
}

export interface IAssignmentSubmission extends Document {
  _id: Types.ObjectId;
  assignment: Types.ObjectId;
  student: Types.ObjectId;
  files: ISubmissionFile[];
  answer?: string;
  githubUrl?: string;
  liveUrl?: string;
  submittedAt: Date;
  status: SubmissionStatus;
  marks?: number;
  feedback?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
