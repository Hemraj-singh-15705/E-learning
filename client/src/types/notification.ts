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

export interface INotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}
