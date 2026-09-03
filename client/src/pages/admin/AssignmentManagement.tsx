import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Card, { CardContent } from '../../components/ui/Card';
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
  FileText,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Award,
  Edit,
  Trash2,
  ExternalLink,
  Code,
  Download,
  Users,
  Save,
  FolderOpen
} from 'lucide-react';
import type {
  IAssignment,
  IAssignmentSubmission,
  AssignmentStatus,
  SubmissionStatus
} from '../../types/assignment';

export const AssignmentManagement: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // State
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dropdowns data
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [mentorsList, setMentorsList] = useState<any[]>([]);

  // Create/Edit Assignment Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<IAssignment | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [batchId, setBatchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [allowedTypesInput, setAllowedTypesInput] = useState('pdf, zip, docx, png, jpg, js, ts, py');
  const [maxFileSize, setMaxFileSize] = useState(25);
  const [maxFiles, setMaxFiles] = useState(5);
  const [formStatus, setFormStatus] = useState<AssignmentStatus>('DRAFT');
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Submissions & Grading Drawer Modal
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<IAssignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<IAssignmentSubmission[]>([]);
  const [cohortOverview, setCohortOverview] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Active student grading state
  const [gradingSubmission, setGradingSubmission] = useState<IAssignmentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number | ''>('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'REVIEWED' | 'RETURNED'>('REVIEWED');
  const [savingGrade, setSavingGrade] = useState(false);

  // Delete dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<IAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchDropdowns();
  }, [batchFilter, statusFilter]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (batchFilter !== 'ALL') params.batchId = batchFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/assignments', { params });
      setAssignments(res.data.data.assignments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [bRes, cRes, uRes] = await Promise.all([
        api.get('/batches'),
        api.get('/courses'),
        api.get('/users?role=MENTOR')
      ]);
      setBatchesList(bRes.data.data.batches || []);
      setCoursesList(cRes.data.data.courses || []);
      setMentorsList(uRes.data.data.users || []);
    } catch {
      // Ignore
    }
  };

  // Convert Date to datetime-local
  const toLocalISOString = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setTitle('');
    setDescription('');
    setBatchId('');
    setCourseId('');
    setMentorId(user?.role === 'MENTOR' ? user.id : '');
    const inAWeek = new Date();
    inAWeek.setDate(inAWeek.getDate() + 7);
    setDueDate(toLocalISOString(inAWeek.toISOString()));
    setTotalMarks(100);
    setAllowedTypesInput('pdf, zip, docx, png, jpg, js, ts, py');
    setMaxFileSize(25);
    setMaxFiles(5);
    setFormStatus('DRAFT');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (assignment: IAssignment) => {
    setEditingAssignment(assignment);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setBatchId(assignment.batch?._id || '');
    setCourseId(assignment.course?._id || '');
    setMentorId(assignment.mentor?._id || '');
    setDueDate(toLocalISOString(assignment.dueDate));
    setTotalMarks(assignment.totalMarks);
    setAllowedTypesInput((assignment.allowedFileTypes || []).join(', '));
    setMaxFileSize(assignment.maxFileSize || 25);
    setMaxFiles(assignment.maxFiles || 5);
    setFormStatus(assignment.status);
    setFormModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) {
      showToast('Title, description, and due date are required', 'error');
      return;
    }

    const allowedFileTypes = allowedTypesInput
      .split(',')
      .map((t) => t.trim().replace(/^\./, ''))
      .filter(Boolean);

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      batch: batchId || undefined,
      course: courseId || undefined,
      mentor: mentorId || undefined,
      dueDate: new Date(dueDate).toISOString(),
      totalMarks: Number(totalMarks) || 100,
      allowedFileTypes,
      maxFileSize: Number(maxFileSize) || 25,
      maxFiles: Number(maxFiles) || 5,
      status: formStatus
    };

    setSavingAssignment(true);
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment._id}`, payload);
        showToast('Assignment updated successfully', 'success');
      } else {
        await api.post('/assignments', payload);
        showToast('Assignment created successfully', 'success');
      }
      setFormModalOpen(false);
      fetchAssignments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save assignment', 'error');
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteClick = (assignment: IAssignment) => {
    setAssignmentToDelete(assignment);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/assignments/${assignmentToDelete._id}`);
      showToast('Assignment and submissions deleted', 'success');
      setDeleteModalOpen(false);
      setAssignmentToDelete(null);
      fetchAssignments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete assignment', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Submissions & Grading Drawer Logic
  const handleOpenSubmissions = async (assignment: IAssignment) => {
    setSelectedAssignment(assignment);
    setSubmissionsModalOpen(true);
    setGradingSubmission(null);
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      setSubmissionsList(res.data.data.submissions || []);
      setCohortOverview(res.data.data.cohortOverview || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load submissions', 'error');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSelectGrading = (sub: IAssignmentSubmission) => {
    setGradingSubmission(sub);
    setGradeMarks(sub.marks !== undefined ? sub.marks : '');
    setGradeFeedback(sub.feedback || '');
    setGradeStatus(sub.status === 'RETURNED' ? 'RETURNED' : 'REVIEWED');
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !selectedAssignment) return;
    if (gradeMarks === '' || isNaN(Number(gradeMarks))) {
      showToast('Please enter valid numeric marks', 'error');
      return;
    }
    if (Number(gradeMarks) < 0 || Number(gradeMarks) > selectedAssignment.totalMarks) {
      showToast(`Marks must be between 0 and ${selectedAssignment.totalMarks}`, 'error');
      return;
    }

    setSavingGrade(true);
    try {
      const res = await api.post(`/assignments/submissions/${gradingSubmission._id}/grade`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback.trim(),
        status: gradeStatus
      });

      const updated = res.data.data.submission;
      setSubmissionsList((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s))
      );
      setGradingSubmission(updated);
      showToast('Grade and feedback saved! Student notified.', 'success');
      fetchAssignments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save grade', 'error');
    } finally {
      setSavingGrade(false);
    }
  };

  // Summary counts for cards
  const totalCount = assignments.length;
  const publishedCount = assignments.filter((a) => a.status === 'PUBLISHED').length;
  const totalSubmissionsCount = assignments.reduce(
    (acc, a) => acc + (a.submissionStats?.total || 0),
    0
  );
  const totalReviewedCount = assignments.reduce(
    (acc, a) => acc + (a.submissionStats?.reviewed || 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Assignment & Project Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create coursework tasks, configure submission guidelines, inspect code files, and grade submissions.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="shadow-premium">
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Total Tasks
              </span>
              <span className="text-2xl font-black font-mono text-foreground mt-0.5">
                {totalCount}
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Published
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                {publishedCount}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Submissions
              </span>
              <span className="text-2xl font-black font-mono text-indigo-400 mt-0.5">
                {totalSubmissionsCount}
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Graded
              </span>
              <span className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                {totalReviewedCount}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-card border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-premium">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="bg-input border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Batches</option>
            {batchesList.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-input border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <LoadingState message="Loading assignments studio..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAssignments} />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No Assignments Found"
          description="Create your first assignment or coursework task for enrolled cohorts."
          actionLabel="Create Assignment"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            const due = new Date(assignment.dueDate);
            const isPastDue = due < new Date();
            const stats = assignment.submissionStats || { total: 0, reviewed: 0, pending: 0 };

            return (
              <Card key={assignment._id} hoverable className="flex flex-col justify-between">
                <CardContent className="p-5 flex flex-col gap-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        assignment.status === 'PUBLISHED'
                          ? 'success'
                          : assignment.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="font-bold text-[10px]"
                    >
                      {assignment.status}
                    </Badge>

                    {assignment.batch && (
                      <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                        {assignment.batch.code}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold font-display text-foreground line-clamp-1">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Due Date:
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isPastDue ? 'text-rose-400' : 'text-foreground'
                        }`}
                      >
                        {due.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-400" />
                        Total Marks:
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {assignment.totalMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Submission Progress */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">Submissions</span>
                      <span className="font-mono font-bold text-foreground">
                        {stats.reviewed}/{stats.total} Graded
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{
                          width: `${
                            stats.total > 0 ? (stats.reviewed / stats.total) * 100 : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                    <Button
                      size="sm"
                      onClick={() => handleOpenSubmissions(assignment)}
                      className="text-xs font-bold shadow-premium"
                    >
                      <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                      Review Submissions ({stats.total})
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(assignment)}
                        className="p-1.5 h-8 w-8"
                        title="Edit Assignment"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(assignment)}
                        className="p-1.5 h-8 w-8 text-rose-400 hover:bg-rose-950/20"
                        title="Delete Assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Creator / Editor Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingAssignment ? 'Edit DPP / Assignment' : 'Create DPP Assignment Worksheet'}
        size="lg"
      >
        <form onSubmit={handleSaveAssignment} className="d-flex flex-column gap-3 text-start" style={{ color: '#0f172a' }}>
          <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="row g-3">
              {/* Title */}
              <div className="col-12">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Assignment / Worksheet Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DPP #08: Mathematics Pedagogy & Differential Equations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-control form-control-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Target Batch */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Target Batch Cohort <span className="text-danger">*</span>
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  required
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

              {/* Associated Course */}
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

              {/* Description */}
              <div className="col-12">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Description & Task Requirements <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete task specifications, instructions, questions list, deliverables, and guidelines..."
                  required
                  className="form-control form-control-sm"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Due Date */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Due Date & Submission Deadline <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="form-control form-control-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Total Marks */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Total Maximum Marks <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
                  required
                  className="form-control form-control-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Attachment rules */}
              <div className="col-12">
                <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="small fw-bold text-dark mb-2">📁 File Attachment Guidelines</div>
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label small mb-1 text-secondary" style={{ fontSize: '0.74rem' }}>
                        Allowed Extensions
                      </label>
                      <input
                        type="text"
                        placeholder="pdf, zip, docx, png, jpg"
                        value={allowedTypesInput}
                        onChange={(e) => setAllowedTypesInput(e.target.value)}
                        className="form-control form-control-sm py-1"
                        style={{ fontSize: '0.78rem' }}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small mb-1 text-secondary" style={{ fontSize: '0.74rem' }}>
                        Max Size (MB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={maxFileSize}
                        onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 25)}
                        className="form-control form-control-sm py-1"
                        style={{ fontSize: '0.78rem' }}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small mb-1 text-secondary" style={{ fontSize: '0.74rem' }}>
                        Max Files
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={maxFiles}
                        onChange={(e) => setMaxFiles(parseInt(e.target.value) || 5)}
                        className="form-control form-control-sm py-1"
                        style={{ fontSize: '0.78rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assign Mentor */}
              {isAdmin && (
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                    Assign Mentor Reviewer
                  </label>
                  <select
                    value={mentorId}
                    onChange={(e) => setMentorId(e.target.value)}
                    className="form-select form-select-sm py-1.5"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="">None / Self</option>
                    {mentorsList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Publishing Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AssignmentStatus)}
                  className="form-select form-select-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="DRAFT">Draft (Hidden from students)</option>
                  <option value="PUBLISHED">Published (Available on Student Portal)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top" style={{ borderColor: '#e2e8f0' }}>
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="btn btn-outline-secondary btn-sm py-1.5 px-3"
              style={{ fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAssignment}
              className="btn btn-warning text-dark btn-sm fw-bold py-1.5 px-4 shadow-sm"
              style={{ fontSize: '0.82rem' }}
            >
              {savingAssignment
                ? 'Saving...'
                : editingAssignment
                ? 'Update Assignment'
                : 'Create & Publish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submissions & Grading Drawer Modal */}
      <Modal
        isOpen={submissionsModalOpen}
        onClose={() => setSubmissionsModalOpen(false)}
        title={`Submissions: ${selectedAssignment?.title || ''}`}
        size="lg"
      >
        <div className="flex flex-col gap-6 -mt-2 max-h-[80vh] overflow-y-auto pr-1">
          {/* Header Info */}
          <div className="flex items-center justify-between p-3.5 bg-secondary/40 border border-border rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-mono">
                Due: {selectedAssignment ? new Date(selectedAssignment.dueDate).toLocaleString() : ''}
              </span>
              <span className="text-sm font-bold text-foreground">
                Total Marks: {selectedAssignment?.totalMarks}
              </span>
            </div>
            <Badge variant="primary">{submissionsList.length} Submitted</Badge>
          </div>

          {loadingSubmissions ? (
            <LoadingState message="Fetching student submissions..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Column: Submissions List */}
              <div className="md:col-span-5 flex flex-col gap-2 overflow-y-auto max-h-[450px]">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Student Roster ({cohortOverview.length})
                </span>

                {cohortOverview.length === 0 && (
                  <p className="text-xs text-muted-foreground p-4 text-center">No students in cohort.</p>
                )}

                {cohortOverview.map((item) => {
                  const sub = item.submission;
                  const isSelected = gradingSubmission?._id === sub?._id;

                  const statusColors = {
                    REVIEWED: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
                    RETURNED: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
                    LATE: 'text-rose-400 border-rose-500/20 bg-rose-950/20',
                    SUBMITTED: 'text-primary border-primary/20 bg-primary/10',
                    DRAFT: 'text-muted-foreground border-border bg-secondary/30'
                  };

                  return (
                    <div
                      key={item.student._id}
                      onClick={() => sub && handleSelectGrading(sub)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        sub ? 'cursor-pointer hover:border-primary/50' : 'opacity-50'
                      } ${
                        isSelected
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {item.student.name}
                        </span>
                        {sub ? (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border font-bold uppercase ${
                              statusColors[sub.status as SubmissionStatus]
                            }`}
                          >
                            {sub.status}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-muted-foreground">Not submitted</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{item.student.email}</span>
                        {sub?.marks !== undefined && (
                          <span className="font-mono font-bold text-emerald-400">
                            {sub.marks}/{selectedAssignment?.totalMarks}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Grading Studio for Selected Student */}
              <div className="md:col-span-7 flex flex-col gap-4 p-4 rounded-xl border border-border bg-secondary/20">
                {!gradingSubmission ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <span className="text-xs">Select a student submission on the left to review and grade.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {gradingSubmission.student.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Submitted: {new Date(gradingSubmission.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant={gradingSubmission.status === 'LATE' ? 'destructive' : 'primary'}>
                        {gradingSubmission.status}
                      </Badge>
                    </div>

                    {/* Files & Links */}
                    {gradingSubmission.files && gradingSubmission.files.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-foreground">Attached Files:</span>
                        <div className="flex flex-col gap-1">
                          {gradingSubmission.files.map((f, fidx) => (
                            <a
                              key={fidx}
                              href={f.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs hover:border-primary transition-all text-primary font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{f.originalName}</span>
                              </div>
                              <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* External Project URLs */}
                    {(gradingSubmission.githubUrl || gradingSubmission.liveUrl) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {gradingSubmission.githubUrl && (
                          <a
                            href={gradingSubmission.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground hover:border-primary transition-all font-semibold"
                          >
                            <Code className="h-3.5 w-3.5" />
                            GitHub Repository
                          </a>
                        )}
                        {gradingSubmission.liveUrl && (
                          <a
                            href={gradingSubmission.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-primary hover:underline font-semibold"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Live Demo App
                          </a>
                        )}
                      </div>
                    )}

                    {/* Student Notes / Answers */}
                    {gradingSubmission.answer && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Student Notes:</span>
                        <p className="text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border leading-relaxed whitespace-pre-line">
                          {gradingSubmission.answer}
                        </p>
                      </div>
                    )}

                    {/* Grading Inputs */}
                    <div className="p-3.5 bg-card border border-border rounded-xl flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Evaluation & Feedback
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label={`Marks (out of ${selectedAssignment?.totalMarks}) *`}
                          type="number"
                          min="0"
                          max={selectedAssignment?.totalMarks}
                          value={gradeMarks}
                          onChange={(e) => setGradeMarks(e.target.value === '' ? '' : Number(e.target.value))}
                        />

                        <Select
                          label="Grading Decision"
                          value={gradeStatus}
                          onChange={(e) => setGradeStatus(e.target.value as 'REVIEWED' | 'RETURNED')}
                          options={[
                            { value: 'REVIEWED', label: 'Reviewed (Pass/Grade)' },
                            { value: 'RETURNED', label: 'Returned (Request Revision)' }
                          ]}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                          Instructor Feedback & Comments
                        </label>
                        <textarea
                          rows={3}
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          placeholder="Provide constructive feedback, suggestions for improvement, or praise..."
                          className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleSaveGrade}
                        disabled={savingGrade}
                        className="self-end shadow-premium"
                      >
                        <Save className="h-4 w-4 mr-1.5" />
                        {savingGrade ? 'Saving...' : 'Save Grade & Notify Student'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Assignment"
        message={`Are you sure you want to delete "${assignmentToDelete?.title}"? All student submission records will be permanently removed.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Assignment'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setAssignmentToDelete(null);
        }}
      />
    </div>
  );
};

export default AssignmentManagement;
