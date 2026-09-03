import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  FileText,
  Calendar,
  Award,
  AlertCircle,
  ArrowLeft,
  UploadCloud,
  Trash2,
  Send
} from 'lucide-react';
import type {
  IAssignment,
  IAssignmentSubmission,
  ISubmissionFile
} from '../../types/assignment';

export const StudentAssignmentSubmit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [submission, setSubmission] = useState<IAssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [files, setFiles] = useState<ISubmissionFile[]>([]);
  const [answer, setAnswer] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  const fetchAssignmentDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/assignments/${id}`);
      const aData = res.data.data.assignment;
      setAssignment(aData);
      if (aData.mySubmission) {
        setSubmission(aData.mySubmission);
        setFiles(aData.mySubmission.files || []);
        setAnswer(aData.mySubmission.answer || '');
        setGithubUrl(aData.mySubmission.githubUrl || '');
        setLiveUrl(aData.mySubmission.liveUrl || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || !assignment) return;

    const maxAllowed = assignment.maxFiles || 5;
    if (files.length + uploaded.length > maxAllowed) {
      showToast(`You can upload at most ${maxAllowed} files.`, 'error');
      return;
    }

    const allowedExts = assignment.allowedFileTypes || [];
    const maxSizeBytes = (assignment.maxFileSize || 25) * 1024 * 1024;

    Array.from(uploaded).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
        showToast(
          `Invalid file type ".${ext}". Allowed: ${allowedExts.join(', ')}`,
          'error'
        );
        return;
      }

      if (file.size > maxSizeBytes) {
        showToast(
          `File "${file.name}" exceeds max limit of ${assignment.maxFileSize}MB`,
          'error'
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const fileObj: ISubmissionFile = {
          fileUrl: reader.result as string,
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type || ext
        };
        setFiles((prev) => [...prev, fileObj]);
        showToast(`Attached "${file.name}"`, 'info');
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !assignment) return;

    if (files.length === 0 && !answer.trim() && !githubUrl.trim()) {
      showToast('Please attach at least one file, a GitHub repo, or answer text.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/assignments/${id}/submit`, {
        files,
        answer: answer.trim(),
        githubUrl: githubUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined
      });

      const updatedSub = res.data.data.submission;
      setSubmission(updatedSub);
      showToast(res.data.message || 'Assignment submitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading assignment workspace..." />;
  if (error || !assignment) return <ErrorState message={error || 'Assignment not found'} onRetry={fetchAssignmentDetails} />;

  const due = new Date(assignment.dueDate);
  const isPastDue = due < new Date();
  const isReviewed = submission?.status === 'REVIEWED';
  const isReturned = submission?.status === 'RETURNED';
  const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'LATE';

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/student/assignments')}
          className="text-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Assignments
        </Button>

        {submission && (
          <Badge
            variant={
              isReviewed
                ? 'success'
                : isReturned
                ? 'warning'
                : submission.status === 'LATE'
                ? 'destructive'
                : 'primary'
            }
            className="font-bold text-xs"
          >
            {isReviewed
              ? 'Graded & Reviewed'
              : isReturned
              ? 'Revision Requested'
              : submission.status === 'LATE'
              ? 'Submitted (Late)'
              : 'Submitted'}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assignment Specifications & Evaluation Card */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Assignment Details Card */}
          <Card className="bg-card border-border shadow-premium">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {assignment.batch?.name || 'Cohort Task'}
                </span>
                <span className="text-xs font-mono text-muted-foreground font-bold">
                  {assignment.totalMarks} Total Marks
                </span>
              </div>
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Due Date Indicator */}
              <div className="p-3.5 bg-secondary/40 border border-border rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Due Date:</span>
                </div>
                <span className={`font-mono font-bold ${isPastDue ? 'text-rose-400' : 'text-foreground'}`}>
                  {due.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })},{' '}
                  {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Description & Prompt */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Task Specifications
                </span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-secondary/20 p-4 rounded-xl border border-border">
                  {assignment.description}
                </p>
              </div>

              {/* File Rules */}
              <div className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Allowed File Types:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(assignment.allowedFileTypes || []).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[10px] font-bold text-foreground">
                        .{t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max File Size:</span>
                  <span className="font-mono text-foreground">{assignment.maxFileSize || 25} MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Attachments:</span>
                  <span className="font-mono text-foreground">{assignment.maxFiles || 5} Files</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Evaluation / Scorecard */}
          {(isReviewed || isReturned) && (
            <Card className="bg-card border-emerald-500/30 shadow-premium">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Award className="h-5 w-5" />
                    <CardTitle className="text-base text-foreground">Instructor Evaluation</CardTitle>
                  </div>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {submission?.marks} / {assignment.totalMarks} Marks
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-3">
                {submission?.feedback && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-foreground">Feedback & Notes:</span>
                    <p className="text-xs text-muted-foreground bg-secondary/40 p-3.5 rounded-xl border border-border leading-relaxed whitespace-pre-line">
                      {submission.feedback}
                    </p>
                  </div>
                )}

                {isReturned && (
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      The instructor requested revisions for this submission. Update your code/attachments and resubmit below.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Submission Form */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <Card className="bg-card border-border shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg">
                {isReturned ? 'Resubmit Revision' : isSubmitted ? 'My Submission' : 'Submit Solution'}
              </CardTitle>
              <CardDescription>
                Attach your solution archive, source code, demo links, and implementation notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* File Upload Dropzone */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    File Attachments ({files.length}/{assignment.maxFiles || 5})
                  </span>

                  <label className="border-2 border-dashed border-border hover:border-primary/60 bg-secondary/20 hover:bg-secondary/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center">
                    <UploadCloud className="h-8 w-8 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Click to upload files
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Allowed: {(assignment.allowedFileTypes || []).join(', ')} (Max {assignment.maxFileSize}MB)
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isReviewed}
                    />
                  </label>

                  {/* Uploaded Files List */}
                  {files.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-xl border border-border text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">
                              {file.originalName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({formatFileSize(file.fileSize)})
                            </span>
                          </div>

                          {!isReviewed && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-muted-foreground hover:text-rose-400 p-1 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* GitHub URL */}
                <Input
                  label="GitHub Repository Link"
                  placeholder="https://github.com/username/project-repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={isReviewed}
                />

                {/* Live Demo URL */}
                <Input
                  label="Live Deployed Demo URL (Optional)"
                  placeholder="https://my-project.vercel.app"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  disabled={isReviewed}
                />

                {/* Answer Notes */}
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Written Solution & Implementation Notes
                  </label>
                  <textarea
                    rows={4}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Describe your architectural decisions, features implemented, commands to run, or assumptions made..."
                    disabled={isReviewed}
                    className="w-full bg-input border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                  />
                </div>

                {/* Late Warning Notice */}
                {isPastDue && !submission && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>The deadline has passed. This submission will be marked as <strong>Late</strong>.</span>
                  </div>
                )}

                {/* Submit / Resubmit Button */}
                {!isReviewed && (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 shadow-premium font-bold"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting
                      ? 'Submitting Deliverable...'
                      : isReturned
                      ? 'Submit Revision'
                      : isSubmitted
                      ? 'Update Submission'
                      : 'Submit Assignment'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentSubmit;
