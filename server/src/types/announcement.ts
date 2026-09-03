import { Document, Types } from 'mongoose';

export type AnnouncementAudience = 'ALL' | 'STUDENTS' | 'MENTORS' | 'BATCH' | 'COURSE';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IAnnouncement extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  author: Types.ObjectId;
  targetAudience: AnnouncementAudience;
  batch?: Types.ObjectId;
  course?: Types.ObjectId;
  isPinned: boolean;
  publishAt: Date;
  status: AnnouncementStatus;
  createdAt: Date;
  updatedAt: Date;
}
