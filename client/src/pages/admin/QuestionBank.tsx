import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import {
  Database,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  Tag
} from 'lucide-react';
import type { IQuestion, QuestionType, QuestionDifficulty } from '../../types/test';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [courses, setCourses] = useState<any[]>([]);
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State for Create / Edit Question
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [questionText, setQuestionText] = useState('');
  const [type, setType] = useState<QuestionType>('MCQ');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [marks, setMarks] = useState('1');
  const [negativeMarks, setNegativeMarks] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
    { id: 'opt_3', text: '' },
    { id: 'opt_4', text: '' }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<any>('opt_1');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<IQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses?limit=100');
      setCourses(res.data.data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBankQuestions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 15
      };
      if (search) params.search = search;
      if (difficultyFilter !== 'ALL') params.difficulty = difficultyFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (courseFilter !== 'ALL') params.course = courseFilter;

      const res = await api.get('/tests/questions/bank', { params });
      setQuestions(res.data.data.items || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
      setTotalCount(res.data.data.pagination?.total || 0);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch question bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchBankQuestions();
  }, [page, difficultyFilter, typeFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBankQuestions();
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setType('MCQ');
    setDifficulty('MEDIUM');
    setMarks('1');
    setNegativeMarks('0');
    setExplanation('');
    setTagsInput('');
    setSelectedCourse('');
    setOptions([
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
      { id: 'opt_3', text: '' },
      { id: 'opt_4', text: '' }
    ]);
    setCorrectAnswer('opt_1');
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (q: IQuestion) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText);
    setType(q.type);
    setDifficulty(q.difficulty);
    setMarks(String(q.marks));
    setNegativeMarks(String(q.negativeMarks));
    setExplanation(q.explanation || '');
    setTagsInput(q.tags?.join(', ') || '');
    setSelectedCourse(
      typeof q.course === 'object' && q.course ? q.course._id : (q.course as string) || ''
    );
    setOptions(q.options && q.options.length > 0 ? q.options : []);
    setCorrectAnswer(q.correctAnswer);
    setModalOpen(true);
  };

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === 'TRUE_FALSE') {
      setOptions([
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' }
      ]);
      setCorrectAnswer('true');
    } else if (newType === 'MULTIPLE_CORRECT') {
      if (options.length < 2) {
        setOptions([
          { id: 'opt_1', text: '' },
          { id: 'opt_2', text: '' },
          { id: 'opt_3', text: '' },
          { id: 'opt_4', text: '' }
        ]);
      }
      setCorrectAnswer(['opt_1']);
    } else if (newType === 'MCQ') {
      if (options.length < 2) {
        setOptions([
          { id: 'opt_1', text: '' },
          { id: 'opt_2', text: '' },
          { id: 'opt_3', text: '' },
          { id: 'opt_4', text: '' }
        ]);
      }
      setCorrectAnswer('opt_1');
    } else if (newType === 'SUBJECTIVE') {
      setOptions([]);
      setCorrectAnswer('Subjective rubric / model keywords');
    }
  };

  const handleOptionTextChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].text = text;
    setOptions(updated);
  };

  const addOption = () => {
    const newId = `opt_${Date.now()}`;
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      showToast('At least 2 options are required.', 'error');
      return;
    }
    const removedId = options[idx].id;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);

    if (type === 'MULTIPLE_CORRECT' && Array.isArray(correctAnswer)) {
      setCorrectAnswer(correctAnswer.filter((id) => id !== removedId));
    } else if (correctAnswer === removedId) {
      setCorrectAnswer(updated[0]?.id || '');
    }
  };

  const toggleMultiCorrect = (optId: string) => {
    const current = Array.isArray(correctAnswer) ? [...correctAnswer] : [];
    if (current.includes(optId)) {
      if (current.length === 1) {
        showToast('At least one correct answer is required.', 'error');
        return;
      }
      setCorrectAnswer(current.filter((id) => id !== optId));
    } else {
      setCorrectAnswer([...current, optId]);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      showToast('Question text is required.', 'error');
      return;
    }

    if (['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT'].includes(type)) {
      const hasEmptyOption = options.some((opt) => !opt.text.trim());
      if (hasEmptyOption) {
        showToast('Please fill out all option descriptions.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        questionText,
        type,
        options,
        correctAnswer,
        marks: Number(marks) || 1,
        negativeMarks: Number(negativeMarks) || 0,
        explanation,
        difficulty,
        tags,
        course: selectedCourse || null
      };

      if (editingQuestion) {
        await api.put(`/tests/questions/bank/${editingQuestion._id}`, payload);
        showToast('Question updated in bank.', 'success');
      } else {
        await api.post('/tests/questions/bank', payload);
        showToast('Question added to bank.', 'success');
      }

      setModalOpen(false);
      resetForm();
      fetchBankQuestions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save question.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (q: IQuestion) => {
    setQuestionToDelete(q);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/tests/questions/bank/${questionToDelete._id}`);
      showToast('Question removed from question bank.', 'success');
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
      fetchBankQuestions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete question.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-violet-400" />
            Centralized Question Bank
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store, tag, organize, and reuse questions across multiple exams and batch tests.
          </p>
        </div>
        <Button onClick={openCreateModal} className="shadow-premium">
          <Plus className="h-4 w-4 mr-2" />
          Add Question to Bank
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by keywords or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </form>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <div className="w-36">
              <Select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: 'All Difficulties', value: 'ALL' },
                  { label: 'Easy', value: 'EASY' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'Hard', value: 'HARD' }
                ]}
              />
            </div>

            <div className="w-40">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: 'All Types', value: 'ALL' },
                  { label: 'MCQ (Single Choice)', value: 'MCQ' },
                  { label: 'True / False', value: 'TRUE_FALSE' },
                  { label: 'Multiple Correct', value: 'MULTIPLE_CORRECT' },
                  { label: 'Subjective', value: 'SUBJECTIVE' }
                ]}
              />
            </div>

            <div className="w-44">
              <Select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: 'All Courses', value: 'ALL' },
                  ...courses.map((c) => ({ label: c.title, value: c._id }))
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question List */}
      {loading ? (
        <LoadingState message="Fetching question bank entries..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBankQuestions} />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No Questions in Bank"
          description={search ? 'No questions match the applied filters.' : 'Add your first question to reuse across tests.'}
          actionLabel="Add Question"
          onAction={openCreateModal}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q, idx) => (
              <Card key={q._id} hoverable>
                <CardContent className="p-5 flex flex-col gap-3">
                  {/* Top Bar: Difficulty, Type, Marks, Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-muted-foreground">#{(page - 1) * 15 + idx + 1}</span>
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
                        Marks: <strong className="text-foreground">+{q.marks}</strong> / Negative: <strong className="text-rose-400">-{q.negativeMarks}</strong>
                      </span>
                      {q.course && (
                        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          {typeof q.course === 'object' ? q.course.title : 'Course linked'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(q)}
                        className="p-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(q)}
                        className="p-1.5 h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Options List for Objective */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {q.options.map((opt) => {
                        const isCorrect = Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.includes(opt.id)
                          : String(q.correctAnswer) === String(opt.id);

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                                : 'bg-secondary/40 border-border text-muted-foreground'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 font-mono text-[10px]">
                              {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : '•'}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <span className="text-[10px] uppercase font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/20 rounded">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation & Tags Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-border mt-1">
                    {q.explanation ? (
                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        <strong className="not-italic text-foreground">Explanation:</strong> {q.explanation}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">No explanation provided.</span>
                    )}

                    {q.tags && q.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {q.tags.map((t, tidx) => (
                          <span
                            key={tidx}
                            className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-2 py-3">
              <span className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} ({totalCount} total questions)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? 'Edit Bank Question' : 'Create Question for Bank'}
        description="Configure question text, answer options, marks, difficulty, and rubric."
      >
        <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Question Text *
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Which of the following is an asynchronous feature in JavaScript?"
              className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Question Type *
              </label>
              <Select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                options={[
                  { label: 'Single Choice (MCQ)', value: 'MCQ' },
                  { label: 'True / False', value: 'TRUE_FALSE' },
                  { label: 'Multiple Correct (Multi-select)', value: 'MULTIPLE_CORRECT' },
                  { label: 'Subjective (Essay/Text)', value: 'SUBJECTIVE' }
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Difficulty Level *
              </label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                options={[
                  { label: 'Easy', value: 'EASY' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'Hard', value: 'HARD' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Marks Awarded *
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                required
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Negative Penalty
              </label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Course Category
              </label>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                options={[
                  { label: 'None / General', value: '' },
                  ...courses.map((c) => ({ label: c.title, value: c._id }))
                ]}
              />
            </div>
          </div>

          {/* Options Section for Objective */}
          {['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT'].includes(type) && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-secondary/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Answer Options & Correct Key *
                </span>
                {type !== 'TRUE_FALSE' && (
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {type === 'MULTIPLE_CORRECT'
                  ? 'Check the boxes for all correct answer choices.'
                  : 'Select the radio circle for the single correct answer option.'}
              </p>

              <div className="flex flex-col gap-2.5">
                {options.map((opt, idx) => {
                  const isChecked = Array.isArray(correctAnswer)
                    ? correctAnswer.includes(opt.id)
                    : String(correctAnswer) === String(opt.id);

                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (type === 'MULTIPLE_CORRECT') {
                            toggleMultiCorrect(opt.id);
                          } else {
                            setCorrectAnswer(opt.id);
                          }
                        }}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-input border-border text-transparent hover:border-primary'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>

                      <Input
                        placeholder={`Option ${idx + 1} text...`}
                        value={opt.text}
                        disabled={type === 'TRUE_FALSE'}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        className="flex-1"
                      />

                      {type !== 'TRUE_FALSE' && options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="p-2 text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subjective Model Answer / Rubric */}
          {type === 'SUBJECTIVE' && (
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Model Answer / Grading Rubric
              </label>
              <textarea
                rows={3}
                value={typeof correctAnswer === 'string' ? correctAnswer : ''}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Key concepts, keywords, or sample solution expected for full marks..."
                className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Solution Explanation */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Solution Explanation
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Why this answer is correct (shown to students during result review)..."
              className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Search Tags (comma-separated)
            </label>
            <Input
              placeholder="e.g. javascript, promises, async, frontend"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save to Bank'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Remove Question from Bank"
        message="Are you sure you want to remove this question from the Question Bank? Any tests currently using this question will retain their local copy."
        confirmLabel={deleting ? 'Removing...' : 'Remove Question'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setQuestionToDelete(null);
        }}
      />
    </div>
  );
};

export default QuestionBank;
