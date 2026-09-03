import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  Users,
  Layers,
  Calendar,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import type { IMentorAnalyticsData } from '../../types/analytics';

export const MentorAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<IMentorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMentorAnalytics();
  }, []);

  const fetchMentorAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/mentor');
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load mentor analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Aggregating your mentorship cohort data..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load analytics'} onRetry={fetchMentorAnalytics} />;

  const { batches, students, sessions, evaluations } = data;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Mentor Cohort & Instruction Cockpit
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time analytics for your assigned cohorts, upcoming calls, and student submission grading queue.
          </p>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Assigned Batches
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-primary mt-1">
                {batches.count}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Active cohort groups
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Mentored Students
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400 mt-1">
                {students.totalMentored}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Total cohort learners
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Completed Calls
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-indigo-400 mt-1">
                {sessions.completed}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {sessions.scheduled} scheduled ahead
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
                Pending Grading
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-amber-400 mt-1">
                {evaluations.pendingAssignmentReviews}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Submissions awaiting review
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <ClipboardList className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Grid */}
      <Card className="bg-card border-border shadow-premium">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            My Active Cohorts
          </CardTitle>
          <CardDescription>Direct access to your assigned batch telemetry</CardDescription>
        </CardHeader>
        <CardContent>
          {batches.list.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No batches currently assigned to your instructor profile.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.list.map((b) => (
                <div
                  key={b._id}
                  className="p-4 bg-secondary/30 rounded-xl border border-border flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{b.name}</span>
                    <span className="font-mono text-xs text-muted-foreground mt-0.5">
                      Batch Code: {b.code}
                    </span>
                  </div>
                  <Badge variant="primary" className="text-[10px]">
                    Cohort Lead
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MentorAnalyticsDashboard;
