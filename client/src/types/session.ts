export type SessionType = 'ONE_TO_ONE' | 'GROUP' | 'BATCH';
export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type MeetingProvider = 'CUSTOM' | 'ZOOM' | 'GOOGLE_MEET' | 'JITSI' | 'TEAMS';

export interface IActionItem {
  _id?: string;
  task: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | string;
  isCompleted?: boolean;
}

export interface ISessionNotes {
  summary?: string;
  topics?: string[];
  actionItems?: IActionItem[];
  privateMentorNotes?: string;
}

export interface IMentorshipSession {
  _id: string;
  title: string;
  description?: string;
  mentor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  students: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
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
  type: SessionType;
  startTime: string;
  endTime: string;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  meetingPassword?: string;
  status: SessionStatus;
  notes?: ISessionNotes;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ISessionFormData {
  title: string;
  description?: string;
  mentor?: string;
  students?: string[];
  batch?: string;
  course?: string;
  type: SessionType;
  startTime: string;
  endTime: string;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  meetingPassword?: string;
  notes?: ISessionNotes;
}
