export type CertificateStatus = 'ISSUED' | 'REVOKED';

export interface ICertificateCompletionData {
  grade?: string;
  score?: number;
  totalHours?: number;
  completedLessonsCount?: number;
  projectTitle?: string;
}

export interface ICertificate {
  _id: string;
  certificateNumber: string;
  verificationCode: string;
  student: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  course?: {
    _id: string;
    title: string;
    slug: string;
    level?: string;
    duration?: number;
  };
  batch?: {
    _id: string;
    name: string;
    code: string;
  };
  issueDate: string;
  completionData?: ICertificateCompletionData;
  status: CertificateStatus;
  issuedBy?: {
    _id: string;
    name: string;
    role?: string;
  };
  createdAt: string;
}
