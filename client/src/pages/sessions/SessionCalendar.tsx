import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import api from '../../utils/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
  CheckCircle2,
  Edit,
  Trash2,
  Radio
} from 'lucide-react';
import type { IMentorshipSession } from '../../types/session';
import SessionDetailModal from './SessionDetailModal';
import SessionFormModal from './SessionFormModal';
import AttendanceModal from './AttendanceModal';

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export const SessionCalendar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const isMentorOrAdmin =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MENTOR';

  // State
  const [sessions, setSessions] = useState<IMentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Metrics
  const [studentSummary, setStudentSummary] = useState<any>(null);

  // Modals state
  const [selectedSession, setSelectedSession] = useState<IMentorshipSession | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<IMentorshipSession | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [sessionForAttendance, setSessionForAttendance] = useState<IMentorshipSession | null>(null);

  // Delete dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<IMentorshipSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSessions();
    if (user?.role === 'STUDENT') {
      fetchStudentSummary();
    }
  }, [currentDate, viewMode, typeFilter, statusFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const { start, end } = getDateRangeForView(currentDate, viewMode);
      
      const params: any = {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      };

      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/sessions', { params });
      setSessions(res.data.data.sessions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentSummary = async () => {
    try {
      const res = await api.get('/sessions/attendance/summary');
      setStudentSummary(res.data.data.summary || null);
    } catch {
      // Non-critical
    }
  };

  const getDateRangeForView = (date: Date, mode: CalendarViewMode) => {
    const d = new Date(date);
    if (mode === 'month') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      start.setDate(start.getDate() - start.getDay());
      end.setDate(end.getDate() + (6 - end.getDay()));
      return { start, end };
    } else if (mode === 'week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (mode === 'day') {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      const start = new Date(d);
      start.setDate(d.getDate() - 14);
      const end = new Date(d);
      end.setDate(d.getDate() + 45);
      return { start, end };
    }
  };

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      const today = new Date();
      setCurrentDate(today);
      setSelectedDay(today);
      return;
    }

    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'day') {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(d);
    setSelectedDay(d);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month' || viewMode === 'agenda') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const { start, end } = getDateRangeForView(currentDate, 'week');
      return `${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const handleSessionClick = (session: IMentorshipSession) => {
    setSelectedSession(session);
    setDetailModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSessionToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (session: IMentorshipSession) => {
    setSessionToEdit(session);
    setFormModalOpen(true);
  };

  const handleOpenAttendance = (session: IMentorshipSession) => {
    setSessionForAttendance(session);
    setAttendanceModalOpen(true);
  };

  const handleDeleteClick = (session: IMentorshipSession) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/sessions/${sessionToDelete._id}`);
      showToast('Mentorship session deleted successfully', 'success');
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      fetchSessions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete session', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Compute live stats for header
  const liveCount = sessions.filter((s) => s.status === 'LIVE').length;
  const upcomingCount = sessions.filter(
    (s) => s.status === 'SCHEDULED' && new Date(s.startTime) >= new Date()
  ).length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const selectedDaySessions = sessions.filter((s) => isSameDay(new Date(s.startTime), selectedDay));

  return (
    <div className="d-flex flex-column gap-3.5 animate-enter text-start" style={{ color: '#0f172a' }}>
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 p-3.5 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="fs-4 fw-black font-display mb-0" style={{ color: '#0f172a' }}>
              Live Classes & Interactive Timetable
            </h1>
            {liveCount > 0 && (
              <span className="badge bg-danger text-white fw-bold animate-pulse d-inline-flex align-items-center gap-1.5 px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                <span className="rounded-circle bg-white" style={{ width: '8px', height: '8px' }} />
                {liveCount} LIVE NOW
              </span>
            )}
          </div>
          <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>
            {user?.role === 'STUDENT'
              ? 'Join 2-way live WebRTC masterclasses with Vishakha Ma\'am, attend problem-solving rooms, and view schedule.'
              : 'Schedule live lectures, launch in-app WebRTC video rooms, record attendance, and manage student batches.'}
          </p>
        </div>

        {isMentorOrAdmin && (
          <Button onClick={handleOpenCreate} className="btn-warning text-dark fw-bold shadow-sm d-inline-flex align-items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Schedule Live Session
          </Button>
        )}
      </div>

      {/* 2. Metric Overview Strip */}
      <div className="row g-2.5">
        <div className="col-6 col-md-3">
          <div className="card p-3 rounded-4 border shadow-sm d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div>
              <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Upcoming Sessions</div>
              <div className="fs-4 fw-black font-mono mt-0.5" style={{ color: '#0f172a' }}>{upcomingCount}</div>
            </div>
            <div className="p-2 rounded-3 text-warning" style={{ backgroundColor: '#fef3c7' }}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card p-3 rounded-4 border shadow-sm d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div>
              <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Live WebRTC Streams</div>
              <div className="fs-4 fw-black font-mono mt-0.5 text-danger">{liveCount}</div>
            </div>
            <div className="p-2 rounded-3 text-danger" style={{ backgroundColor: '#fee2e2' }}>
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card p-3 rounded-4 border shadow-sm d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div>
              <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>
                {user?.role === 'STUDENT' ? 'Attendance Rate' : 'Classes Completed'}
              </div>
              <div className="fs-4 fw-black font-mono mt-0.5 text-success">
                {user?.role === 'STUDENT' ? `${studentSummary?.attendanceRate ?? 100}%` : completedCount}
              </div>
            </div>
            <div className="p-2 rounded-3 text-success" style={{ backgroundColor: '#dcfce7' }}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card p-3 rounded-4 border shadow-sm d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div>
              <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Total Sessions</div>
              <div className="fs-4 fw-black font-mono mt-0.5 text-primary">{sessions.length}</div>
            </div>
            <div className="p-2 rounded-3 text-primary" style={{ backgroundColor: '#e0e7ff' }}>
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation & Filters Bar */}
      <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* Left: Date Switcher */}
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group">
              <button
                onClick={() => handleNavigate('prev')}
                className="btn btn-sm btn-outline-secondary py-1 px-2"
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleNavigate('today')}
                className="btn btn-sm btn-outline-secondary py-1 px-2.5 fw-bold"
                style={{ fontSize: '0.75rem' }}
              >
                Today
              </button>
              <button
                onClick={() => handleNavigate('next')}
                className="btn btn-sm btn-outline-secondary py-1 px-2"
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <h3 className="fs-6 fw-bold mb-0 text-dark font-display">
              {getHeaderTitle()}
            </h3>
          </div>

          {/* Center: View Switcher */}
          <div className="btn-group self-start md:self-auto">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`btn btn-sm text-capitalize px-3 py-1 fw-bold ${
                  viewMode === mode
                    ? 'btn-warning text-dark shadow-sm'
                    : 'btn-outline-secondary text-secondary'
                }`}
                style={{ fontSize: '0.75rem' }}
              >
                {mode === 'month' ? '📅 Month Grid' : mode === 'week' ? 'Weekly' : mode === 'day' ? 'Daily' : '📋 Schedule List'}
              </button>
            ))}
          </div>

          {/* Right: Search & Filters */}
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative" style={{ minWidth: '180px' }}>
              <Search className="position-absolute text-secondary" style={{ left: '8px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px' }} />
              <input
                type="text"
                placeholder="Search class or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control form-control-sm ps-4 py-1"
                style={{ fontSize: '0.76rem' }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select form-select-sm py-1"
              style={{ fontSize: '0.76rem' }}
            >
              <option value="ALL">All Types</option>
              <option value="BATCH">Batch Class</option>
              <option value="ONE_TO_ONE">1:1 Session</option>
              <option value="GROUP">Group Class</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select form-select-sm py-1"
              style={{ fontSize: '0.76rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Upcoming</option>
              <option value="LIVE">🔴 Live</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Selected Date Quick Bar (when viewing month grid) */}
      {viewMode === 'month' && (
        <div className="p-3 rounded-4 border shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2" style={{ backgroundColor: '#fefce8', borderColor: '#fde68a' }}>
          <div className="d-flex align-items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-warning" />
            <span className="small fw-bold" style={{ color: '#78350f' }}>
              Selected Date: <u>{selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</u>
            </span>
            <span className="badge bg-warning text-dark fw-bold ms-1" style={{ fontSize: '0.68rem' }}>
              {selectedDaySessions.length} Class{selectedDaySessions.length === 1 ? '' : 'es'} Scheduled
            </span>
          </div>

          {selectedDaySessions.length > 0 && (
            <div className="d-flex flex-wrap gap-2">
              {selectedDaySessions.map((s) => (
                <div key={s._id} className="d-inline-flex align-items-center gap-1.5 bg-white border px-2.5 py-1 rounded-pill shadow-sm" style={{ borderColor: '#fde68a' }}>
                  <span className="badge bg-danger text-white fw-bold" style={{ fontSize: '0.62rem' }}>
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="small fw-bold text-dark text-truncate" style={{ fontSize: '0.75rem', maxWidth: '180px' }}>
                    {s.title}
                  </span>
                  <Link
                    to={s.meetingLink?.startsWith('/') ? s.meetingLink : `/live/${s._id}`}
                    className="btn btn-warning text-dark btn-sm fw-bold py-0 px-2 rounded-pill shadow-sm"
                    style={{ fontSize: '0.68rem' }}
                  >
                    Join Live
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Main Calendar View Area */}
      {loading ? (
        <LoadingState message="Loading timetable & sessions..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSessions} />
      ) : (
        <div className="card p-3.5 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          {/* VIEW: MONTH (7-Column Calendar Grid) */}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={(day) => setSelectedDay(day)}
              sessions={sessions}
              onSessionClick={handleSessionClick}
            />
          )}

          {/* VIEW: WEEK */}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              sessions={sessions}
              onSessionClick={handleSessionClick}
            />
          )}

          {/* VIEW: DAY */}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              sessions={sessions}
              onSessionClick={handleSessionClick}
            />
          )}

          {/* VIEW: AGENDA (LIST) */}
          {viewMode === 'agenda' && (
            <AgendaView
              sessions={sessions}
              onSessionClick={handleSessionClick}
              onEdit={isMentorOrAdmin ? handleOpenEdit : undefined}
              onTakeAttendance={isMentorOrAdmin ? handleOpenAttendance : undefined}
              onDelete={isMentorOrAdmin ? handleDeleteClick : undefined}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <SessionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        session={selectedSession}
        onEdit={handleOpenEdit}
        onTakeAttendance={handleOpenAttendance}
        onRefresh={fetchSessions}
      />

      <SessionFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        sessionToEdit={sessionToEdit}
        onSuccess={fetchSessions}
      />

      <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        session={sessionForAttendance}
        onSuccess={fetchSessions}
      />

      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Cancel & Delete Session"
        message={`Are you sure you want to delete "${sessionToDelete?.title}"? All associated attendance records will be removed.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Session'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setSessionToDelete(null);
        }}
      />
    </div>
  );
};

// ---------------------- Calendar Sub-Views ---------------------- //

// 1. Month View (7 Columns Clean Grid Layout)
interface MonthViewProps {
  currentDate: Date;
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  sessions: IMentorshipSession[];
  onSessionClick: (session: IMentorshipSession) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  selectedDay,
  onSelectDay,
  sessions,
  onSessionClick
}) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const calendarDays: Date[] = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    calendarDays.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (d: Date) => isSameDay(d, new Date());
  const isCurrentMonth = (d: Date) => d.getMonth() === month;

  return (
    <div className="d-flex flex-column gap-2">
      {/* 7-Column Day Header */}
      <div
        className="w-100 text-center font-bold text-uppercase pb-2 border-bottom"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '6px',
          fontSize: '0.72rem',
          color: '#64748b',
          borderColor: '#e2e8f0'
        }}
      >
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 7-Column Grid of Days */}
      <div
        className="w-100"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '6px'
        }}
      >
        {calendarDays.map((day, idx) => {
          const daySessions = sessions.filter((s) => isSameDay(new Date(s.startTime), day));
          const inMonth = isCurrentMonth(day);
          const today = isToday(day);
          const isSelected = isSameDay(day, selectedDay);

          return (
            <div
              key={idx}
              onClick={() => onSelectDay(day)}
              className="p-2 rounded-3 border d-flex flex-column justify-content-between text-start cursor-pointer transition-all"
              style={{
                minHeight: '95px',
                backgroundColor: isSelected
                  ? '#fef9c3'
                  : today
                  ? '#fefce8'
                  : inMonth
                  ? '#ffffff'
                  : '#f8fafc',
                borderColor: isSelected
                  ? '#eab308'
                  : today
                  ? '#fde68a'
                  : '#e2e8f0',
                opacity: inMonth ? 1 : 0.45,
                boxShadow: isSelected ? '0 0 0 2px #facc15' : 'none',
                cursor: 'pointer'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold font-mono"
                  style={{
                    width: '22px',
                    height: '22px',
                    fontSize: '0.72rem',
                    backgroundColor: today ? '#f59e0b' : 'transparent',
                    color: today ? '#000000' : '#0f172a'
                  }}
                >
                  {day.getDate()}
                </span>
                {daySessions.length > 0 && (
                  <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.62rem' }}>
                    {daySessions.length}
                  </span>
                )}
              </div>

              {/* Sessions List inside cell */}
              <div className="d-flex flex-column gap-1 overflow-y-auto" style={{ maxHeight: '55px' }}>
                {daySessions.map((s) => {
                  const isLive = s.status === 'LIVE';
                  const startTimeStr = new Date(s.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <button
                      key={s._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick(s);
                      }}
                      className="btn text-start p-1 rounded-2 border text-truncate fw-semibold w-100"
                      style={{
                        fontSize: '0.65rem',
                        lineHeight: '1.2',
                        backgroundColor: isLive ? '#fee2e2' : '#f1f5f9',
                        borderColor: isLive ? '#ef4444' : '#cbd5e1',
                        color: isLive ? '#b91c1c' : '#0f172a'
                      }}
                    >
                      <span className="font-mono fw-bold me-1 text-secondary">{startTimeStr}</span>
                      <span>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. Week View
interface WeekViewProps {
  currentDate: Date;
  sessions: IMentorshipSession[];
  onSessionClick: (session: IMentorshipSession) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, sessions, onSessionClick }) => {
  const days: Date[] = [];
  const start = new Date(currentDate);
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <div
      className="w-100"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px'
      }}
    >
      {days.map((day, idx) => {
        const daySessions = sessions.filter((s) => isSameDay(new Date(s.startTime), day));
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={idx}
            className="p-2.5 rounded-3 border d-flex flex-column gap-2 text-start"
            style={{
              minHeight: '260px',
              backgroundColor: isToday ? '#fefce8' : '#ffffff',
              borderColor: isToday ? '#fde68a' : '#e2e8f0'
            }}
          >
            {/* Day Header */}
            <div className="pb-1.5 border-bottom" style={{ borderColor: '#e2e8f0' }}>
              <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="fw-black font-mono fs-6" style={{ color: isToday ? '#d97706' : '#0f172a' }}>
                {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Sessions list */}
            <div className="d-flex flex-column gap-1.5 flex-grow-1">
              {daySessions.map((s) => {
                const startTimeStr = new Date(s.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const isLive = s.status === 'LIVE';

                return (
                  <div
                    key={s._id}
                    onClick={() => onSessionClick(s)}
                    className="p-2 rounded-2 border cursor-pointer card-hover"
                    style={{
                      backgroundColor: isLive ? '#fee2e2' : '#f8fafc',
                      borderColor: isLive ? '#ef4444' : '#e2e8f0'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="font-mono text-secondary fw-bold" style={{ fontSize: '0.65rem' }}>
                        {startTimeStr}
                      </span>
                      {isLive && <span className="badge bg-danger text-white">LIVE</span>}
                    </div>
                    <div className="fw-bold small line-clamp-2" style={{ color: '#0f172a', fontSize: '0.75rem', lineHeight: '1.25' }}>
                      {s.title}
                    </div>
                    <div className="text-secondary mt-1" style={{ fontSize: '0.65rem' }}>
                      👨‍🏫 {s.mentor?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. Day View
interface DayViewProps {
  currentDate: Date;
  sessions: IMentorshipSession[];
  onSessionClick: (session: IMentorshipSession) => void;
}

const DayView: React.FC<DayViewProps> = ({ currentDate, sessions, onSessionClick }) => {
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const daySessions = sessions.filter((s) => isSameDay(new Date(s.startTime), currentDate));

  return (
    <div className="d-flex flex-column gap-3 text-start">
      <div className="p-3 rounded-3 border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fefce8', borderColor: '#fde68a' }}>
        <div>
          <h4 className="fw-bold mb-0 font-display fs-6" style={{ color: '#78350f' }}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h4>
          <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
            {daySessions.length} Scheduled Classes
          </span>
        </div>
      </div>

      <div className="d-flex flex-column gap-2">
        {daySessions.length === 0 ? (
          <div className="p-4 text-center text-secondary small">No classes scheduled on this day.</div>
        ) : (
          daySessions.map((s) => (
            <div
              key={s._id}
              onClick={() => onSessionClick(s)}
              className="p-3 rounded-3 border d-flex justify-content-between align-items-center cursor-pointer card-hover"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-3 text-warning" style={{ backgroundColor: '#fef3c7' }}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="fw-bold mb-0.5 fs-6" style={{ color: '#0f172a' }}>{s.title}</h5>
                  <div className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Faculty: <strong className="text-dark">{s.mentor?.name}</strong>
                  </div>
                </div>
              </div>

              <Link
                to={s.meetingLink?.startsWith('/') ? s.meetingLink : `/live/${s._id}`}
                className="btn btn-warning text-dark btn-sm fw-bold px-3 py-1.5 shadow-sm"
                style={{ fontSize: '0.78rem' }}
              >
                Join Live
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 4. Agenda (Schedule List) View
interface AgendaViewProps {
  sessions: IMentorshipSession[];
  onSessionClick: (session: IMentorshipSession) => void;
  onEdit?: (session: IMentorshipSession) => void;
  onTakeAttendance?: (session: IMentorshipSession) => void;
  onDelete?: (session: IMentorshipSession) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
  sessions,
  onSessionClick,
  onEdit,
  onTakeAttendance,
  onDelete
}) => {
  if (sessions.length === 0) {
    return <div className="p-4 text-center text-secondary small">No scheduled classes in this period.</div>;
  }

  return (
    <div className="d-flex flex-column gap-2.5 text-start">
      {sessions.map((s) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        const durationMins = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        const isLive = s.status === 'LIVE';

        return (
          <div
            key={s._id}
            className="p-3 rounded-4 border shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 card-hover"
            style={{
              backgroundColor: isLive ? '#fff7ed' : '#ffffff',
              borderColor: isLive ? '#fed7aa' : '#e2e8f0'
            }}
          >
            {/* Left: Date + Time + Details */}
            <div className="d-flex align-items-center gap-3">
              <div
                className="p-2.5 rounded-3 d-flex flex-column align-items-center justify-content-center text-center font-mono"
                style={{
                  width: '60px',
                  backgroundColor: isLive ? '#ea580c' : '#f8fafc',
                  color: isLive ? '#ffffff' : '#0f172a',
                  border: '1px solid #e2e8f0'
                }}
              >
                <span className="fw-black fs-5 lh-1">{start.getDate()}</span>
                <span className="text-uppercase fw-bold" style={{ fontSize: '0.62rem' }}>
                  {start.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>

              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-light text-dark border" style={{ fontSize: '0.65rem' }}>
                    {s.batch?.name || s.course?.title || s.type}
                  </span>
                  {isLive && <span className="badge bg-danger text-white">🔴 LIVE</span>}
                </div>
                <h4
                  onClick={() => onSessionClick(s)}
                  className="fw-bold mb-0.5 fs-6 cursor-pointer text-dark hover-primary"
                  style={{ cursor: 'pointer' }}
                >
                  {s.title}
                </h4>
                <div className="text-secondary small d-flex align-items-center gap-2" style={{ fontSize: '0.72rem' }}>
                  <span>🕒 {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationMins}m)</span>
                  <span>•</span>
                  <span>Mentor: <strong className="text-dark">{s.mentor?.name}</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="d-flex align-items-center gap-2">
              <Link
                to={s.meetingLink?.startsWith('/') ? s.meetingLink : `/live/${s._id}`}
                className="btn btn-warning text-dark fw-bold btn-sm py-1.5 px-3 shadow-sm d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.78rem' }}
              >
                <Video className="h-3.5 w-3.5" />
                Join WebRTC Class
              </Link>

              {onTakeAttendance && (
                <button
                  onClick={() => onTakeAttendance(s)}
                  className="btn btn-outline-secondary btn-sm py-1.5 px-2.5"
                  title="Attendance"
                  style={{ fontSize: '0.75rem' }}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(s)}
                  className="btn btn-outline-secondary btn-sm py-1.5 px-2.5"
                  title="Edit"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(s)}
                  className="btn btn-outline-danger btn-sm py-1.5 px-2.5"
                  title="Delete"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionCalendar;
