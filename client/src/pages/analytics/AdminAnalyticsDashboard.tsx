import React, { useState, useEffect } from 'react';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  BarChart3,
  Users,
  Award,
  Calendar,
  ClipboardList,
  FileText,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  IndianRupee,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import type { IAdminAnalyticsData } from '../../types/analytics';

export const AdminAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<IAdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/admin');
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Aggregating platform intelligence..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load analytics'} onRetry={fetchAnalytics} />;

  const { users, academic, examinations, attendance, assignments, finance } = data;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 p-3.5 rounded-4 border border-secondary" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="p-1.5 rounded-3 bg-warning bg-opacity-20 text-warning">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="fs-4 fw-black text-white font-display mb-0">
              Platform Analytics & Academic Intelligence
            </h1>
          </div>
          <p className="text-secondary small mb-0" style={{ fontSize: '0.8rem' }}>
            Real-time multi-dimensional operational metrics for Vishakha Ma'am Official teaching platform.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1.5 py-1.5 px-3 rounded-3"
          style={{ fontSize: '0.78rem' }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </button>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="row g-3">
        {/* Gross Platform Revenue */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  Gross Platform Revenue
                </span>
                <div className="fs-3 fw-black text-success font-display mt-1">
                  ₹{finance.grossRevenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success border border-success border-opacity-25 shrink-0">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
            <div className="d-flex align-items-center gap-1.5 pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.72rem' }}>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span>{finance.successfulPayments} verified checkouts</span>
            </div>
          </div>
        </div>

        {/* Total Users & Students */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  Total Registered Users
                </span>
                <div className="fs-3 fw-black text-primary font-display mt-1">
                  {users.total}
                </div>
              </div>
              <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="d-flex align-items-center gap-1.5 pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.72rem' }}>
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span>{users.students} Students • {users.mentors} Faculty Mentors</span>
            </div>
          </div>
        </div>

        {/* Active Enrollments */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  Active Batch Enrollments
                </span>
                <div className="fs-3 fw-black text-info font-display mt-1">
                  {academic.activeEnrollments}
                </div>
              </div>
              <div className="p-2.5 rounded-3 bg-info bg-opacity-10 text-info border border-info border-opacity-25 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="d-flex align-items-center gap-1.5 pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.72rem' }}>
              <Sparkles className="h-3.5 w-3.5 text-info" />
              <span>Across {academic.batches} Cohort Batches</span>
            </div>
          </div>
        </div>

        {/* Certificates & Completions */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  Certificates Awarded
                </span>
                <div className="fs-3 fw-black text-warning font-display mt-1">
                  {academic.certificatesIssued}
                </div>
              </div>
              <div className="p-2.5 rounded-3 bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 shrink-0">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="d-flex align-items-center gap-1.5 pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.72rem' }}>
              <TrendingUp className="h-3.5 w-3.5 text-warning" />
              <span>Verified Course Completions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="row g-3">
        {/* Attendance Health & Consistency */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm text-start" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <h5 className="fw-bold text-white fs-6 mb-0">Attendance Health</h5>
              </div>
              <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '0.65rem' }}>
                Overall Rate
              </span>
            </div>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.74rem' }}>
              Platform-wide live session attendance metrics
            </p>

            <div className="d-flex align-items-baseline justify-content-between mb-3">
              <span className="fs-2 fw-black text-emerald-400 font-display">
                {attendance.rate}%
              </span>
              <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                Class Consistency
              </span>
            </div>

            <div className="row g-2 text-start" style={{ fontSize: '0.75rem' }}>
              <div className="col-6">
                <div className="p-2 rounded-3 border border-success border-opacity-25 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <span className="text-light">Present</span>
                  <strong className="text-success">{attendance.breakdown.PRESENT}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded-3 border border-warning border-opacity-25 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <span className="text-light">Late</span>
                  <strong className="text-warning">{attendance.breakdown.LATE}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded-3 border border-danger border-opacity-25 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <span className="text-light">Absent</span>
                  <strong className="text-danger">{attendance.breakdown.ABSENT}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded-3 border border-info border-opacity-25 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                  <span className="text-light">Excused</span>
                  <strong className="text-info">{attendance.breakdown.EXCUSED}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Examination & CBT Performance */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm text-start" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <h5 className="fw-bold text-white fs-6 mb-0">Exam & Test Series</h5>
              </div>
              <span className="badge bg-primary bg-opacity-25 text-primary" style={{ fontSize: '0.65rem' }}>
                CBT Pattern
              </span>
            </div>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.74rem' }}>
              Testing results and negative marking score averages
            </p>

            <div className="d-flex align-items-baseline justify-content-between mb-3">
              <span className="fs-2 fw-black text-primary font-display">
                {examinations.averagePercentage}%
              </span>
              <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                Avg Exam Score
              </span>
            </div>

            <div className="d-flex flex-column gap-2 p-2.5 rounded-3 border border-secondary" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', fontSize: '0.75rem' }}>
              <div className="d-flex justify-content-between text-secondary">
                <span>Total Test Attempts:</span>
                <strong className="text-white">{examinations.totalAttempts}</strong>
              </div>
              <div className="d-flex justify-content-between text-secondary">
                <span>Platform Average Marks:</span>
                <strong className="text-warning">{examinations.averageScore} pts</strong>
              </div>
              <div className="d-flex justify-content-between text-secondary">
                <span>Target Exams:</span>
                <strong className="text-info">DSSSB, CTET, KVS, BPSC</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment & DPP Engagement */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 p-3.5 rounded-4 border-secondary shadow-sm text-start" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-info" />
                <h5 className="fw-bold text-white fs-6 mb-0">DPP & Assignments</h5>
              </div>
              <span className="badge bg-info bg-opacity-25 text-info" style={{ fontSize: '0.65rem' }}>
                Practice Sheets
              </span>
            </div>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.74rem' }}>
              Daily Problem Practice sheets submitted by students
            </p>

            <div className="d-flex align-items-baseline justify-content-between mb-3">
              <span className="fs-2 fw-black text-info font-display">
                {assignments.totalSubmissions}
              </span>
              <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                Total Submissions
              </span>
            </div>

            <div className="d-flex flex-column gap-2 p-2.5 rounded-3 border border-secondary" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', fontSize: '0.75rem' }}>
              <div className="d-flex justify-content-between text-secondary">
                <span>Active DPP Worksheets:</span>
                <strong className="text-white">{assignments.totalAssignments}</strong>
              </div>
              <div className="d-flex justify-content-between text-secondary">
                <span>Curriculum Modules Published:</span>
                <strong className="text-white">{academic.courses} courses</strong>
              </div>
              <div className="d-flex justify-content-between text-secondary">
                <span>Live Cohorts:</span>
                <strong className="text-success">{academic.batches} active</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
