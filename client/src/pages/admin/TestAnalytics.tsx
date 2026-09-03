import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import {
  BarChart2,
  ArrowLeft,
  Users,
  Award,
  Clock,
  Percent
} from 'lucide-react';
import type { ITestAnalytics } from '../../types/test';

export const TestAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<ITestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tests/${id}/analytics`);
      setAnalytics(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load test analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  if (loading) return <LoadingState message="Calculating examination metrics..." />;
  if (error || !analytics) return <ErrorState message={error} onRetry={fetchAnalytics} />;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}m ${remainingSec}s`;
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/tests')} className="p-2 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              Examination Analytics & Performance
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Insights, passing rates, and accuracy metrics for: <strong className="text-foreground">{analytics.testTitle}</strong>
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tests/${id}/edit`)}>
          Edit Test
        </Button>
      </div>

      {analytics.totalAttempts === 0 ? (
        <EmptyState
          title="No Examination Data Yet"
          description="Student submissions and accuracy insights will appear here once learners take this test."
          actionLabel="Back to Tests"
          onAction={() => navigate('/admin/tests')}
        />
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Attempts</p>
                  <h3 className="text-2xl font-bold font-display text-foreground mt-1">{analytics.totalAttempts}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Completed submissions</p>
                </div>
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Pass Rate</p>
                  <h3 className={`text-2xl font-bold font-display mt-1 ${analytics.passRate >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {analytics.passRate}%
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Threshold: {analytics.passingMarks} marks</p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Percent className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Score</p>
                  <h3 className="text-2xl font-bold font-display text-primary mt-1">
                    {analytics.averageScore} <span className="text-sm font-normal text-muted-foreground">/ {analytics.totalMarks}</span>
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    High: {analytics.highestScore} | Low: {analytics.lowestScore}
                  </p>
                </div>
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Time Spent</p>
                  <h3 className="text-2xl font-bold font-display text-foreground mt-1">
                    {formatSeconds(analytics.averageTimeSpent)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Per attempt average</p>
                </div>
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Accuracy Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Question Accuracy & Difficulty Matrix</CardTitle>
              <CardDescription>
                Understand which questions students solved with high accuracy and which items were challenging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {analytics.questionAccuracy.map((q, idx) => {
                  const acc = q.accuracyPercentage;
                  const colorClass = acc >= 70 ? 'bg-emerald-500' : acc >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                  const textColorClass = acc >= 70 ? 'text-emerald-400' : acc >= 40 ? 'text-amber-400' : 'text-rose-400';

                  return (
                    <div
                      key={q.questionId}
                      className="p-4 rounded-xl border border-border bg-secondary/30 flex flex-col gap-2.5"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs font-mono text-muted-foreground">Q{idx + 1}</span>
                          <Badge variant="secondary" className="text-[10px]">{q.type}</Badge>
                          <Badge
                            variant={
                              q.difficulty === 'EASY'
                                ? 'success'
                                : q.difficulty === 'MEDIUM'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {q.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">+{q.marks} marks</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            {q.correctAnswers} / {q.totalResponses} correct
                          </span>
                          <span className={`text-sm font-bold font-mono ${textColorClass}`}>
                            {acc}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-foreground line-clamp-2">
                        {q.questionText}
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Submissions</CardTitle>
              <CardDescription>Latest examination attempts recorded on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2.5">
                {analytics.recentSubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                        {sub.student?.name?.slice(0, 2) || 'ST'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{sub.student?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{sub.student?.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Score: <strong className="text-foreground">{sub.score} / {sub.maxScore}</strong> ({sub.percentage}%)
                      </span>
                      <span className="text-muted-foreground">
                        Time: <strong>{formatSeconds(sub.timeSpent)}</strong>
                      </span>
                      <Badge variant={sub.isPassed ? 'success' : 'destructive'} className="text-[10px]">
                        {sub.isPassed ? 'PASSED' : 'FAILED'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TestAnalytics;
