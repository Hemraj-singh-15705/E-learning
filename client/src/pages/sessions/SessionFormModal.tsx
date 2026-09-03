import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import api from '../../utils/api';
import {
  Calendar,
  AlertCircle,
  ShieldCheck,
  Radio
} from 'lucide-react';
import type {
  IMentorshipSession,
  SessionType,
  MeetingProvider,
  IActionItem
} from '../../types/session';

interface SessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit: IMentorshipSession | null;
  onSuccess: () => void;
}

export const SessionFormModal: React.FC<SessionFormModalProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  onSuccess
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const isCreate = !sessionToEdit;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SessionType>('BATCH');
  const [mentorId, setMentorId] = useState(user?.role === 'MENTOR' ? user.id : '');
  const [batchId, setBatchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider>('CUSTOM');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [status, setStatus] = useState<string>('SCHEDULED');

  // Notes states (for editing)
  const [summary, setSummary] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [actionItems, setActionItems] = useState<IActionItem[]>([]);
  const [privateMentorNotes, setPrivateMentorNotes] = useState('');

  // Dropdown data
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState('');

  // Format date to datetime-local string (YYYY-MM-DDTHH:mm)
  const toLocalISOString = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      if (sessionToEdit) {
        setTitle(sessionToEdit.title || '');
        setDescription(sessionToEdit.description || '');
        setType(sessionToEdit.type || 'BATCH');
        setMentorId(sessionToEdit.mentor?._id || user?.id || '');
        setBatchId(sessionToEdit.batch?._id || '');
        setCourseId(sessionToEdit.course?._id || '');
        setSelectedStudentIds(sessionToEdit.students?.map((s) => s._id) || []);
        setStartTime(toLocalISOString(sessionToEdit.startTime));
        setEndTime(toLocalISOString(sessionToEdit.endTime));
        setMeetingProvider(sessionToEdit.meetingProvider || 'CUSTOM');
        setMeetingLink(sessionToEdit.meetingLink || '');
        setMeetingPassword(sessionToEdit.meetingPassword || '');
        setStatus(sessionToEdit.status || 'SCHEDULED');

        if (sessionToEdit.notes) {
          setSummary(sessionToEdit.notes.summary || '');
          setTopicsInput((sessionToEdit.notes.topics || []).join(', '));
          setActionItems(sessionToEdit.notes.actionItems || []);
          setPrivateMentorNotes(sessionToEdit.notes.privateMentorNotes || '');
        }
      } else {
        // Default init for create: Built-in in-app WebRTC classroom!
        setTitle('');
        setDescription('');
        setType('BATCH');
        setMentorId(user?.role === 'MENTOR' ? user.id : '');
        setBatchId('');
        setCourseId('');
        setSelectedStudentIds([]);
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const later = new Date(now);
        later.setHours(later.getHours() + 1);
        setStartTime(toLocalISOString(now.toISOString()));
        setEndTime(toLocalISOString(later.toISOString()));
        setMeetingProvider('CUSTOM');
        // Auto-generate Built-In WebRTC Classroom link!
        const autoRoomId = `class-${Math.random().toString(36).substring(2, 9)}`;
        setMeetingLink(`/live/${autoRoomId}`);
        setMeetingPassword('');
        setStatus('SCHEDULED');
        setSummary('');
        setTopicsInput('');
        setActionItems([]);
        setPrivateMentorNotes('');
      }
      setConflictError('');
    }
  }, [isOpen, sessionToEdit]);

  const fetchDropdownData = async () => {
    try {
      const [bRes, cRes, uRes] = await Promise.all([
        api.get('/batches'),
        api.get('/courses'),
        api.get('/users?limit=100')
      ]);

      setBatchesList(bRes.data.data.batches || []);
      setCoursesList(cRes.data.data.courses || []);
      
      const allUsers = uRes.data.data.users || [];
      setMentorsList(allUsers.filter((u: any) => u.role === 'MENTOR' || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'));
      setStudentsList(allUsers.filter((u: any) => u.role === 'STUDENT'));
    } catch {
      // Fallback silently if some endpoints are restricted
    }
  };

  const handleProviderChange = (provider: MeetingProvider) => {
    setMeetingProvider(provider);
    if (provider === 'CUSTOM') {
      const autoRoomId = `class-${Math.random().toString(36).substring(2, 9)}`;
      setMeetingLink(`/live/${autoRoomId}`);
    } else if (provider === 'GOOGLE_MEET') {
      setMeetingLink('https://meet.google.com/');
    } else if (provider === 'ZOOM') {
      setMeetingLink('https://zoom.us/j/');
    } else {
      setMeetingLink('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');

    if (!title.trim()) {
      showToast('Session title is required', 'error');
      return;
    }
    if (!startTime || !endTime) {
      showToast('Start and end times are required', 'error');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      showToast('Start time must be earlier than end time', 'error');
      return;
    }
    if (!meetingLink.trim()) {
      showToast('Meeting link is required', 'error');
      return;
    }

    const topics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      type,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      meetingProvider,
      meetingLink: meetingLink.trim(),
      meetingPassword: meetingPassword.trim() || undefined,
      notes: {
        summary: summary.trim(),
        topics,
        actionItems,
        privateMentorNotes: privateMentorNotes.trim()
      }
    };

    if (isAdmin && mentorId) {
      payload.mentor = mentorId;
    }
    if (batchId) payload.batch = batchId;
    if (courseId) payload.course = courseId;
    if (type !== 'BATCH') payload.students = selectedStudentIds;
    if (!isCreate) payload.status = status;

    setSaving(true);
    try {
      if (isCreate) {
        await api.post('/sessions', payload);
        showToast('Live session scheduled in Built-In WebRTC successfully!', 'success');
      } else {
        await api.put(`/sessions/${sessionToEdit._id}`, payload);
        showToast('Live session updated successfully!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save session.';
      if (err.response?.status === 409) {
        setConflictError(msg);
      }
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Schedule Live Class / Mentorship Session' : 'Edit Live Class Session'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3 text-start" style={{ color: '#0f172a' }}>
        {conflictError && (
          <div className="p-3 rounded-3 border border-danger bg-danger bg-opacity-10 text-danger small d-flex align-items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{conflictError}</span>
          </div>
        )}

        {/* 1. Basic Details Card */}
        <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="row g-3">
            {/* Title */}
            <div className="col-12">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Class / Session Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. DSSSB TGT Math: Live Calculus Tricks & Problem Solving"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-control form-control-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            {/* Session Type */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Session Format / Type <span className="text-danger">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SessionType)}
                className="form-select form-select-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              >
                <option value="BATCH">Batch Cohort Live Class (All Students in Batch)</option>
                <option value="ONE_TO_ONE">1:1 Dedicated Mentorship Session</option>
                <option value="GROUP">Small Group Doubt Clearing Session</option>
              </select>
            </div>

            {/* Target Batch Cohort */}
            {type === 'BATCH' && (
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Target Batch Cohort <span className="text-danger">*</span>
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="form-select form-select-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="">Select Batch...</option>
                  {batchesList.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Assigned Mentor (if Admin) */}
            {isAdmin && (
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Assigned Master Faculty / Mentor <span className="text-danger">*</span>
                </label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="form-select form-select-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="">Select Mentor...</option>
                  {mentorsList.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Course association */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Associated Exam Course (Optional)
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="form-select form-select-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              >
                <option value="">None / General</option>
                {coursesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Picker for 1:1 or Group */}
            {type !== 'BATCH' && (
              <div className="col-12">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  {type === 'ONE_TO_ONE' ? 'Select Student *' : 'Select Students (Hold Ctrl to pick multiple)'}
                </label>
                <select
                  multiple={type === 'GROUP'}
                  value={type === 'ONE_TO_ONE' ? selectedStudentIds[0] || '' : selectedStudentIds}
                  onChange={(e) => {
                    if (type === 'ONE_TO_ONE') {
                      setSelectedStudentIds(e.target.value ? [e.target.value] : []);
                    } else {
                      const values = Array.from(e.target.selectedOptions, (option) => option.value);
                      setSelectedStudentIds(values);
                    }
                  }}
                  className="form-select form-select-sm"
                  style={{ fontSize: '0.82rem', height: '90px' }}
                >
                  {studentsList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="col-12">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Description / Topic Agenda Overview
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What topics, shortcut tricks, and question types will be covered in this session..."
                className="form-control form-control-sm"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>
        </div>

        {/* 2. Timing Windows Card */}
        <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="d-flex align-items-center gap-1.5 mb-2.5 text-dark fw-bold small">
            <Calendar className="h-4 w-4 text-warning" />
            <span>Date & Timing Window</span>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Start Time <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="form-control form-control-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                End Time <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="form-control form-control-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>
        </div>

        {/* 3. In-App WebRTC Video Classroom Selection */}
        <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#fefce8', borderColor: '#fde68a' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-1.5 fw-bold small" style={{ color: '#78350f' }}>
              <Radio className="h-4 w-4 text-danger animate-pulse" />
              <span>Live Meeting Platform & WebRTC Stream</span>
            </div>
            {meetingProvider === 'CUSTOM' && (
              <span className="badge bg-success text-white fw-bold px-2 py-1" style={{ fontSize: '0.65rem' }}>
                ✨ Built-In In-App WebRTC
              </span>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Meeting Platform
              </label>
              <select
                value={meetingProvider}
                onChange={(e) => handleProviderChange(e.target.value as MeetingProvider)}
                className="form-select form-select-sm py-1.5 fw-bold"
                style={{ fontSize: '0.82rem' }}
              >
                <option value="CUSTOM">🎥 Built-In WebRTC Classroom (In-App, No 3rd-Party)</option>
                <option value="GOOGLE_MEET">Google Meet (External Link)</option>
                <option value="ZOOM">Zoom Meetings (External Link)</option>
                <option value="JITSI">Jitsi Meet</option>
                <option value="TEAMS">Microsoft Teams</option>
              </select>
            </div>

            <div className="col-12 col-md-7">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Meeting URL / Room Key <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. /live/class-abc123 or https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                required
                className="form-control form-control-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            {meetingProvider === 'CUSTOM' ? (
              <div className="col-12">
                <div className="p-2 rounded-2 border border-warning bg-white d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                  <span>
                    <strong>Zero Third-Party Dependency:</strong> Students and mentors will conduct this live class directly inside the browser using our built-in WebRTC audio, video, whiteboard, and real-time doubt chat studio.
                  </span>
                </div>
              </div>
            ) : (
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Passcode / PIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={meetingPassword}
                  onChange={(e) => setMeetingPassword(e.target.value)}
                  className="form-control form-control-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            )}

            {!isCreate && (
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Session Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select form-select-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="SCHEDULED">SCHEDULED (Upcoming)</option>
                  <option value="LIVE">LIVE (Currently Streaming)</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 4. Notes & Topics Card (Optional) */}
        <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                Topics Covered (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Differentiation, Chain Rule, Trigonometric Identities, CTET Pedagogy"
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                className="form-control form-control-sm py-1.5"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top" style={{ borderColor: '#e2e8f0' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline-secondary btn-sm py-1.5 px-3"
            style={{ fontSize: '0.8rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-warning text-dark btn-sm fw-bold py-1.5 px-4 d-inline-flex align-items-center gap-1 shadow-sm"
            style={{ fontSize: '0.82rem' }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Scheduling...
              </>
            ) : isCreate ? (
              'Schedule Live WebRTC Class'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionFormModal;
