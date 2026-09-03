import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Menu,
  LogOut,
  User,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Layers,
  FileText,
  Database,
  Megaphone,
  TrendingUp,
  Award,
  CreditCard,
  BarChart3,
  Video,
  X
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import type { RootState } from '../../store';
import { clearCredentials } from '../../store/authSlice';
import api from '../../utils/api';
import { useToast } from '../ui/Toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(clearCredentials());
      showToast('Logged out successfully.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast('Failed to logout. Please try again.', 'error');
    }
  };

  const roleLabels = {
    SUPER_ADMIN: '👑 Super Admin',
    ADMIN: '💼 Academic Head',
    MENTOR: '👨‍🏫 Faculty Mentor',
    STUDENT: '🎓 Aspirant Student'
  };

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Overview & Study Room', icon: <LayoutDashboard className="h-4 w-4" /> },
      { path: '/dashboard/profile', label: 'My Profile & Goal', icon: <User className="h-4 w-4" /> }
    ];

    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      return [
        ...baseItems,
        { path: '/admin/analytics', label: 'Platform Analytics', icon: <BarChart3 className="h-4 w-4 text-warning" /> },
        { path: '/admin/finance', label: 'Financial Analytics', icon: <TrendingUp className="h-4 w-4 text-success" /> },
        { path: '/admin/batches', label: 'Batches Management', icon: <Layers className="h-4 w-4 text-primary" /> },
        { path: '/admin/courses', label: 'Course Curriculum', icon: <BookOpen className="h-4 w-4 text-info" /> },
        { path: '/admin/tests', label: 'Test Series & CBT', icon: <FileText className="h-4 w-4 text-warning" /> },
        { path: '/admin/question-bank', label: 'Question Bank', icon: <Database className="h-4 w-4 text-danger" /> },
        { path: '/admin/students', label: 'Students Directory', icon: <GraduationCap className="h-4 w-4 text-success" /> },
        { path: '/admin/mentors', label: 'Faculty Directory', icon: <Users className="h-4 w-4 text-primary" /> },
        { path: '/dashboard/sessions', label: 'Live Classes Schedule', icon: <Calendar className="h-4 w-4 text-danger" /> },
        { path: '/admin/users', label: 'Roles & Staff Access', icon: <Settings className="h-4 w-4 text-secondary" /> }
      ];
    }

    if (user?.role === 'MENTOR') {
      return [
        ...baseItems,
        { path: '/mentor/sessions', label: 'My Live Lectures', icon: <Video className="h-4 w-4 text-danger" /> },
        { path: '/mentor/assignments', label: 'DPP & Assignment Reviews', icon: <ClipboardList className="h-4 w-4 text-primary" /> },
        { path: '/dashboard/sessions', label: 'Teaching Schedule', icon: <Calendar className="h-4 w-4 text-warning" /> },
        { path: '/dashboard/announcements', label: 'Announcements Board', icon: <Megaphone className="h-4 w-4 text-info" /> }
      ];
    }

    // Default: Student Nav Items (STRICTLY student only!)
    return [
      ...baseItems,
      { path: '/dashboard/sessions', label: 'Live Classes & Timetable', icon: <Video className="h-4 w-4 text-danger" /> },
      { path: '/student/tests', label: 'CBT Mock Tests & DPP', icon: <FileText className="h-4 w-4 text-warning" /> },
      { path: '/dashboard/assignments', label: 'Daily Practice Worksheets', icon: <ClipboardList className="h-4 w-4 text-primary" /> },
      { path: '/dashboard/certificates', label: 'Course Certificates', icon: <Award className="h-4 w-4 text-success" /> },
      { path: '/student/billing', label: 'Fee Invoices & Receipts', icon: <CreditCard className="h-4 w-4 text-info" /> },
      { path: '/dashboard/announcements', label: 'Exam Updates & Notices', icon: <Megaphone className="h-4 w-4 text-warning" /> }
    ];
  };

  const navItems = getNavItems();

  return (
    <div
      className="d-flex min-vh-100 position-relative"
      style={{
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        minHeight: '100vh'
      }}
    >
      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`d-flex flex-column border-end position-sticky top-0 transition-all ${
          sidebarOpen ? 'd-flex position-fixed start-0 top-0 h-100 shadow-lg' : 'd-none d-lg-flex'
        }`}
        style={{
          width: '270px',
          height: '100vh',
          zIndex: 1050,
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0'
        }}
      >
        {/* Brand Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: '#e2e8f0' }}>
          <Link to="/" className="d-flex align-items-center gap-2.5 text-decoration-none">
            <div className="p-1.5 rounded-3 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <GraduationCap className="h-5 w-5 text-dark" />
            </div>
            <div className="d-flex flex-column text-start">
              <span className="fw-black fs-6 tracking-tight font-display lh-1" style={{ color: '#0f172a' }}>
                Vishakha Ma'am<span style={{ color: '#d97706' }}> Official</span>
              </span>
              <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.58rem', letterSpacing: '0.05em' }}>
                Teaching Exam Portal
              </span>
            </div>
          </Link>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="btn btn-sm btn-outline-secondary d-lg-none p-1"
            >
              <X className="h-4 w-4 text-dark" />
            </button>
          )}
        </div>

        {/* User Role Strip */}
        <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: '#fefce8', borderColor: '#e2e8f0' }}>
          <span className="text-secondary small fw-semibold" style={{ fontSize: '0.7rem' }}>Active Role</span>
          <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.66rem' }}>
            {user ? roleLabels[user.role] : 'Student'}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-grow-1 p-2.5 d-flex flex-column gap-1 overflow-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 text-start small fw-semibold transition-all text-decoration-none ${
                  isActive
                    ? 'text-dark fw-bold shadow-sm'
                    : 'text-secondary hover-bg-light'
                }`}
                style={{
                  fontSize: '0.82rem',
                  backgroundColor: isActive ? '#fef3c7' : 'transparent',
                  border: isActive ? '1px solid #fde68a' : '1px solid transparent',
                  color: isActive ? '#78350f' : '#475569'
                }}
              >
                {item.icon}
                <span style={{ color: isActive ? '#92400e' : '#334155' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-top d-flex flex-column gap-2" style={{ borderColor: '#e2e8f0' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-1.5 rounded-3 fw-bold py-1.5 w-100"
            style={{ fontSize: '0.78rem' }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-grow-1 d-flex flex-column min-vh-100 overflow-hidden position-relative" style={{ backgroundColor: '#f8fafc' }}>
        {/* Top Navbar */}
        <header
          className="navbar navbar-expand border-bottom px-3 px-md-4 py-2 sticky-top"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            zIndex: 90
          }}
        >
          <button
            type="button"
            className="btn btn-outline-secondary d-lg-none me-2 p-1.5"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4 text-dark" />
          </button>

          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-semibold d-none d-sm-inline" style={{ fontSize: '0.78rem' }}>
              Academic Portal /
            </span>
            <span className="text-dark small fw-bold" style={{ fontSize: '0.78rem' }}>
              {navItems.find((n) => n.path === location.pathname)?.label || 'Study Room'}
            </span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2.5">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Pill Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="btn btn-sm btn-light border d-flex align-items-center gap-2 py-1 px-2.5 rounded-pill shadow-sm"
                style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold"
                  style={{
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    fontSize: '0.65rem'
                  }}
                >
                  {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                </div>
                <span className="text-dark small fw-bold d-none d-md-inline" style={{ fontSize: '0.78rem' }}>
                  {user?.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-secondary" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="position-absolute end-0 mt-2 py-2 w-56 rounded-3 shadow-lg border text-start"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    zIndex: 100,
                    minWidth: '220px'
                  }}
                >
                  <div className="px-3 py-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                    <div className="fw-bold text-dark small">{user?.name}</div>
                    <div className="text-secondary small text-truncate" style={{ fontSize: '0.72rem' }}>{user?.email}</div>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="dropdown-item px-3 py-2 small d-flex align-items-center gap-2 text-dark"
                  >
                    <User className="h-4 w-4 text-warning" /> My Profile & Goal
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item px-3 py-2 small d-flex align-items-center gap-2 text-danger border-top"
                    style={{ borderColor: '#f1f5f9' }}
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Children / Viewport */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
