export type AnnouncementAudience = 'ALL' | 'STUDENTS' | 'MENTORS' | 'BATCH' | 'COURSE';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  targetAudience: AnnouncementAudience;
  batch?: {
    _id: string;
    name: string;
    code: string;
  };
  course?: {
    _id: string;
    title: string;
    slug: string;
  };
  isPinned: boolean;
  publishAt: string;
  status: AnnouncementStatus;
  createdAt: string;
  updatedAt: string;
}
