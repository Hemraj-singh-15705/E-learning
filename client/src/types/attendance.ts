import type { IMentorshipSession } from './session';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface IAttendanceRecord {
  _id?: string;
  session: string | IMentorshipSession;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  status: AttendanceStatus;
  joinedAt?: string;
  leftAt?: string;
  duration?: number;
  markedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  notes?: string;
  isMarked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAttendanceRosterItem {
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  status: AttendanceStatus;
  joinedAt?: string | null;
  leftAt?: string | null;
  duration?: number;
  notes?: string;
  markedBy?: {
    _id: string;
    name: string;
  } | null;
  isMarked: boolean;
}

export interface IAttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface IStudentAttendanceSummary {
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendanceRate: number;
}
