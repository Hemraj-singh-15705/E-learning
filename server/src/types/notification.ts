import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_GRADED'
  | 'ASSIGNMENT_RETURNED'
  | 'SESSION_SCHEDULED'
  | 'SESSION_UPDATED'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'TEST_AVAILABLE'
  | 'TEST_GRADED'
  | 'SYSTEM';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
