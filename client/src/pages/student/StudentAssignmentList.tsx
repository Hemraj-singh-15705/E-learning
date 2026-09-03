import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  Award,
  Search,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import type { IAssignment } from '../../types/assignment';

export const StudentAssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data.data.assignments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  // Compute metrics
  const pendingCount = assignments.filter((a) => !a.mySubmission || a.mySubmission.status === 'DRAFT').length;
  const submittedCount = assignments.filter(
    (a) => a.mySubmission && (a.mySubmission.status === 'SUBMITTED' || a.mySubmission.status === 'LATE')
  ).length;
  const gradedCount = assignments.filter((a) => a.mySubmission?.status === 'REVIEWED').length;

  const totalScore = assignments.reduce((acc, a) => acc + (a.mySubmission?.marks || 0), 0);
  const totalPossible = assignments
    .filter((a) => a.mySubmission?.status === 'REVIEWED')
    .reduce((acc, a) => acc + a.totalMarks, 0);
  const avgPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 100;

  // Tab filtering
  const filteredAssignments = assignments.filter((a) => {
    const sub = a.mySubmission;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;

    if (activeTab === 'PENDING') return !sub || sub.status === 'DRAFT';
    if (activeTab === 'SUBMITTED') return sub && (sub.status === 'SUBMITTED' || sub.status === 'LATE');
    if (activeTab === 'GRADED') return sub?.status === 'REVIEWED';
    if (activeTab === 'RETURNED') return sub?.status === 'RETURNED';
    return true;
  });

  return (
    <div className="d-flex flex-column gap-4 animate-enter text-start">
      {/* Header Banner */}
      <div
        className="p-4 p-md-5 rounded-4 border shadow-sm d-flex flex-column gap-2"
        style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%)',
          borderColor: '#fde68a'
        }}
      >
        <div className="d-flex align-items-center gap-1.5" style={{ color: '#92400e' }}>
          <Sparkles className="h-4 w-4" />
          <span className="text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
            Daily Practice Problem (DPP) & Homework Hub
          </span>
        </div>

        <h1 className="fw-black display-6 mb-1 font-display" style={{ color: '#78350f' }}>
          Daily Practice Worksheets & Assignments
        </h1>

        <p className="small mb-0" style={{ maxWidth: '680px', fontSize: '0.88rem', color: '#92400e', lineHeight: '1.5' }}>
          Solve chapter-wise DPPs uploaded after each lecture by Vishakha Ma'am, upload solutions, and review faculty remarks.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <div className="card h-100 p-3 rounded-4 border shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Pending DPPs
              </span>
              <div className="p-2 rounded-3" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="fs-3 fw-black font-display" style={{ color: '#d97706' }}>
              {pendingCount}
            </div>
            <div className="text-secondary small mt-1" style={{ fontSize: '0.68rem' }}>
              Requires submission
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card h-100 p-3 rounded-4 border shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Submitted
              </span>
              <div className="p-2 rounded-3" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="fs-3 fw-black font-display" style={{ color: '#4f46e5' }}>
              {submittedCount}
            </div>
            <div className="text-secondary small mt-1" style={{ fontSize: '0.68rem' }}>
              Under faculty evaluation
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card h-100 p-3 rounded-4 border shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Graded & Reviewed
              </span>
              <div className="p-2 rounded-3" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="fs-3 fw-black font-display" style={{ color: '#16a34a' }}>
              {gradedCount}
            </div>
            <div className="text-secondary small mt-1" style={{ fontSize: '0.68rem' }}>
              Reviewed with feedback
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card h-100 p-3 rounded-4 border shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Avg Performance
              </span>
              <div className="p-2 rounded-3" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="fs-3 fw-black font-display" style={{ color: '#0284c7' }}>
              {avgPercentage}%
            </div>
            <div className="text-secondary small mt-1" style={{ fontSize: '0.68rem' }}>
              Across submitted sheets
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {(['ALL', 'PENDING', 'SUBMITTED', 'GRADED', 'RETURNED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`btn btn-sm px-3 py-1.5 fw-bold rounded-2 transition-all ${
                  activeTab === tab
                    ? 'btn-warning text-dark shadow-sm'
                    : 'btn-outline-secondary border-0 text-secondary'
                }`}
                style={{ fontSize: '0.72rem' }}
              >
                {tab === 'ALL' ? `All (${assignments.length})` : tab}
              </button>
            ))}
          </div>

          <div className="position-relative w-100" style={{ maxWidth: '300px' }}>
            <Search className="position-absolute text-secondary" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px' }} />
            <input
              type="text"
              placeholder="Search assignment title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm ps-4 py-1"
              style={{ fontSize: '0.78rem' }}
            />
          </div>
        </div>
      </div>

      {/* Assignments Listing */}
      {loading ? (
        <LoadingState message="Loading practice worksheets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAssignments} />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          title="No Assignments Available"
          description="Your instructors have not published practice sheets for this category yet."
        />
      ) : (
        <div className="row g-3">
          {filteredAssignments.map((item) => (
            <div key={item._id} className="col-12 col-md-6">
              <div className="card h-100 p-3.5 rounded-4 border shadow-sm d-flex flex-column justify-content-between text-start card-hover" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-warning bg-opacity-20 text-dark border border-warning" style={{ fontSize: '0.68rem' }}>
                      {item.course?.title || 'Mathematics DPP'}
                    </span>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                      Total: {item.totalMarks} Marks
                    </span>
                  </div>

                  <h5 className="fw-bold fs-6 mb-1" style={{ color: '#0f172a' }}>{item.title}</h5>
                  <p className="text-secondary small mb-3" style={{ fontSize: '0.74rem', minHeight: '34px', lineHeight: '1.35' }}>
                    {item.description || 'Solve all problems on paper and submit your PDF solution sheet.'}
                  </p>
                </div>

                <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                  <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                    Due: <strong style={{ color: '#0f172a' }}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Open'}</strong>
                  </div>
                  <button
                    onClick={() => navigate(`/student/assignments/${item._id}/submit`)}
                    className="btn btn-warning text-dark btn-sm fw-bold d-inline-flex align-items-center gap-1 py-1 px-3"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Open Worksheet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentList;
