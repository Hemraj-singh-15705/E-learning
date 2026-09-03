import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  FileText,
  Clock,
  Award,
  RotateCcw,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import type { ITest } from '../../types/test';

export const StudentTestList: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<ITest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/tests');
      setTests(res.data.data.tests || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load mock tests.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTab === 'ACTIVE') return t.hasActiveAttempt;
    if (filterTab === 'COMPLETED') return (t.attemptsUsed || 0) > 0;
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
            CBT Mock Test & DPP Portal
          </span>
        </div>

        <h1 className="fw-black display-6 mb-1 font-display" style={{ color: '#78350f' }}>
          Teaching Exam CBT Mock Tests
        </h1>

        <p className="small mb-0" style={{ maxWidth: '680px', fontSize: '0.88rem', color: '#92400e', lineHeight: '1.5' }}>
          Attempt authentic Computer Based Tests (CBT) with exact DSSSB / CTET exam timers, negative marking, question palettes, and instant rank analytics.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-1.5 w-100 w-sm-auto">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`btn btn-sm px-3 py-1.5 fw-bold rounded-2 transition-all ${
                filterTab === 'ALL'
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary border-0 text-secondary'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              All Tests ({tests.length})
            </button>
            <button
              onClick={() => setFilterTab('ACTIVE')}
              className={`btn btn-sm px-3 py-1.5 fw-bold rounded-2 transition-all ${
                filterTab === 'ACTIVE'
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary border-0 text-secondary'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              In Progress ({tests.filter((t) => t.hasActiveAttempt).length})
            </button>
            <button
              onClick={() => setFilterTab('COMPLETED')}
              className={`btn btn-sm px-3 py-1.5 fw-bold rounded-2 transition-all ${
                filterTab === 'COMPLETED'
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary border-0 text-secondary'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              Completed ({tests.filter((t) => (t.attemptsUsed || 0) > 0).length})
            </button>
          </div>

          <div className="position-relative w-100" style={{ maxWidth: '300px' }}>
            <Search className="position-absolute text-secondary" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px' }} />
            <input
              type="text"
              placeholder="Search test title, exam category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm ps-4 py-1"
              style={{ fontSize: '0.78rem' }}
            />
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <LoadingState message="Loading CBT assessments..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTests} />
      ) : filteredTests.length === 0 ? (
        <EmptyState
          title="No Mock Tests Found"
          description="There are no active tests matching your current filter criteria."
        />
      ) : (
        <div className="row g-3">
          {filteredTests.map((test) => {
            const hasAttemptsLeft = test.attemptsAllowed === 0 || (test.attemptsUsed || 0) < test.attemptsAllowed;

            return (
              <div key={test._id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card h-100 p-3.5 rounded-4 border shadow-sm d-flex flex-column justify-content-between text-start card-hover"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0'
                  }}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-warning bg-opacity-20 text-dark border border-warning" style={{ fontSize: '0.68rem' }}>
                        {test.course?.title || test.batch?.name || 'Teaching Mock Test'}
                      </span>
                      {test.hasActiveAttempt ? (
                        <span className="badge bg-danger text-white animate-pulse" style={{ fontSize: '0.65rem' }}>
                          RESUME AVAILABLE
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                          {test.questionsCount || test.questions?.length || 50} MCQs
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h5 className="fw-bold mb-1 fs-6" style={{ color: '#0f172a' }}>{test.title}</h5>
                    <p className="text-secondary small mb-3" style={{ fontSize: '0.75rem', minHeight: '34px', lineHeight: '1.35' }}>
                      {test.description || 'Simulate official exam interface with timer & negative marking.'}
                    </p>

                    {/* Exam Specs Pills */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-2 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.7rem' }}>
                        <Clock className="h-3 w-3 text-warning" />
                        <span style={{ color: '#334155' }}>{test.duration} Mins</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-2 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.7rem' }}>
                        <Award className="h-3 w-3 text-success" />
                        <span style={{ color: '#334155' }}>{test.totalMarks} Marks</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-2 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.7rem' }}>
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span style={{ color: '#334155' }}>Pass: {test.passingMarks} Marks</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Actions */}
                  <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                    <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                      Attempts: <strong style={{ color: '#0f172a' }}>{test.attemptsUsed || 0} / {test.attemptsAllowed === 0 ? '∞' : test.attemptsAllowed}</strong>
                    </div>

                    <div>
                      {test.hasActiveAttempt ? (
                        <button
                          onClick={() => navigate(`/student/tests/${test._id}/attempt`)}
                          className="btn btn-danger btn-sm fw-bold d-inline-flex align-items-center gap-1 py-1 px-3"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Resume Test
                        </button>
                      ) : hasAttemptsLeft ? (
                        <button
                          onClick={() => navigate(`/student/tests/${test._id}/attempt`)}
                          className="btn btn-warning text-dark btn-sm fw-bold d-inline-flex align-items-center gap-1 py-1 px-3"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <FileText className="h-3.5 w-3.5" /> Start CBT Test
                        </button>
                      ) : (
                        <span className="badge bg-secondary text-white py-1 px-2.5">
                          Attempts Maxed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTestList;
