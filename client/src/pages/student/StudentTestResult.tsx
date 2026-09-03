import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import type { ITestAttempt } from '../../types/test';

export const StudentTestResult: React.FC = () => {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [attempt, setAttempt] = useState<ITestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  const fetchAttemptResult = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tests/attempts/${attemptId}/result`);
      const att = res.data.data.attempt;
      setAttempt(att);

      // Default expand all questions in review
      if (att.questionsReview) {
        const expanded: Record<string, boolean> = {};
        att.questionsReview.forEach((q: any) => {
          expanded[q.questionId] = true;
        });
        setExpandedQuestions(expanded);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch examination results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptResult();
  }, [attemptId]);

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  if (loading) return <LoadingState message="Compiling your score card and solutions..." />;
  if (error || !attempt) return <ErrorState message={error} onRetry={fetchAttemptResult} />;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}m ${remainingSec}s`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-enter pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/tests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessment Hub
        </Button>
        <Button onClick={() => navigate(`/student/tests/${id}/start`)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake or Review Rules
        </Button>
      </div>

      {/* Scorecard Hero Banner */}
      <div className="gradient-bg p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-[10%] right-[5%] w-64 h-64 rounded-full bg-violet-600/25 blur-3xl" />
        
        <div className="flex flex-col gap-2 z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-violet-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Scorecard Report</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {attempt.test?.title}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Completed on {new Date(attempt.submittedAt || attempt.startedAt).toLocaleString()}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
            <Badge
              variant={attempt.isPassed ? 'success' : 'destructive'}
              className="text-sm px-3 py-1 font-bold shadow-sm"
            >
              {attempt.isPassed ? 'PASSED CRITERIA' : 'FAILED THRESHOLD'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Status: {attempt.status}
            </Badge>
          </div>
        </div>

        {/* Circular Percentage Dial */}
        <div className="flex flex-col items-center justify-center p-6 bg-card/60 backdrop-blur-md rounded-2xl border border-white/10 z-10 shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={attempt.isPassed ? 'text-emerald-400' : 'text-rose-400'}
                strokeDasharray={`${attempt.percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold font-display text-white">{attempt.percentage}%</span>
              <span className="text-[10px] text-slate-300 font-semibold uppercase">Accuracy</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-200 mt-2">
            Score: {attempt.score} / {attempt.maxScore}
          </span>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correct</span>
              <h3 className="text-xl font-bold font-display text-emerald-400">{attempt.correct}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incorrect</span>
              <h3 className="text-xl font-bold font-display text-rose-400">{attempt.incorrect}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unanswered</span>
              <h3 className="text-xl font-bold font-display text-amber-400">{attempt.unanswered}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Spent</span>
              <h3 className="text-xl font-bold font-display text-foreground">{formatSeconds(attempt.timeSpent)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Question Review Accordion */}
      {attempt.showResults && attempt.questionsReview ? (
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Solution & Question Review</CardTitle>
            <CardDescription>
              Analyze your performance, view correct answer keys, and learn from detailed explanations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {attempt.questionsReview.map((q, idx) => {
              const isExpanded = expandedQuestions[q.questionId] ?? true;
              const isCorrect = q.isCorrect;
              const isSubjective = q.type === 'SUBJECTIVE';

              return (
                <div
                  key={q.questionId}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isCorrect === true
                      ? 'bg-emerald-950/10 border-emerald-500/30'
                      : isCorrect === false
                      ? 'bg-rose-950/10 border-rose-500/30'
                      : 'bg-card border-border'
                  }`}
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleQuestionExpand(q.questionId)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-secondary/40 select-none"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      {isCorrect === true ? (
                        <Badge variant="success" className="text-[10px]">
                          + {q.marksAwarded} Correct
                        </Badge>
                      ) : isCorrect === false ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {q.marksAwarded < 0 ? `${q.marksAwarded} Penalty` : '0 Marks (Incorrect)'}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">
                          Manual Evaluation Pending
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{q.type.replace('_', ' ')}</Badge>
                      <span className="text-xs font-semibold text-foreground line-clamp-1 max-w-md">
                        {q.questionText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        Marks: {q.marksAwarded} / {q.marks}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="p-4 pt-0 flex flex-col gap-4 border-t border-border/50 mt-2">
                      <p className="text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Objective Options Comparison */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt) => {
                            const isStudentSelected = Array.isArray(q.studentSelectedOption)
                              ? q.studentSelectedOption.includes(opt.id)
                              : String(q.studentSelectedOption) === String(opt.id);

                            const isCorrectAnswer = Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.includes(opt.id)
                              : String(q.correctAnswer) === String(opt.id);

                            let optClasses = 'bg-secondary/40 border-border text-muted-foreground';
                            if (isCorrectAnswer) {
                              optClasses = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold';
                            } else if (isStudentSelected && !isCorrectAnswer) {
                              optClasses = 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-semibold';
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optClasses}`}
                              >
                                <span>{opt.text}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isStudentSelected && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold">
                                      Your Choice
                                    </span>
                                  )}
                                  {isCorrectAnswer && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase font-bold">
                                      Correct Key
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Subjective Free-Text Comparison */}
                      {isSubjective && (
                        <div className="flex flex-col gap-3">
                          <div className="p-3.5 bg-secondary/50 rounded-xl border border-border">
                            <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                              Your Submitted Response:
                            </span>
                            <p className="text-xs font-mono text-foreground whitespace-pre-line">
                              {q.studentSubjectiveAnswer || 'No response provided.'}
                            </p>
                          </div>

                          {q.feedback && (
                            <div className="p-3.5 bg-primary/10 rounded-xl border border-primary/20">
                              <span className="text-xs font-bold text-primary uppercase block mb-1">
                                Instructor Evaluation Feedback:
                              </span>
                              <p className="text-xs text-foreground">{q.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 bg-secondary/30 rounded-xl border border-border text-xs">
                          <span className="font-bold text-foreground block mb-0.5">Solution Explanation:</span>
                          <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <h3 className="text-base font-bold text-foreground">Detailed Solutions Withheld</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              The instructor has configured this examination to withhold detailed answer keys until all cohort submissions are concluded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentTestResult;
