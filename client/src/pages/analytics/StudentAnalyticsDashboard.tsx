import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  TrendingUp,
  BookOpen,
  Award,
  Calendar,
  ClipboardList,
  FileText,
  Zap
} from 'lucide-react';
import type { IStudentAnalyticsData } from '../../types/analytics';

export const StudentAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<IStudentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentAnalytics();
  }, []);

  const fetchStudentAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/student');
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Calculating your learning performance..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load analytics'} onRetry={fetchStudentAnalytics} />;

  const { courses, tests, assignments, attendance, certificatesCount } = data;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            My Learning & Academic Performance
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Personalized progress telemetry across tests, attendance, assignments, and certified achievements.
          </p>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Exam Pass Rate
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-primary mt-1">
                {tests.passRate}%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {tests.passed} of {tests.attempted} tests passed
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Average Test Score
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400 mt-1">
                {tests.avgScorePercentage}%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Across all completed quizzes
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <Zap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Attendance Consistency
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-indigo-400 mt-1">
                {attendance.percentage}%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {attendance.present} present, {attendance.late} late
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Certificates Earned
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-amber-400 mt-1">
                {certificatesCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Official credentials
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Courses & Cohorts */}
        <Card className="bg-card border-border shadow-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              My Enrolled Cohort Tracks
            </CardTitle>
            <CardDescription>Active cohort batches and associated courses</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {courses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                You are not currently enrolled in any active cohorts.
              </p>
            ) : (
              courses.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-secondary/30 rounded-xl border border-border flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{c.batchName}</span>
                    <span className="text-xs text-muted-foreground">{c.courseTitle}</span>
                  </div>
                  <Badge variant="primary" className="text-[10px]">
                    Active Track
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Assignments Performance */}
        <Card className="bg-card border-border shadow-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-400" />
              Assignments & Code Reviews
            </CardTitle>
            <CardDescription>Evaluation standing on submitted deliverables</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Submitted</span>
                <span className="font-display text-xl font-bold text-foreground block mt-1">
                  {assignments.submitted}
                </span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Reviewed</span>
                <span className="font-display text-xl font-bold text-primary block mt-1">
                  {assignments.graded}
                </span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Avg Score</span>
                <span className="font-display text-xl font-bold text-emerald-400 block mt-1">
                  {assignments.avgMarks} pts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalyticsDashboard;
