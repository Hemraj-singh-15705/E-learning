import { Document, Types } from 'mongoose';

export type SessionType = 'ONE_TO_ONE' | 'GROUP' | 'BATCH';
export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type MeetingProvider = 'CUSTOM' | 'ZOOM' | 'GOOGLE_MEET' | 'JITSI' | 'TEAMS';

export interface IActionItem {
  task: string;
  assignedTo?: Types.ObjectId;
  isCompleted?: boolean;
}

export interface ISessionNotes {
  summary?: string;
  topics?: string[];
  actionItems?: IActionItem[];
  privateMentorNotes?: string;
}

export interface IMentorshipSession extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  mentor: Types.ObjectId;
  students: Types.ObjectId[];
  batch?: Types.ObjectId;
  course?: Types.ObjectId;
  type: SessionType;
  startTime: Date;
  endTime: Date;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  meetingPassword?: string;
  status: SessionStatus;
  notes: ISessionNotes;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
