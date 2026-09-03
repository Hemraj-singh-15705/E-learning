import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  Layers,
  Users,
  Calendar,
  FileText,
  ArrowLeft,
  Award
} from 'lucide-react';
import type { IBatchAnalyticsData } from '../../types/analytics';

export const BatchAnalyticsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<IBatchAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchBatchAnalytics(id);
  }, [id]);

  const fetchBatchAnalytics = async (batchId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/analytics/batches/${batchId}`);
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load batch analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading cohort performance metrics..." />;
  if (error || !data) return <ErrorState message={error || 'Batch not found'} onRetry={() => id && fetchBatchAnalytics(id)} />;

  const { batch, students, attendance, performance } = data;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="p-2 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              {batch.name} Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Batch Code: {batch.code} • Track: {batch.course}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Total Students
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-primary mt-1">
                {students.total}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {students.active} actively enrolled
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Attendance Rate
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400 mt-1">
                {attendance.rate}%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {attendance.totalRecords} attendance logs
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Test Pass Rate
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-indigo-400 mt-1">
                {performance.testPassRate}%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Across all cohort exams
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
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
              <span className="text-2xl sm:text-3xl font-black font-display text-amber-400 mt-1">
                {performance.avgTestPercentage}%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {performance.totalTestAttempts} attempts total
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <Card className="bg-card border-border shadow-premium">
        <CardHeader>
          <CardTitle className="text-base">Cohort Attendance Distribution</CardTitle>
          <CardDescription>Detailed attendance breakdown for this batch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-emerald-300 font-semibold block">Present</span>
              <span className="text-lg font-bold text-emerald-400 font-mono mt-1">
                {attendance.breakdown.PRESENT}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-amber-300 font-semibold block">Late</span>
              <span className="text-lg font-bold text-amber-400 font-mono mt-1">
                {attendance.breakdown.LATE}
              </span>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <span className="text-rose-300 font-semibold block">Absent</span>
              <span className="text-lg font-bold text-rose-400 font-mono mt-1">
                {attendance.breakdown.ABSENT}
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <span className="text-indigo-300 font-semibold block">Excused</span>
              <span className="text-lg font-bold text-indigo-400 font-mono mt-1">
                {attendance.breakdown.EXCUSED}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchAnalyticsView;
