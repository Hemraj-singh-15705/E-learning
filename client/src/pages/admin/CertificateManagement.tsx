import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import api from '../../utils/api';
import {
  Award,
  Plus,
  Search,
  Copy,
  Ban
} from 'lucide-react';
import type { ICertificate } from '../../types/certificate';

export const CertificateManagement: React.FC = () => {
  const { showToast } = useToast();

  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Manual Issue Modal
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [grade, setGrade] = useState('A+');
  const [score, setScore] = useState<number | ''>(95);
  const [issuing, setIssuing] = useState(false);

  // Revoke Dialog
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [certToRevoke, setCertToRevoke] = useState<ICertificate | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchCertificates();
    fetchPrerequisites();
  }, [statusFilter]);

  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/certificates?status=${statusFilter}&search=${search}`);
      setCertificates(res.data.data.certificates || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load certificate ledger.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrerequisites = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/users?role=STUDENT'),
        api.get('/courses')
      ]);
      setStudents(usersRes.data.data?.users || []);
      setCourses(coursesRes.data.data?.courses || []);
    } catch (e) {
      // Graceful fallback
    }
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify-certificate/${code}`;
    navigator.clipboard.writeText(url);
    showToast('Public verification link copied to clipboard!', 'info');
  };

  const handleOpenIssue = () => {
    setSelectedStudentId(students[0]?._id || '');
    setSelectedCourseId(courses[0]?._id || '');
    setGrade('A+');
    setScore(95);
    setIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Please select a student', 'error');
      return;
    }

    setIssuing(true);
    try {
      await api.post('/certificates/issue', {
        studentId: selectedStudentId,
        courseId: selectedCourseId || undefined,
        completionData: {
          grade,
          score: Number(score) || 100,
          totalHours: 40
        }
      });
      showToast('Official certificate issued successfully!', 'success');
      setIssueModalOpen(false);
      fetchCertificates();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to issue certificate', 'error');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = (cert: ICertificate) => {
    setCertToRevoke(cert);
    setRevokeModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!certToRevoke) return;
    setRevoking(true);
    try {
      await api.patch(`/certificates/${certToRevoke._id}/revoke`);
      showToast('Certificate has been revoked.', 'info');
      setRevokeModalOpen(false);
      setCertToRevoke(null);
      fetchCertificates();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to revoke certificate', 'error');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Certificates & Credentials Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit institutional credentials, generate completion awards, and manage verification records.
          </p>
        </div>

        <Button onClick={handleOpenIssue} className="shadow-premium">
          <Plus className="h-4 w-4 mr-2" />
          Issue Certificate
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Certificate ID or Verification Hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCertificates()}
            className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'ISSUED', label: 'Issued Only' },
            { value: 'REVOKED', label: 'Revoked Only' }
          ]}
          className="w-full sm:w-44"
        />
      </div>

      {/* Ledger Table */}
      {loading ? (
        <LoadingState message="Loading certificate ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCertificates} />
      ) : certificates.length === 0 ? (
        <EmptyState
          title="No Certificates Found"
          description="Issue your first student certificate using the button above."
          actionLabel="Issue Certificate"
          onAction={handleOpenIssue}
        />
      ) : (
        <Card className="bg-card border-border shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold bg-secondary/30">
                  <th className="py-3 px-4">Certificate #</th>
                  <th className="py-3 px-4">Verification Code</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Program / Track</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-secondary/20 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {cert.verificationCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{cert.student?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{cert.student?.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {cert.course?.title || cert.batch?.name || 'General Completion'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {new Date(cert.issueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={cert.status === 'ISSUED' ? 'success' : 'destructive'}
                        className="text-[10px] font-bold"
                      >
                        {cert.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(cert.verificationCode)}
                          className="p-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Copy Public Link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {cert.status === 'ISSUED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(cert)}
                            className="p-1.5 h-8 w-8 text-rose-400 hover:bg-rose-950/20"
                            title="Revoke Certificate"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual Issue Modal */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title="Issue Official Certificate"
        size="md"
      >
        <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4 -mt-2">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Select Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {students.length === 0 ? (
                <option value="">No students available</option>
              ) : (
                students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Course / Program Track
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">General Program Track</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Evaluation Grade"
              placeholder="e.g. A+"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />

            <Input
              label="Score Percentage (%)"
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={issuing}>
              {issuing ? 'Generating Certificate...' : 'Issue Certificate'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revoke Confirmation */}
      <ConfirmationDialog
        isOpen={revokeModalOpen}
        title="Revoke Certificate"
        message={`Are you sure you want to revoke certificate "${certToRevoke?.certificateNumber}"? It will no longer pass public verification.`}
        confirmLabel={revoking ? 'Revoking...' : 'Revoke Certificate'}
        isLoading={revoking}
        onConfirm={confirmRevoke}
        onClose={() => {
          setRevokeModalOpen(false);
          setCertToRevoke(null);
        }}
      />
    </div>
  );
};

export default CertificateManagement;
