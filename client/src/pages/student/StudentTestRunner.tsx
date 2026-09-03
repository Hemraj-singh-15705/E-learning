import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState } from '../../components/ui/States';
import {
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Check,
  Flag
} from 'lucide-react';
import type { IQuestionSnapshot, IAttemptAnswer } from '../../types/test';

export const StudentTestRunner: React.FC = () => {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testMeta, setTestMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<IQuestionSnapshot[]>([]);
  const [answers, setAnswers] = useState<IAttemptAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [deadline, setDeadline] = useState<Date | null>(null);

  // Auto-Save sync state
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [isSaving, setIsSaving] = useState(false);

  // Submit Modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ref to track latest answers for auto-submit
  const answersRef = useRef<IAttemptAnswer[]>([]);
  answersRef.current = answers;

  // Initialize and load attempt data
  const initializeAttempt = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/tests/${id}/start`);
      const data = res.data.data;
      setTestMeta(data.test);
      setQuestions(data.questions || []);

      // Initialize answers from attempt
      if (data.answers && data.answers.length > 0) {
        setAnswers(data.answers);
      } else {
        const initialAnswers = (data.questions || []).map((q: IQuestionSnapshot) => ({
          question: q.questionId,
          selectedOption: null,
          subjectiveAnswer: '',
          isMarkedForReview: false
        }));
        setAnswers(initialAnswers);
      }

      const dl = new Date(data.deadline);
      setDeadline(dl);
      const remaining = Math.max(0, Math.floor((dl.getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize examination session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAttempt();
  }, [id, attemptId]);

  // Periodic Timer Countdown
  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  // Auto-Save Debounced Effect
  const saveDraft = useCallback(async () => {
    if (!attemptId || answersRef.current.length === 0) return;
    setIsSaving(true);
    try {
      await api.patch(`/tests/attempts/${attemptId}/save-answers`, {
        answers: answersRef.current
      });
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Auto-save network error', e);
    } finally {
      setIsSaving(false);
    }
  }, [attemptId]);

  // Auto-save every 20 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 20000);
    return () => clearInterval(autoSaveInterval);
  }, [saveDraft]);

  // Handle User Input Actions
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(
    (a) => a.question.toString() === currentQuestion?.questionId?.toString()
  );

  const handleSelectOption = (optId: string) => {
    if (!currentQuestion) return;
    const qType = currentQuestion.type;

    setAnswers((prev) =>
      prev.map((ans) => {
        if (ans.question.toString() !== currentQuestion.questionId.toString()) return ans;

        if (qType === 'MULTIPLE_CORRECT') {
          const selected = Array.isArray(ans.selectedOption) ? [...ans.selectedOption] : [];
          if (selected.includes(optId)) {
            return { ...ans, selectedOption: selected.filter((id) => id !== optId) };
          } else {
            return { ...ans, selectedOption: [...selected, optId] };
          }
        } else {
          // Single select MCQ / True False
          return { ...ans, selectedOption: optId };
        }
      })
    );
  };

  const handleSubjectiveChange = (text: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.question.toString() === currentQuestion.questionId.toString()
          ? { ...ans, subjectiveAnswer: text }
          : ans
      )
    );
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.question.toString() === currentQuestion.questionId.toString()
          ? { ...ans, isMarkedForReview: !ans.isMarkedForReview }
          : ans
      )
    );
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.question.toString() === currentQuestion.questionId.toString()
          ? { ...ans, selectedOption: null, subjectiveAnswer: '' }
          : ans
      )
    );
  };

  // Submit Test
  const handleSubmitFinal = async () => {
    setSubmitting(true);
    try {
      await saveDraft();
      await api.post(`/tests/attempts/${attemptId}/submit`, {
        answers: answersRef.current
      });
      showToast('Examination submitted successfully!', 'success');
      navigate(`/student/tests/${id}/result/${attemptId}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit test.', 'error');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    showToast('Time has expired. Submitting your examination now...', 'warning');
    try {
      await api.post(`/tests/attempts/${attemptId}/submit`, {
        answers: answersRef.current
      });
      navigate(`/student/tests/${id}/result/${attemptId}`);
    } catch (e) {
      navigate(`/student/tests/${id}/result/${attemptId}`);
    }
  };

  if (loading) return <LoadingState message="Loading examination environment..." />;
  if (error || !currentQuestion) return <ErrorState message={error} onRetry={initializeAttempt} />;

  // Filter questions for section navigation
  const uniqueSections = Array.from(new Set(questions.map((q) => q.section || 'General')));

  // Statistics for Question Palette
  const totalCount = questions.length;
  const answeredCount = answers.filter((a) => {
    const isSubjective = Boolean(a.subjectiveAnswer && a.subjectiveAnswer.trim() !== '');
    const isObjective = a.selectedOption !== null && a.selectedOption !== undefined && (Array.isArray(a.selectedOption) ? a.selectedOption.length > 0 : a.selectedOption !== '');
    return isSubjective || isObjective;
  }).length;

  const markedCount = answers.filter((a) => a.isMarkedForReview).length;
  const unansweredCount = totalCount - answeredCount;

  // Format timer
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeCritical = secondsRemaining < 180; // less than 3 minutes
  const isTimeWarning = secondsRemaining < 300 && !isTimeCritical; // less than 5 minutes

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col -m-6 animate-enter select-none">
      {/* Top Sticky Examination Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Test Title & Section Selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold font-display text-foreground line-clamp-1">{testMeta?.title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="h-3 w-3" /> {isSaving ? 'Syncing...' : `Auto-saved: ${lastSaved}`}
              </span>
              {testMeta?.negativeMarking && (
                <span className="text-rose-400 text-[10px] font-semibold">
                  (-{testMeta.negativeMarkValue || 'penalties'} on wrong answers)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg transition-all ${
            isTimeCritical
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 animate-pulse shadow-lg shadow-rose-950/50'
              : isTimeWarning
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : 'bg-secondary border-border text-foreground'
          }`}
        >
          <Clock className={`h-5 w-5 ${isTimeCritical ? 'text-rose-400' : 'text-primary'}`} />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Right: Submit Button */}
        <Button
          onClick={() => setSubmitModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-premium"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Examination
        </Button>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left / Center: Question Canvas */}
        <main className="flex-1 flex flex-col justify-between p-6 lg:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-6">
            {/* Question Top Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary" className="text-xs px-2.5 py-1">
                  Question {currentIndex + 1} of {totalCount}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Section: <strong>{currentQuestion.section || 'General'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  Marks: <strong className="text-emerald-400">+{currentQuestion.marks}</strong>
                  {testMeta?.negativeMarking && (
                    <> / Penalty: <strong className="text-rose-400">-{currentQuestion.negativeMarks || testMeta.negativeMarkValue}</strong></>
                  )}
                </span>
                <button
                  onClick={toggleMarkForReview}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentAnswer?.isMarkedForReview
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                      : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base sm:text-lg font-medium text-foreground leading-relaxed whitespace-pre-line">
                {currentQuestion.questionText}
              </h3>
            </div>

            {/* Answer Selection Input Formats */}
            <div className="flex flex-col gap-3 pt-2">
              {/* Single Choice (MCQ & TRUE_FALSE) */}
              {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'TRUE_FALSE') && (
                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = String(currentAnswer?.selectedOption) === String(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'bg-primary/15 border-primary text-foreground shadow-sm ring-1 ring-primary/40'
                            : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="text-sm font-medium flex-1">{opt.text}</span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Multiple Correct Options */}
              {currentQuestion.type === 'MULTIPLE_CORRECT' && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                    Select all that apply:
                  </span>
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected =
                      Array.isArray(currentAnswer?.selectedOption) &&
                      currentAnswer.selectedOption.includes(opt.id);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'bg-primary/15 border-primary text-foreground shadow-sm ring-1 ring-primary/40'
                            : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 font-bold text-xs ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          {isSelected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="text-sm font-medium flex-1">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subjective Free-Text Response */}
              {currentQuestion.type === 'SUBJECTIVE' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Type your detailed answer below:
                  </span>
                  <textarea
                    rows={8}
                    value={currentAnswer?.subjectiveAnswer || ''}
                    onChange={(e) => handleSubjectiveChange(e.target.value)}
                    placeholder="Enter your written response here..."
                    className="w-full bg-input border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Draft is automatically saved to cloud.</span>
                    <span>{(currentAnswer?.subjectiveAnswer || '').length} characters</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-border mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearResponse}
              className="text-xs text-muted-foreground hover:text-rose-400"
            >
              Clear Choice
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {currentIndex < totalCount - 1 ? (
                <Button onClick={() => setCurrentIndex((i) => i + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => setSubmitModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Review & Submit
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Question Palette & Section Tabs */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
          {/* Section Selector */}
          {uniqueSections.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Filter by Section
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedSection('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    selectedSection === 'ALL'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  All ({totalCount})
                </button>
                {uniqueSections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      selectedSection === sec
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Palette Status Legend */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/40 rounded-xl border border-border text-center text-xs">
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-emerald-400">{answeredCount}</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Answered</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-violet-400">{markedCount}</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Marked</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-muted-foreground">{unansweredCount}</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Unvisited</span>
            </div>
          </div>

          {/* Numbered Palette Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Question Navigator
            </span>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = answers.find(
                  (a) => a.question.toString() === q.questionId.toString()
                );
                const isAnswered =
                  (ans?.selectedOption !== null && ans?.selectedOption !== undefined && (Array.isArray(ans.selectedOption) ? ans.selectedOption.length > 0 : ans.selectedOption !== '')) ||
                  Boolean(ans?.subjectiveAnswer && ans.subjectiveAnswer.trim() !== '');
                const isMarked = Boolean(ans?.isMarkedForReview);
                const isCurrent = idx === currentIndex;

                if (selectedSection !== 'ALL' && (q.section || 'General') !== selectedSection) {
                  return null;
                }

                let colorClasses = 'bg-secondary border-border text-muted-foreground hover:border-primary/50';
                if (isMarked) {
                  colorClasses = 'bg-violet-950/60 border-violet-500 text-violet-300 font-bold';
                } else if (isAnswered) {
                  colorClasses = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold';
                }

                if (isCurrent) {
                  colorClasses += ' ring-2 ring-primary ring-offset-2 ring-offset-card';
                }

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border flex items-center justify-center text-xs font-mono font-bold transition-all relative ${colorClasses}`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Dialog */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit Examination"
        description="Are you sure you want to conclude your examination session?"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/40 rounded-xl border border-border text-center">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-emerald-400">{answeredCount}</span>
              <span className="text-xs text-muted-foreground">Answered</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-violet-400">{markedCount}</span>
              <span className="text-xs text-muted-foreground">Review Flagged</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-amber-400">{unansweredCount}</span>
              <span className="text-xs text-muted-foreground">Unanswered</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>You have {unansweredCount} unanswered questions remaining.</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Once submitted, your answers will be evaluated server-side against the official answer keys. You cannot modify your responses after this step.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>
              Continue Exam
            </Button>
            <Button
              disabled={submitting}
              onClick={handleSubmitFinal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {submitting ? 'Submitting & Scoring...' : 'Confirm Final Submission'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentTestRunner;
