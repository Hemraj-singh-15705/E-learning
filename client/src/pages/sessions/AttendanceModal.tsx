import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  Search,
  CheckCircle2,
  Save
} from 'lucide-react';
import type { IMentorshipSession } from '../../types/session';
import type {
  AttendanceStatus,
  IAttendanceRosterItem
} from '../../types/attendance';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: IMentorshipSession | null;
  onSuccess?: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [roster, setRoster] = useState<IAttendanceRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [markCompleted, setMarkCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      fetchAttendance();
    }
  }, [isOpen, session]);

  const fetchAttendance = async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/sessions/${session._id}/attendance`);
      setRoster(res.data.data.roster || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attendance roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student._id === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student._id === studentId ? { ...item, notes } : item
      )
    );
  };

  const handleDurationChange = (studentId: string, duration: number) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student._id === studentId ? { ...item, duration } : item
      )
    );
  };

  const markAllPresent = () => {
    setRoster((prev) => prev.map((item) => ({ ...item, status: 'PRESENT' })));
    showToast('All students set to PRESENT', 'info');
  };

  const handleSaveAttendance = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const records = roster.map((item) => ({
        studentId: item.student._id,
        status: item.status,
        duration: item.duration || 0,
        notes: item.notes || ''
      }));

      await api.post(`/sessions/${session._id}/attendance`, {
        records,
        markSessionCompleted: markCompleted
      });

      showToast('Attendance saved successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  // Filter roster by search
  const filteredRoster = roster.filter(
    (item) =>
      item.student.name.toLowerCase().includes(search.toLowerCase()) ||
      item.student.email.toLowerCase().includes(search.toLowerCase())
  );

  // Live computed stats from current state
  const currentTotal = roster.length;
  const currentPresent = roster.filter((r) => r.status === 'PRESENT').length;
  const currentLate = roster.filter((r) => r.status === 'LATE').length;
  const currentExcused = roster.filter((r) => r.status === 'EXCUSED').length;
  const currentAbsent = roster.filter((r) => r.status === 'ABSENT').length;
  const currentRate =
    currentTotal > 0
      ? Math.round(((currentPresent + currentLate) / currentTotal) * 100)
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Register"
      size="lg"
    >
      <div className="flex flex-col gap-5 -mt-2 max-h-[80vh] overflow-y-auto pr-1">
        {/* Session Sub-header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3.5 bg-secondary/40 border border-border rounded-xl">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">
              {session.type} • {session.batch?.name || 'Assigned Cohort'}
            </span>
            <h3 className="text-sm font-bold text-foreground">{session.title}</h3>
          </div>
          <Badge variant={session.status === 'LIVE' ? 'destructive' : 'primary'}>
            {session.status}
          </Badge>
        </div>

        {/* Live Metrics Header Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 bg-secondary/30 border border-border rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Attendance Rate
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {currentRate}%
            </span>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
              Present
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {currentPresent}
            </span>
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
              Late
            </span>
            <span className="text-lg font-black font-mono text-amber-400">
              {currentLate}
            </span>
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold">
              Excused
            </span>
            <span className="text-lg font-black font-mono text-indigo-400">
              {currentExcused}
            </span>
          </div>

          <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold">
              Absent
            </span>
            <span className="text-lg font-black font-mono text-rose-400">
              {currentAbsent}
            </span>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllPresent}
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Mark All Present
            </Button>
          </div>
        </div>

        {/* Attendance Roster Table */}
        {loading ? (
          <LoadingState message="Loading attendance roster..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAttendance} />
        ) : filteredRoster.length === 0 ? (
          <EmptyState
            title="No Students Found"
            description="No active students are assigned to this session or cohort."
          />
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-semibold">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3 text-center">Attendance Status</th>
                    <th className="px-4 py-3">Duration (Mins)</th>
                    <th className="px-4 py-3">Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoster.map((item) => {
                    const st = item.student;
                    return (
                      <tr key={st._id} className="hover:bg-secondary/20 transition-all">
                        {/* Student Details */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                              {st.name?.[0] || 'S'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{st.name}</span>
                              <span className="text-[10px] text-muted-foreground">{st.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status Pills */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {(['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as AttendanceStatus[]).map(
                              (statusOpt) => {
                                const isSelected = item.status === statusOpt;
                                const statusColors = {
                                  PRESENT: isSelected
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                                  LATE: isSelected
                                    ? 'bg-amber-600 text-white font-bold'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                                  EXCUSED: isSelected
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                                  ABSENT: isSelected
                                    ? 'bg-rose-600 text-white font-bold'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                                };

                                return (
                                  <button
                                    key={statusOpt}
                                    type="button"
                                    onClick={() => handleStatusChange(st._id, statusOpt)}
                                    className={`px-2 py-1 rounded-md text-[10px] uppercase font-mono tracking-wider transition-all ${statusColors[statusOpt]}`}
                                  >
                                    {statusOpt}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={item.duration || 0}
                            onChange={(e) =>
                              handleDurationChange(st._id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(st._id, e.target.value)}
                            className="w-full bg-input border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer & Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-border">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markCompleted}
              onChange={(e) => setMarkCompleted(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-input"
            />
            <span>Mark session as COMPLETED after saving</span>
          </label>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAttendance}
              disabled={saving || loading}
              className="shadow-premium"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Attendance Register'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AttendanceModal;
