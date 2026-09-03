import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import api from '../../utils/api';
import {
  Calendar,
  Clock,
  Video,
  User,
  Users,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  ListTodo,
  Lock,
  Edit,
  UserCheck
} from 'lucide-react';
import type { IMentorshipSession } from '../../types/session';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: IMentorshipSession | null;
  onEdit?: (session: IMentorshipSession) => void;
  onTakeAttendance?: (session: IMentorshipSession) => void;
  onRefresh?: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  onClose,
  session,
  onEdit,
  onTakeAttendance,
  onRefresh
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!session) return null;

  const isMentorOrAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    (user?.role === 'MENTOR' && session.mentor?._id === user?.id);

  const formatDateTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const dateFormatted = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const startTimeFormatted = start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTimeFormatted = end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const durationMins = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    return { dateFormatted, startTimeFormatted, endTimeFormatted, durationMins };
  };

  const { dateFormatted, startTimeFormatted, endTimeFormatted, durationMins } =
    formatDateTimeRange(session.startTime, session.endTime);

  const copyToClipboard = (text: string, type: 'link' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      showToast('Meeting link copied to clipboard!', 'info');
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
      showToast('Meeting password copied to clipboard!', 'info');
    }
  };

  const handleToggleActionItem = async (index: number) => {
    if (!session.notes?.actionItems) return;
    const items = [...session.notes.actionItems];
    items[index] = { ...items[index], isCompleted: !items[index].isCompleted };

    try {
      await api.patch(`/sessions/${session._id}/notes`, {
        actionItems: items
      });
      session.notes.actionItems = items;
      showToast('Action item status updated', 'success');
      if (onRefresh) onRefresh();
    } catch {
      showToast('Failed to update action item', 'error');
    }
  };

  const handleStatusChange = async (newStatus: 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED') => {
    try {
      await api.patch(`/sessions/${session._id}/status`, { status: newStatus });
      showToast(`Session marked as ${newStatus}`, 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch {
      showToast('Failed to update session status', 'error');
    }
  };

  const statusVariant = {
    LIVE: 'destructive' as const,
    SCHEDULED: 'primary' as const,
    COMPLETED: 'success' as const,
    CANCELLED: 'secondary' as const
  };

  const typeLabels = {
    ONE_TO_ONE: '1:1 Mentorship Session',
    GROUP: 'Group Mentorship Session',
    BATCH: 'Batch Cohort Session'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Details" size="lg">
      <div className="flex flex-col gap-6 -mt-2 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/40 border border-border rounded-xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant[session.status] || 'secondary'} className="font-bold">
                {session.status === 'LIVE' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-1.5 inline-block" />
                )}
                {session.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {typeLabels[session.type] || session.type}
              </Badge>
            </div>
            <h2 className="text-lg font-bold font-display text-foreground mt-1">
              {session.title}
            </h2>
          </div>

          {/* Quick status actions for mentors */}
          {isMentorOrAdmin && session.status !== 'CANCELLED' && (
            <div className="flex items-center gap-2">
              {session.status === 'SCHEDULED' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('LIVE')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Start Live
                </Button>
              )}
              {session.status === 'LIVE' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('COMPLETED')}
                  className="bg-primary hover:bg-opacity-90 font-bold"
                >
                  End Session
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Meeting Link Card */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Video className="h-4 w-4" />
              <span>Meeting Launchpad ({session.meetingProvider || 'Custom WebRTC'})</span>
            </div>
            {session.status === 'LIVE' && (
              <span className="text-[11px] font-bold text-rose-400 animate-pulse uppercase tracking-wider">
                ● In Progress
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {session.meetingLink?.startsWith('/') ? (
              <Link
                to={session.meetingLink}
                className="btn btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1.5 py-2 px-4 shadow-sm rounded-2"
                style={{ fontSize: '0.82rem' }}
              >
                <Video className="h-4 w-4" />
                Launch Built-In WebRTC Classroom
              </Link>
            ) : (
              <a
                href={session.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1.5 py-2 px-4 shadow-sm rounded-2"
                style={{ fontSize: '0.82rem' }}
              >
                <ExternalLink className="h-4 w-4" />
                Join Meeting Room
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(session.meetingLink, 'link')}
              className="h-9 text-xs"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </Button>

            {session.meetingPassword && (
              <div className="flex items-center gap-1 bg-secondary/80 border border-border px-3 py-1.5 rounded-lg text-xs font-mono ml-auto">
                <span className="text-muted-foreground">Passcode:</span>
                <strong className="text-foreground">{session.meetingPassword}</strong>
                <button
                  onClick={() => copyToClipboard(session.meetingPassword!, 'pass')}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  {copiedPass ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timing & Participants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timing Box */}
          <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Schedule & Duration</span>
            </div>
            <p className="text-sm font-bold text-foreground">{dateFormatted}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {startTimeFormatted} - {endTimeFormatted} ({durationMins} mins)
              </span>
            </div>
          </div>

          {/* Mentor Box */}
          <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <User className="h-4 w-4 text-primary" />
              <span>Mentor in Charge</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                {session.mentor?.name?.[0] || 'M'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{session.mentor?.name || 'Instructor'}</span>
                <span className="text-xs text-muted-foreground">{session.mentor?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cohort / Attendees Info */}
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Users className="h-4 w-4 text-primary" />
              <span>
                {session.type === 'BATCH'
                  ? `Cohort: ${session.batch?.name || 'Batch Cohort'}`
                  : `Assigned Students (${session.students?.length || 0})`}
              </span>
            </div>
            {session.batch?.code && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {session.batch.code}
              </Badge>
            )}
          </div>

          {session.type !== 'BATCH' && session.students && session.students.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {session.students.map((st) => (
                <div
                  key={st._id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary rounded-lg text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                    {st.name?.[0] || 'S'}
                  </div>
                  <span className="font-medium text-foreground">{st.name}</span>
                </div>
              ))}
            </div>
          )}

          {session.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 border-t border-border/50 pt-2">
              {session.description}
            </p>
          )}
        </div>

        {/* Public Notes & Topics */}
        {session.notes && (
          <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-4 w-4 text-primary" />
              <span>Session Notes & Materials</span>
            </div>

            {/* Topics */}
            {session.notes.topics && session.notes.topics.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-foreground">Topics Discussed:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {session.notes.topics.map((tp, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-secondary text-foreground text-xs rounded-md border border-border/60"
                    >
                      {tp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {session.notes.summary && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-foreground">Executive Summary:</span>
                <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg leading-relaxed whitespace-pre-line">
                  {session.notes.summary}
                </p>
              </div>
            )}

            {/* Action Items */}
            {session.notes.actionItems && session.notes.actionItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ListTodo className="h-3.5 w-3.5 text-primary" />
                  <span>Action Items & Follow-ups:</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {session.notes.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => isMentorOrAdmin && handleToggleActionItem(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                        item.isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-muted-foreground line-through'
                          : 'bg-secondary/40 border-border text-foreground hover:border-primary/40'
                      } ${isMentorOrAdmin ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            item.isCompleted ? 'text-emerald-400' : 'text-muted-foreground'
                          }`}
                        />
                        <span>{item.task}</span>
                      </div>
                      {item.isCompleted && (
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase">Done</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Private Mentor Notes (Visible only to Mentor and Admin) */}
        {isMentorOrAdmin && session.notes?.privateMentorNotes && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5" />
              <span>Confidential Mentor Notes (Private)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {session.notes.privateMentorNotes}
            </p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {isMentorOrAdmin && onTakeAttendance && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onTakeAttendance(session);
                }}
                className="text-primary hover:bg-primary/10"
              >
                <UserCheck className="h-4 w-4 mr-1.5" />
                Attendance
              </Button>
            )}

            {isMentorOrAdmin && onEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(session);
                }}
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit / Notes
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SessionDetailModal;
