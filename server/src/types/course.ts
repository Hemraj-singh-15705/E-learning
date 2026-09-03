import { Document, Types } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  duration?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
