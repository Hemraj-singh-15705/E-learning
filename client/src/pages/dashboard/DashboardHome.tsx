import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { RootState } from '../../store';
import api from '../../utils/api';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  Video,
  ArrowRight,
  CheckCircle2,
  FileText,
  Flame,
  GraduationCap
} from 'lucide-react';
import { LoadingState } from '../../components/ui/States';

export const DashboardHome: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<any>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin Academic Command Center',
    ADMIN: 'Administrator Academic Dashboard',
    MENTOR: 'Faculty Educator Workspace',
    STUDENT: 'Teaching Aspirant Learning Center'
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          const [res, sRes] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/sessions/dashboard-summary')
          ]);
          setStatsData(res.data.data);
          setUpcomingSessions(sRes.data.data?.upcomingSessions || []);
        } else {
          // Student or Mentor: fetch batches and sessions summary
          const [bRes, sRes] = await Promise.all([
            api.get('/batches'),
            api.get('/sessions/dashboard-summary')
          ]);

          const items = bRes.data.data.items || [];
          let courseCount = 0;
          items.forEach((b: any) => {
            courseCount += b.courses?.length || 0;
          });

          setStatsData({
            batchCount: items.length,
            courseCount,
            sessionMetrics: sRes.data.data?.metrics
          });
          setUpcomingSessions(sRes.data.data?.upcomingSessions || []);

          if (user.role === 'STUDENT') {
            const attRes = await api.get('/sessions/attendance/summary');
            setAttendanceSummary(attRes.data.data?.summary || null);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const getStats = () => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      return [
        { label: 'Active Batches', value: statsData?.totalBatches ?? 6, icon: <Users className="h-5 w-5 text-warning" />, change: 'Total cohort batches' },
        { label: 'Course Modules', value: statsData?.totalCourses ?? 12, icon: <BookOpen className="h-5 w-5 text-primary" />, change: 'Curriculum tracks' },
        { label: 'Master Faculty', value: statsData?.totalMentors ?? 3, icon: <Calendar className="h-5 w-5 text-info" />, change: 'Active teaching mentors' },
        { label: 'Enrolled Aspirants', value: statsData?.totalStudents ?? 41, icon: <TrendingUp className="h-5 w-5 text-success" />, change: 'Active students' }
      ];
    }

    if (user?.role === 'MENTOR') {
      return [
        { label: 'My Teaching Batches', value: statsData?.batchCount ?? 3, icon: <Users className="h-5 w-5 text-warning" />, change: 'Cohorts assigned' },
        { label: 'Assigned Modules', value: statsData?.courseCount ?? 8, icon: <BookOpen className="h-5 w-5 text-primary" />, change: 'Syllabus chapters' },
        { label: 'Sessions Completed', value: statsData?.sessionMetrics?.completedSessions ?? 14, icon: <CheckCircle2 className="h-5 w-5 text-success" />, change: 'Live lectures conducted' },
        { label: 'Scheduled Ahead', value: statsData?.sessionMetrics?.scheduledSessions ?? (upcomingSessions.length || 3), icon: <Clock className="h-5 w-5 text-info" />, change: 'Upcoming timetable' }
      ];
    }

    // STUDENT default stats
    return [
      { label: 'Enrolled Batches', value: statsData?.batchCount ?? 1, icon: <GraduationCap className="h-5 w-5 text-warning" />, change: 'Target cohort' },
      { label: 'Study Modules', value: statsData?.courseCount ?? 4, icon: <BookOpen className="h-5 w-5 text-primary" />, change: 'Active syllabus courses' },
      { label: 'Classes Attended', value: attendanceSummary?.presentCount ?? 8, icon: <CheckCircle2 className="h-5 w-5 text-success" />, change: 'Live lectures attended' },
      { label: 'Attendance Rate', value: `${attendanceSummary?.attendanceRate ?? 100}%`, icon: <Award className="h-5 w-5 text-info" />, change: 'Classroom consistency' }
    ];
  };

  const stats = getStats();

  if (loading) return <LoadingState message="Loading study room & metrics..." />;

  return (
    <div className="d-flex flex-column gap-4 animate-enter text-start">
      {/* Welcome Banner */}
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
            {user ? roleLabels[user.role] : 'Vishakha Ma\'am Classroom'}
          </span>
        </div>

        <h1 className="fw-black display-6 mb-1 font-display" style={{ color: '#78350f' }}>
          Welcome back, {user?.name}
        </h1>

        <p className="small mb-3" style={{ maxWidth: '680px', fontSize: '0.88rem', color: '#92400e', lineHeight: '1.5' }}>
          {user?.role === 'STUDENT'
            ? 'Your teaching recruitment study room is active. Join live interactive classes, solve daily DPPs, attempt CBT mock tests and review handwritten notes.'
            : 'Academic management command center. Schedule sessions, review test analytics, publish DPP sheets and track student attendance.'}
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/dashboard/sessions" className="btn btn-warning text-dark btn-sm fw-bold d-inline-flex align-items-center gap-1.5 py-2 px-3.5 rounded-3" style={{ fontSize: '0.82rem' }}>
            <Video className="h-4 w-4" /> Join Today's Live Class
          </Link>
          <Link to="/student/tests" className="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1.5 py-2 px-3.5 rounded-3" style={{ fontSize: '0.82rem' }}>
            <FileText className="h-4 w-4 text-warning" /> Attempt CBT Mock Test
          </Link>
        </div>
      </div>

      {/* Analytics stats row */}
      <div className="row g-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100 p-3.5 rounded-4 border shadow-sm d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  {stat.label}
                </span>
                <div className="p-2 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  {stat.icon}
                </div>
              </div>
              <div className="fs-3 fw-black font-display" style={{ color: '#0f172a' }}>
                {stat.value}
              </div>
              <div className="text-secondary small mt-1" style={{ fontSize: '0.68rem' }}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main dashboard body splits */}
      <div className="row g-3">
        {/* Main activities board */}
        <div className="col-12 col-xl-8">
          <div className="card h-100 p-3.5 rounded-4 border shadow-sm text-start" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <Flame className="h-4 w-4 text-warning" />
                <h5 className="fw-bold mb-0 fs-6" style={{ color: '#0f172a' }}>Daily Study Roadmap & Announcements</h5>
              </div>
              <span className="badge bg-warning bg-opacity-20 text-dark border border-warning fw-bold" style={{ fontSize: '0.65rem' }}>
                DSSSB & CTET 2026
              </span>
            </div>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.74rem' }}>
              Stay updated with daily practice sheets, live session syncs, and exam notifications
            </p>

            <div className="d-flex flex-column gap-2.5">
              <div className="p-3 rounded-3 border d-flex gap-3 align-items-start" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div className="p-2 rounded-3 shrink-0" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="fw-bold small" style={{ color: '#14532d' }}>Live 2-Way Classroom & DPP Engine Active</div>
                  <p className="small mb-1" style={{ fontSize: '0.76rem', lineHeight: '1.4', color: '#166534' }}>
                    Join live interactive classes by Vishakha Ma'am with 2-way audio doubts, solve tagged DPPs, and take real-time CBT mock tests with instant ranking.
                  </p>
                  <span className="badge bg-white border border-success text-success" style={{ fontSize: '0.65rem' }}>
                    Official Academic Engine
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-3 border d-flex gap-3 align-items-start" style={{ backgroundColor: '#fefce8', borderColor: '#fef08a' }}>
                <div className="p-2 rounded-3 shrink-0" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="fw-bold small" style={{ color: '#713f12' }}>Mathematics & Pedagogy Schedule Ticker</div>
                  <p className="small mb-1" style={{ fontSize: '0.76rem', lineHeight: '1.4', color: '#854d0e' }}>
                    Access Full HD recordings, downloadable handwritten formula PDF sheets, and classroom notes in the Sessions tab within 2 hours of each live class.
                  </p>
                  <span className="badge bg-white border border-warning text-dark" style={{ fontSize: '0.65rem' }}>
                    Classroom Archive • 24x7 Access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Side Panel with Upcoming Sessions */}
        <div className="col-12 col-xl-4">
          <div className="card h-100 p-3.5 rounded-4 border shadow-sm text-start d-flex flex-column" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div>
                <h5 className="fw-bold fs-6 mb-0" style={{ color: '#0f172a' }}>Upcoming Live Classes</h5>
                <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Today's scheduled lectures</div>
              </div>
              <button
                onClick={() => navigate('/dashboard/sessions')}
                className="btn btn-link text-warning text-decoration-none small p-0 fw-bold d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.75rem', color: '#d97706' }}
              >
                View Timetable <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="d-flex flex-column gap-2 mt-3 flex-grow-1">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-4 my-auto">
                  <div className="p-2.5 rounded-circle bg-warning bg-opacity-10 text-warning d-inline-block mb-2">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="fw-bold small" style={{ color: '#0f172a' }}>No sessions scheduled today</div>
                  <p className="text-secondary small mt-1 mb-2" style={{ fontSize: '0.72rem' }}>
                    Check back at 5:00 PM for Vishakha Ma'am live broadcast.
                  </p>
                  <Link to="/dashboard/sessions" className="btn btn-sm btn-outline-warning py-1 px-2.5" style={{ fontSize: '0.75rem' }}>
                    Open Timetable
                  </Link>
                </div>
              ) : (
                upcomingSessions.slice(0, 3).map((session) => {
                  const isLive = session.status === 'LIVE';
                  const startTime = new Date(session.startTime);

                  return (
                    <div
                      key={session._id}
                      className="p-2.5 rounded-3 border d-flex flex-column gap-1.5"
                      style={{
                        backgroundColor: isLive ? '#fef2f2' : '#f8fafc',
                        borderColor: isLive ? '#fca5a5' : '#e2e8f0'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`badge ${isLive ? 'bg-danger text-white animate-pulse' : 'bg-secondary text-white'}`} style={{ fontSize: '0.62rem' }}>
                          {isLive ? '🔴 LIVE NOW' : session.status}
                        </span>
                        <span className="text-secondary font-mono" style={{ fontSize: '0.68rem' }}>
                          {startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="fw-bold small text-truncate" style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                        {session.title}
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-1 border-top" style={{ borderColor: '#e2e8f0' }}>
                        <span className="text-secondary" style={{ fontSize: '0.68rem' }}>
                          {session.mentor?.name ? `Educator: ${session.mentor.name}` : 'Vishakha Ma\'am'}
                        </span>
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-warning text-dark btn-sm py-0.5 px-2 fw-bold d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.7rem' }}
                        >
                          <Video className="h-3 w-3" /> Join
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
