import { Document, Types } from 'mongoose';

export interface IMentorProfile extends Document {
  user: Types.ObjectId;
  mentorId: string;
  designation?: string;
  specialization: string[];
  expertise: string[];
  experience?: number; // in years
  qualification?: string;
  company?: string;
  bio?: string;
  skills: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  availability?: {
    days?: string[];
    slots?: string[];
  };
  profileCompletion: number;
  createdAt: Date;
  updatedAt: Date;
}
