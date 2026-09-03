import { Document, Types } from 'mongoose';

export interface IStudentProfile extends Document {
  user: Types.ObjectId;
  studentId: string;
  education?: {
    degree?: string;
    fieldOfStudy?: string;
    institution?: string;
    graduationYear?: number;
  };
  college?: string;
  course?: string;
  year?: string;
  city?: string;
  state?: string;
  country?: string;
  skills: string[];
  goals: string[];
  bio?: string;
  profileCompletion: number;
  createdAt: Date;
  updatedAt: Date;
}
