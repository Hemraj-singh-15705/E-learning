export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'REVIEWED' | 'RETURNED';

export interface ISubmissionFile {
  _id?: string;
  fileUrl: string;
  originalName: string;
  fileSize: number;
  fileType: string;
}

export interface IAssignmentSubmission {
  _id: string;
  assignment: string | IAssignment;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  files: ISubmissionFile[];
  answer?: string;
  githubUrl?: string;
  liveUrl?: string;
  submittedAt: string;
  status: SubmissionStatus;
  marks?: number;
  feedback?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAssignment {
  _id: string;
  title: string;
  description: string;
  course?: {
    _id: string;
    title: string;
    slug: string;
  };
  batch?: {
    _id: string;
    name: string;
    code: string;
  };
  mentor?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  dueDate: string;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
  maxFiles: number;
  status: AssignmentStatus;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  mySubmission?: {
    _id: string;
    status: SubmissionStatus;
    marks?: number;
    feedback?: string;
    submittedAt: string;
    files: ISubmissionFile[];
    githubUrl?: string;
    liveUrl?: string;
  } | null;
  submissionStats?: {
    total: number;
    reviewed: number;
    pending: number;
  };
  createdAt: string;
  updatedAt: string;
}
