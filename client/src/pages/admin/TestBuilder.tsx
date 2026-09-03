import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Database,
  MoveUp,
  MoveDown,
  Layers,
  UserCheck,
  Shuffle,
  AlertTriangle,
  Eye,
  Award,
  CheckCircle2
} from 'lucide-react';
import type {
  ITest,
  IQuestion,
  ISection,
  QuestionType,
  QuestionDifficulty,
  TestStatus
} from '../../types/test';

export const TestBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isCreateMode = !id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Dropdown options
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  // Test General Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [duration, setDuration] = useState('30');
  const [passingMarks, setPassingMarks] = useState('10');
  const [totalMarks, setTotalMarks] = useState(0);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState('0.25');
  const [attemptsAllowed, setAttemptsAllowed] = useState('1');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [status, setStatus] = useState<TestStatus>('DRAFT');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sections, setSections] = useState<ISection[]>([
    { id: 'default', title: 'General Section', order: 0 }
  ]);
  const [questions, setQuestions] = useState<IQuestion[]>([]);

  // Submissions State for Tab 4
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedAttemptForGrading, setSelectedAttemptForGrading] = useState<any>(null);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingMarks, setGradingMarks] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Question Creation/Edit Inline Modal
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('MCQ');
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [qMarks, setQMarks] = useState('1');
  const [qNegativeMarks, setQNegativeMarks] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qSection, setQSection] = useState('General');
  const [qSaveToBank, setQSaveToBank] = useState(false);
  const [qOptions, setQOptions] = useState<Array<{ id: string; text: string }>>([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
    { id: 'opt_3', text: '' },
    { id: 'opt_4', text: '' }
  ]);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<any>('opt_1');

  // Import from Question Bank Modal
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<IQuestion[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [importSection, setImportSection] = useState('General');
  const [importing, setImporting] = useState(false);

  // Delete Question Confirmation Modal
  const [deleteQModalOpen, setDeleteQModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<IQuestion | null>(null);

  // Section Add Modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  const fetchDropdownData = async () => {
    try {
      const [coursesRes, batchesRes] = await Promise.all([
        api.get('/courses?limit=100'),
        api.get('/batches?limit=100')
      ]);
      setCourses(coursesRes.data.data.items || []);
      setBatches(batchesRes.data.data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTestDetails = async () => {
    if (isCreateMode) return;
    setLoading(true);
    try {
      const res = await api.get(`/tests/${id}`);
      const t: ITest = res.data.data.test;
      setTitle(t.title);
      setDescription(t.description || '');
      setInstructions(t.instructions || '');
      setCourse(t.course ? (typeof t.course === 'object' ? t.course._id : t.course) : '');
      setBatch(t.batch ? (typeof t.batch === 'object' ? t.batch._id : t.batch) : '');
      setDuration(String(t.duration));
      setPassingMarks(String(t.passingMarks));
      setTotalMarks(t.totalMarks || 0);
      setNegativeMarking(Boolean(t.negativeMarking));
      setNegativeMarkValue(String(t.negativeMarkValue || 0));
      setAttemptsAllowed(String(t.attemptsAllowed || 1));
      setRandomizeQuestions(Boolean(t.randomizeQuestions));
      setShowResults(t.showResults !== undefined ? t.showResults : true);
      setStatus(t.status || 'DRAFT');
      setStartTime(t.startTime ? new Date(t.startTime).toISOString().slice(0, 16) : '');
      setEndTime(t.endTime ? new Date(t.endTime).toISOString().slice(0, 16) : '');
      setSections(t.sections && t.sections.length > 0 ? t.sections : [{ id: 'default', title: 'General Section', order: 0 }]);
      setQuestions(t.questions || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch test details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (isCreateMode || !id) return;
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/tests/${id}/all-attempts`);
      setSubmissions(res.data.data.attempts || []);
    } catch (err: any) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    if (!isCreateMode) {
      fetchTestDetails();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'submissions' && !isCreateMode) {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Recalculate test total marks when questions change
  useEffect(() => {
    const marksSum = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    setTotalMarks(marksSum);
  }, [questions]);

  // Handle Save Test Settings
  const handleSaveTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showToast('Test title is required.', 'error');
      return;
    }
    if (!duration || Number(duration) <= 0) {
      showToast('Valid duration in minutes is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        instructions,
        course: course || null,
        batch: batch || null,
        duration: Number(duration),
        passingMarks: Number(passingMarks) || 0,
        negativeMarking,
        negativeMarkValue: Number(negativeMarkValue) || 0,
        attemptsAllowed: Number(attemptsAllowed) || 1,
        randomizeQuestions,
        showResults,
        status,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        sections
      };

      if (isCreateMode) {
        const res = await api.post('/tests', payload);
        const newTest = res.data.data.test;
        showToast('Test created successfully. You can now add questions.', 'success');
        navigate(`/admin/tests/${newTest._id}/edit`);
      } else {
        await api.put(`/tests/${id}`, payload);
        showToast('Test configurations updated successfully.', 'success');
        fetchTestDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save test.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Section Management
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSec: ISection = {
      id: `sec_${Date.now()}`,
      title: newSectionTitle.trim(),
      description: newSectionDesc.trim(),
      order: sections.length
    };
    setSections([...sections, newSec]);
    setNewSectionTitle('');
    setNewSectionDesc('');
    setSectionModalOpen(false);
    showToast(`Section "${newSec.title}" added. Save test to persist.`, 'success');
  };

  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      showToast('A test must contain at least one section.', 'error');
      return;
    }
    setSections(sections.filter((s) => s.id !== secId));
  };

  // Question Creation & Editing
  const openAddQuestionModal = (sectionTitle?: string) => {
    setEditingQuestion(null);
    setQText('');
    setQType('MCQ');
    setQDifficulty('MEDIUM');
    setQMarks('1');
    setQNegativeMarks(negativeMarking ? negativeMarkValue : '0');
    setQExplanation('');
    setQSection(sectionTitle || sections[0]?.title || 'General');
    setQSaveToBank(false);
    setQOptions([
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
      { id: 'opt_3', text: '' },
      { id: 'opt_4', text: '' }
    ]);
    setQCorrectAnswer('opt_1');
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: IQuestion) => {
    setEditingQuestion(q);
    setQText(q.questionText);
    setQType(q.type);
    setQDifficulty(q.difficulty);
    setQMarks(String(q.marks));
    setQNegativeMarks(String(q.negativeMarks));
    setQExplanation(q.explanation || '');
    setQSection(q.section || 'General');
    setQSaveToBank(false);
    setQOptions(q.options && q.options.length > 0 ? q.options : []);
    setQCorrectAnswer(q.correctAnswer);
    setQuestionModalOpen(true);
  };

  const handleSaveQuestionInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      showToast('Question text is required.', 'error');
      return;
    }

    if (['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT'].includes(qType)) {
      const hasEmpty = qOptions.some((opt) => !opt.text.trim());
      if (hasEmpty) {
        showToast('All option texts must be filled.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        questionText: qText,
        type: qType,
        difficulty: qDifficulty,
        marks: Number(qMarks) || 1,
        negativeMarks: Number(qNegativeMarks) || 0,
        explanation: qExplanation,
        section: qSection,
        options: qOptions,
        correctAnswer: qCorrectAnswer,
        saveToBank: qSaveToBank
      };

      if (editingQuestion) {
        await api.put(`/tests/questions/${editingQuestion._id}`, payload);
        showToast('Question updated.', 'success');
      } else {
        await api.post(`/tests/${id}/questions`, payload);
        showToast('Question added to test.', 'success');
      }

      setQuestionModalOpen(false);
      fetchTestDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save question.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete || !id) return;
    try {
      await api.delete(`/tests/${id}/questions/${questionToDelete._id}`);
      showToast('Question removed from test.', 'success');
      setDeleteQModalOpen(false);
      setQuestionToDelete(null);
      fetchTestDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to remove question.', 'error');
    }
  };

  // Move Question Up/Down
  const handleMoveQuestion = async (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;

    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);
    setQuestions(reordered);

    try {
      await api.put(`/tests/${id}/questions/reorder`, {
        orderedQuestionIds: reordered.map((q) => q._id)
      });
      showToast('Questions reordered.', 'success');
    } catch (err: any) {
      showToast('Failed to save reorder state.', 'error');
      fetchTestDetails();
    }
  };

  // Import from Bank
  const openBankPicker = async () => {
    setLoadingBank(true);
    setSelectedBankIds([]);
    setBankModalOpen(true);
    try {
      const res = await api.get('/tests/questions/bank?limit=50');
      setBankQuestions(res.data.data.items || []);
    } catch (err) {
      showToast('Failed to load bank questions.', 'error');
    } finally {
      setLoadingBank(false);
    }
  };

  const toggleBankQuestionSelect = (qId: string) => {
    if (selectedBankIds.includes(qId)) {
      setSelectedBankIds(selectedBankIds.filter((i) => i !== qId));
    } else {
      setSelectedBankIds([...selectedBankIds, qId]);
    }
  };

  const handleImportBankQuestions = async () => {
    if (selectedBankIds.length === 0) return;
    setImporting(true);
    try {
      await api.post('/tests/questions/bank/import-to-test', {
        testId: id,
        questionIds: selectedBankIds,
        section: importSection
      });
      showToast(`${selectedBankIds.length} questions imported from bank.`, 'success');
      setBankModalOpen(false);
      fetchTestDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to import questions.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Manual Grading Modal for Subjective Questions
  const openGradingModal = (attempt: any) => {
    setSelectedAttemptForGrading(attempt);
    const initialMarks: Record<string, number> = {};
    const initialFeedback: Record<string, string> = {};

    attempt.answers.forEach((ans: any) => {
      initialMarks[ans.question] = ans.marksAwarded || 0;
      initialFeedback[ans.question] = ans.feedback || '';
    });

    setGradingMarks(initialMarks);
    setGradingFeedbacks(initialFeedback);
    setGradingModalOpen(true);
  };

  const handleSaveGrade = async (questionId: string) => {
    if (!selectedAttemptForGrading) return;
    setSubmittingGrade(true);
    try {
      await api.post(`/tests/attempts/${selectedAttemptForGrading._id}/grade-subjective`, {
        questionId,
        marksAwarded: gradingMarks[questionId] || 0,
        feedback: gradingFeedbacks[questionId] || ''
      });
      showToast('Grade and feedback saved.', 'success');
      fetchSubmissions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit grade.', 'error');
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (loading) return <LoadingState message="Loading test studio..." />;
  if (error) return <ErrorState message={error} onRetry={fetchTestDetails} />;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/tests')} className="p-2 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-display text-foreground">
                {isCreateMode ? 'Create Examination Test' : title}
              </h1>
              {!isCreateMode && (
                <Badge variant={status === 'PUBLISHED' ? 'success' : status === 'DRAFT' ? 'warning' : 'secondary'}>
                  {status}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total Marks: <strong className="text-foreground">{totalMarks}</strong> | Duration: <strong className="text-foreground">{duration} mins</strong> | Passing: <strong className="text-foreground">{passingMarks} marks</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {!isCreateMode && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tests/${id}/analytics`)}>
              Analytics
            </Button>
          )}
          <Button onClick={() => handleSaveTest()} disabled={saving} className="shadow-premium">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : isCreateMode ? 'Create & Proceed' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex border-b border-border gap-2 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'details'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          1. Basic Details
        </button>
        <button
          type="button"
          disabled={isCreateMode}
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'questions'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-40'
          }`}
        >
          2. Sections & Questions ({questions.length})
        </button>
        <button
          type="button"
          disabled={isCreateMode}
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'rules'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-40'
          }`}
        >
          3. Rules & Anti-Cheat
        </button>
        <button
          type="button"
          disabled={isCreateMode}
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'submissions'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-40'
          }`}
        >
          4. Submissions & Grading ({submissions.length})
        </button>
      </div>

      {/* TAB 1: BASIC DETAILS */}
      {activeTab === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>Test Specifications & Overview</CardTitle>
            <CardDescription>Configure core metadata, duration, timing windows, and syllabus association.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTest} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                  Test Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Full-Stack Web Development Final Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Assigned Course (Optional)
                  </label>
                  <Select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    options={[
                      { label: 'None (Global Test)', value: '' },
                      ...courses.map((c) => ({ label: c.title, value: c._id }))
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Target Batch Cohort (Optional)
                  </label>
                  <Select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    options={[
                      { label: 'All Batches / Open Access', value: '' },
                      ...batches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Test Duration (Minutes) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Passing Threshold Marks *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Start Window (Optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    End Window (Optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                  Test Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of topics covered in this examination..."
                  className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                  Student Instructions / Examination Rules
                </label>
                <textarea
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. 1. Do not refresh or close the browser tab. 2. Negative marks apply for wrong answers. 3. Auto-submit occurs when time expires."
                  className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={saving}>
                  {isCreateMode ? 'Create Test & Build Questions' : 'Save Details'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: SECTIONS & QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="flex flex-col gap-6">
          {/* Top Bar: Section Controls and Question Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">
                Sections:
              </span>
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-lg border border-border text-xs text-foreground font-medium"
                >
                  <Layers className="h-3 w-3 text-primary" />
                  <span>{sec.title}</span>
                  {sections.length > 1 && (
                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="text-muted-foreground hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setSectionModalOpen(true)} className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Section
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={openBankPicker} className="flex-1 sm:flex-none">
                <Database className="h-4 w-4 mr-1 text-violet-400" />
                Import from Bank
              </Button>
              <Button size="sm" onClick={() => openAddQuestionModal()} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Question List */}
          {questions.length === 0 ? (
            <EmptyState
              title="No Questions Added Yet"
              description="Add questions directly or import pre-made items from the Question Bank."
              actionLabel="Add First Question"
              onAction={() => openAddQuestionModal()}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {questions.map((q, idx) => (
                <Card key={q._id} hoverable>
                  <CardContent className="p-4 flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <Badge
                          variant={
                            q.difficulty === 'EASY'
                              ? 'success'
                              : q.difficulty === 'MEDIUM'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {q.difficulty}
                        </Badge>
                        <Badge variant="secondary">{q.type.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Section: <strong>{q.section || 'General'}</strong>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Marks: <strong className="text-foreground">+{q.marks}</strong>
                          {negativeMarking && (
                            <> / Penalty: <strong className="text-rose-400">-{q.negativeMarks || negativeMarkValue}</strong></>
                          )}
                        </span>
                      </div>

                      {/* Controls: Reorder, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, 'UP')}
                          className="p-1 h-7 w-7 text-muted-foreground"
                          title="Move Up"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 'DOWN')}
                          className="p-1 h-7 w-7 text-muted-foreground"
                          title="Move Down"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditQuestionModal(q)}
                          className="p-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Question"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuestionToDelete(q);
                            setDeleteQModalOpen(true);
                          }}
                          className="p-1 h-7 w-7 text-rose-400 hover:text-rose-300"
                          title="Delete Question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <p className="text-sm font-medium text-foreground whitespace-pre-line">
                      {q.questionText}
                    </p>

                    {/* Options Breakdown */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {q.options.map((opt) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(opt.id)
                            : String(q.correctAnswer) === String(opt.id);

                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                                  : 'bg-secondary/40 border-border text-muted-foreground'
                              }`}
                            >
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span className="text-[10px] uppercase font-bold text-emerald-400">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-xs text-muted-foreground italic pt-1 border-t border-border">
                        <strong className="not-italic text-foreground">Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RULES & SETTINGS */}
      {activeTab === 'rules' && (
        <Card>
          <CardHeader>
            <CardTitle>Examination Rules & Anti-Cheat Controls</CardTitle>
            <CardDescription>Configure randomization, attempt limits, penalty parameters, and result visibility.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Randomization */}
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg mt-0.5">
                    <Shuffle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Randomize Question Order</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Each student receives a uniquely randomized question sequence securely isolated on attempt creation.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer mt-1"
                />
              </div>

              {/* Negative Marking */}
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Negative Marking Penalty</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Deduct marks for incorrect answers on objective multiple-choice questions.
                    </p>
                    {negativeMarking && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Default Penalty:</span>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={negativeMarkValue}
                          onChange={(e) => setNegativeMarkValue(e.target.value)}
                          className="w-24 h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer mt-1"
                />
              </div>

              {/* Show Results Immediately */}
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg mt-0.5">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Instant Score & Solutions</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      If enabled, students immediately review their scorecard, correct answers, and explanations upon submission.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showResults}
                  onChange={(e) => setShowResults(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer mt-1"
                />
              </div>

              {/* Attempts Limit */}
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg mt-0.5">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-foreground">Allowed Attempts Limit</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Maximum test submissions allowed per student (set 0 for unlimited retakes).
                    </p>
                    <div className="mt-2 w-32">
                      <Input
                        type="number"
                        min="0"
                        value={attemptsAllowed}
                        onChange={(e) => setAttemptsAllowed(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Status Switcher */}
            <div className="p-4 rounded-xl border border-border bg-secondary/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Publication Status</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Published tests are visible to eligible enrolled students.
                </p>
              </div>
              <div className="w-44">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TestStatus)}
                  options={[
                    { label: 'Draft Mode', value: 'DRAFT' },
                    { label: 'Published & Live', value: 'PUBLISHED' },
                    { label: 'Archived', value: 'ARCHIVED' }
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={() => handleSaveTest()} disabled={saving}>
                Save Rules & Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: SUBMISSIONS & MANUAL GRADING */}
      {activeTab === 'submissions' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Student Examination Submissions</CardTitle>
              <CardDescription>Review student attempts, evaluate subjective written responses, and award scores.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubmissions}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loadingSubmissions ? (
              <LoadingState message="Fetching student submissions..." />
            ) : submissions.length === 0 ? (
              <EmptyState
                title="No Submissions Yet"
                description="When students complete this examination, their attempts and scores will appear here."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {submissions.map((att) => (
                  <div
                    key={att._id}
                    className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
                        {att.student?.name?.slice(0, 2) || 'ST'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{att.student?.name}</span>
                        <span className="text-xs text-muted-foreground">{att.student?.email}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          Submitted: {new Date(att.submittedAt || att.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Score</span>
                        <span className="text-base font-bold text-foreground">
                          {att.score} / {att.maxScore}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Percentage</span>
                        <span className="text-base font-bold text-primary">{att.percentage}%</span>
                      </div>
                      <Badge variant={att.isPassed ? 'success' : 'destructive'}>
                        {att.isPassed ? 'PASSED' : 'FAILED'}
                      </Badge>
                      <Badge variant="secondary">{att.status}</Badge>

                      <Button size="sm" variant="outline" onClick={() => openGradingModal(att)}>
                        <UserCheck className="h-4 w-4 mr-1 text-primary" />
                        Grade / Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inline Question Add/Edit Modal */}
      <Modal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question to Test'}
        description="Write the question prompt, choose format, and configure key answer options."
      >
        <form onSubmit={handleSaveQuestionInline} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Question Text *
            </label>
            <textarea
              rows={3}
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="e.g. What is the difference between synchronous and asynchronous code?"
              className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Type *
              </label>
              <Select
                value={qType}
                onChange={(e) => {
                  const nt = e.target.value as QuestionType;
                  setQType(nt);
                  if (nt === 'TRUE_FALSE') {
                    setQOptions([
                      { id: 'true', text: 'True' },
                      { id: 'false', text: 'False' }
                    ]);
                    setQCorrectAnswer('true');
                  } else if (nt === 'MULTIPLE_CORRECT') {
                    setQCorrectAnswer(['opt_1']);
                  } else if (nt === 'MCQ') {
                    setQCorrectAnswer('opt_1');
                  }
                }}
                options={[
                  { label: 'Single Choice (MCQ)', value: 'MCQ' },
                  { label: 'True / False', value: 'TRUE_FALSE' },
                  { label: 'Multiple Correct', value: 'MULTIPLE_CORRECT' },
                  { label: 'Subjective', value: 'SUBJECTIVE' }
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Difficulty
              </label>
              <Select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(e.target.value as QuestionDifficulty)}
                options={[
                  { label: 'Easy', value: 'EASY' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'Hard', value: 'HARD' }
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Assign Section
              </label>
              <Select
                value={qSection}
                onChange={(e) => setQSection(e.target.value)}
                options={sections.map((s) => ({ label: s.title, value: s.title }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Marks Awarded *
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                required
                value={qMarks}
                onChange={(e) => setQMarks(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Negative Deduction
              </label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={qNegativeMarks}
                onChange={(e) => setQNegativeMarks(e.target.value)}
              />
            </div>
          </div>

          {/* Options for MCQ / Multi Correct */}
          {['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT'].includes(qType) && (
            <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-border bg-secondary/30">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Options & Correct Answer
              </span>
              {qOptions.map((opt, idx) => {
                const isChecked = Array.isArray(qCorrectAnswer)
                  ? qCorrectAnswer.includes(opt.id)
                  : String(qCorrectAnswer) === String(opt.id);

                return (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (qType === 'MULTIPLE_CORRECT') {
                          const curr = Array.isArray(qCorrectAnswer) ? [...qCorrectAnswer] : [];
                          if (curr.includes(opt.id)) {
                            setQCorrectAnswer(curr.filter((i) => i !== opt.id));
                          } else {
                            setQCorrectAnswer([...curr, opt.id]);
                          }
                        } else {
                          setQCorrectAnswer(opt.id);
                        }
                      }}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-input border-border text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <Input
                      placeholder={`Option ${idx + 1}...`}
                      value={opt.text}
                      disabled={qType === 'TRUE_FALSE'}
                      onChange={(e) => {
                        const updated = [...qOptions];
                        updated[idx].text = e.target.value;
                        setQOptions(updated);
                      }}
                      className="flex-1"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Solution Explanation (Shown on Result Review)
            </label>
            <textarea
              rows={2}
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Why this is the correct answer..."
              className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {!editingQuestion && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveToBank"
                checked={qSaveToBank}
                onChange={(e) => setQSaveToBank(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <label htmlFor="saveToBank" className="text-xs text-muted-foreground cursor-pointer">
                Also save a copy to the Centralized Question Bank for reuse
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {editingQuestion ? 'Update Question' : 'Add to Test'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import from Bank Modal */}
      <Modal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title="Import Questions from Question Bank"
        description="Select questions to add directly to this test."
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {selectedBankIds.length} questions selected
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Add to Section:</span>
              <div className="w-36">
                <Select
                  value={importSection}
                  onChange={(e) => setImportSection(e.target.value)}
                  options={sections.map((s) => ({ label: s.title, value: s.title }))}
                />
              </div>
            </div>
          </div>

          {loadingBank ? (
            <LoadingState message="Loading question bank..." />
          ) : bankQuestions.length === 0 ? (
            <EmptyState title="No Bank Questions" description="Create questions in the Question Bank first." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {bankQuestions.map((bq) => {
                const isSelected = selectedBankIds.includes(bq._id);
                return (
                  <div
                    key={bq._id}
                    onClick={() => toggleBankQuestionSelect(bq._id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 accent-primary rounded mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">{bq.type}</Badge>
                        <Badge
                          variant={
                            bq.difficulty === 'EASY'
                              ? 'success'
                              : bq.difficulty === 'MEDIUM'
                              ? 'warning'
                              : 'destructive'
                          }
                          className="text-[10px]"
                        >
                          {bq.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">+{bq.marks} marks</span>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2">{bq.questionText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setBankModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImportBankQuestions}
              disabled={selectedBankIds.length === 0 || importing}
            >
              {importing ? 'Importing...' : `Import ${selectedBankIds.length} Questions`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manual Grading Modal */}
      <Modal
        isOpen={gradingModalOpen}
        onClose={() => setGradingModalOpen(false)}
        title="Evaluate & Grade Student Attempt"
        description={`Student: ${selectedAttemptForGrading?.student?.name} (${selectedAttemptForGrading?.student?.email})`}
      >
        {selectedAttemptForGrading && (
          <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-secondary/40 rounded-xl border border-border flex justify-between items-center text-xs">
              <span>Status: <strong>{selectedAttemptForGrading.status}</strong></span>
              <span>Total Score: <strong>{selectedAttemptForGrading.score} / {selectedAttemptForGrading.maxScore}</strong></span>
              <span>Percentage: <strong>{selectedAttemptForGrading.percentage}%</strong></span>
            </div>

            <div className="flex flex-col gap-4">
              {selectedAttemptForGrading.questionsSnapshot?.map((snap: any, idx: number) => {
                const ans = selectedAttemptForGrading.answers?.find(
                  (a: any) => a.question.toString() === snap.questionId.toString()
                );

                return (
                  <div key={snap.questionId} className="p-4 rounded-xl border border-border bg-card flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Q{idx + 1} ({snap.type})</span>
                      <span className="text-xs text-muted-foreground">Max Marks: {snap.marks}</span>
                    </div>

                    <p className="text-xs font-medium text-foreground">{snap.questionText}</p>

                    {/* Student Response */}
                    <div className="p-2.5 rounded-lg bg-secondary/60 border border-border text-xs">
                      <span className="font-semibold text-muted-foreground block mb-1">Student Answer:</span>
                      {snap.type === 'SUBJECTIVE' ? (
                        <p className="whitespace-pre-line text-foreground">{ans?.subjectiveAnswer || 'No answer submitted.'}</p>
                      ) : (
                        <p className="text-foreground">Option selected: {JSON.stringify(ans?.selectedOption) || 'Unanswered'}</p>
                      )}
                    </div>

                    {/* Grading Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Awarded Marks:</span>
                        <Input
                          type="number"
                          step="0.5"
                          max={snap.marks}
                          min="0"
                          value={gradingMarks[snap.questionId] ?? (ans?.marksAwarded || 0)}
                          onChange={(e) =>
                            setGradingMarks({
                              ...gradingMarks,
                              [snap.questionId]: Number(e.target.value)
                            })
                          }
                          className="w-20 h-8 text-xs"
                        />
                      </div>

                      <Input
                        placeholder="Instructor feedback for student..."
                        value={gradingFeedbacks[snap.questionId] ?? (ans?.feedback || '')}
                        onChange={(e) =>
                          setGradingFeedbacks({
                            ...gradingFeedbacks,
                            [snap.questionId]: e.target.value
                          })
                        }
                        className="flex-1 h-8 text-xs"
                      />

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={submittingGrade}
                        onClick={() => handleSaveGrade(snap.questionId)}
                        className="h-8 text-xs"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Section Modal */}
      <Modal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title="Add Curriculum Section"
        description="Organize test questions into logical sections (e.g. Quantitative, Technical, Verbal)."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Section Title *
            </label>
            <Input
              placeholder="e.g. Part A: Technical Fundamentals"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Section Description (Optional)
            </label>
            <Input
              placeholder="Brief description of this section's topics"
              value={newSectionDesc}
              onChange={(e) => setNewSectionDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection}>Add Section</Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Delete Question */}
      <ConfirmationDialog
        isOpen={deleteQModalOpen}
        title="Remove Question"
        message="Are you sure you want to remove this question from the test?"
        confirmLabel="Remove Question"
        onConfirm={confirmDeleteQuestion}
        onClose={() => {
          setDeleteQModalOpen(false);
          setQuestionToDelete(null);
        }}
      />
    </div>
  );
};

export default TestBuilder;
