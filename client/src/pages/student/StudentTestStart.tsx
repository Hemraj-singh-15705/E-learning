import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import {
  FileText,
  Clock,
  Award,
  PlayCircle,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Eye
} from 'lucide-react';
import type { ITest } from '../../types/test';

export const StudentTestStart: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<ITest | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchTestBriefing = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tests/${id}`);
      setTest(res.data.data.test);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load test specifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestBriefing();
  }, [id]);

  const handleStartExam = async () => {
    if (!test) return;
    setStarting(true);
    try {
      const res = await api.post(`/tests/${id}/start`);
      const { attemptId } = res.data.data;
      showToast('Examination session initiated. Good luck!', 'success');
      navigate(`/student/tests/${id}/attempt/${attemptId}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to start examination session.', 'error');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <LoadingState message="Preparing examination briefing..." />;
  if (error || !test) return <ErrorState message={error} onRetry={fetchTestBriefing} />;

  const hasAttemptsRemaining =
    test.attemptsAllowed === 0 || (test.attemptsUsed || 0) < test.attemptsAllowed;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-enter pb-12">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/tests')} className="p-2 h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Back to Assessment Catalog</span>
      </div>

      {/* Main Briefing Banner */}
      <div className="gradient-bg p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-premium flex flex-col gap-3">
        <div className="absolute top-[10%] right-[5%] w-56 h-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="flex items-center gap-2 text-violet-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Official Examination</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">{test.title}</h1>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          {test.description || 'Please carefully review the examination parameters, timer rules, and penalty structures before launching your attempt.'}
        </p>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Duration
            </span>
            <span className="text-xl font-bold font-display text-foreground">{test.duration} Minutes</span>
            <span className="text-[10px] text-muted-foreground">Server-enforced timer</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              Total Marks
            </span>
            <span className="text-xl font-bold font-display text-emerald-400">{test.totalMarks} Points</span>
            <span className="text-[10px] text-muted-foreground">Pass: {test.passingMarks} pts</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              Questions
            </span>
            <span className="text-xl font-bold font-display text-foreground">{test.questionsCount || 0} Questions</span>
            <span className="text-[10px] text-muted-foreground">{test.sections?.length || 1} Section(s)</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              Attempts
            </span>
            <span className="text-xl font-bold font-display text-foreground">
              {test.attemptsRemaining} Left
            </span>
            <span className="text-[10px] text-muted-foreground">
              Used: {test.attemptsUsed || 0} of {test.attemptsAllowed === 0 ? 'Unlimited' : test.attemptsAllowed}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Rules & Examination Guidelines Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Rules & System Guidelines
          </CardTitle>
          <CardDescription>
            Ensure you have an uninterrupted environment before clicking start.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {test.instructions ? (
            <div className="p-4 rounded-xl border border-border bg-secondary/30 font-mono text-xs whitespace-pre-line leading-relaxed text-foreground">
              {test.instructions}
            </div>
          ) : (
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
              <li>The timer begins the moment you click <strong>"Launch Examination"</strong>.</li>
              <li>Your responses are automatically synced to the cloud in real-time.</li>
              <li>When the countdown reaches 00:00, your test will automatically submit.</li>
              {test.negativeMarking && (
                <li className="text-rose-400 font-semibold">
                  Negative marking is enabled (-{test.negativeMarkValue || 'assigned'} marks for incorrect objective answers).
                </li>
              )}
            </ul>
          )}

          {/* Verification Checkbox */}
          <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-xl mt-2">
            <input
              type="checkbox"
              id="rulesCheck"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer mt-0.5"
            />
            <label htmlFor="rulesCheck" className="text-xs text-foreground font-medium cursor-pointer">
              I have read the rules and agree to take this examination honestly without external assistance.
            </label>
          </div>

          {/* Launch Action */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {hasAttemptsRemaining ? (
                <span>Clicking start will open the full examination interface.</span>
              ) : (
                <span className="text-rose-400 font-semibold">You have exhausted all allowed attempts for this test.</span>
              )}
            </div>

            {hasAttemptsRemaining ? (
              <Button
                size="lg"
                disabled={!rulesAccepted || starting}
                onClick={handleStartExam}
                className="w-full sm:w-auto shadow-premium font-bold px-8"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                {starting ? 'Initializing Exam Session...' : 'Launch Examination'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  if (test.attemptsHistory && test.attemptsHistory.length > 0) {
                    navigate(`/student/tests/${test._id}/result/${test.attemptsHistory[0]._id}`);
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Latest Result
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Past Attempts History */}
      {test.attemptsHistory && test.attemptsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Past Attempts for this Test</CardTitle>
            <CardDescription className="text-xs">Review scores and performance from previous tries.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {test.attemptsHistory.map((att, idx) => (
                <div
                  key={att._id}
                  className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-mono font-bold">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">
                        Score: {att.score} / {att.maxScore} ({att.percentage}%)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(att.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={att.isPassed ? 'success' : 'destructive'} className="text-[10px]">
                      {att.isPassed ? 'PASSED' : 'FAILED'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/student/tests/${test._id}/result/${att._id}`)}
                      className="text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Result
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentTestStart;
