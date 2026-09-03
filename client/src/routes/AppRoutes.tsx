import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import AdminLogin from '../pages/auth/AdminLogin';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import EmailVerification from '../pages/auth/EmailVerification';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DashboardHome from '../pages/dashboard/DashboardHome';
import Profile from '../pages/dashboard/Profile';
import PlaceholderPage from '../pages/dashboard/PlaceholderPage';
import Landing from '../pages/Landing';
import UserManagement from '../pages/admin/UserManagement';
import StudentManagement from '../pages/admin/StudentManagement';
import StudentDetail from '../pages/admin/StudentDetail';
import MentorManagement from '../pages/admin/MentorManagement';
import MentorDetail from '../pages/admin/MentorDetail';
import CourseManagement from '../pages/admin/CourseManagement';
import CourseDetail from '../pages/admin/CourseDetail';
import BatchManagement from '../pages/admin/BatchManagement';
import BatchDetail from '../pages/admin/BatchDetail';

// Part 4 Examination Imports
import TestManagement from '../pages/admin/TestManagement';
import TestBuilder from '../pages/admin/TestBuilder';
import QuestionBank from '../pages/admin/QuestionBank';
import TestAnalytics from '../pages/admin/TestAnalytics';
import StudentTestList from '../pages/student/StudentTestList';
import StudentTestStart from '../pages/student/StudentTestStart';
import StudentTestRunner from '../pages/student/StudentTestRunner';
import StudentTestResult from '../pages/student/StudentTestResult';

// Part 5 Mentorship & Calendar Imports
import SessionCalendar from '../pages/sessions/SessionCalendar';
import LiveClassroom from '../pages/sessions/LiveClassroom';

// Part 6 Assignments & Announcements Imports
import AssignmentManagement from '../pages/admin/AssignmentManagement';
import StudentAssignmentList from '../pages/student/StudentAssignmentList';
import StudentAssignmentSubmit from '../pages/student/StudentAssignmentSubmit';
import AnnouncementBoard from '../pages/announcements/AnnouncementBoard';

// Part 7 Payments, Invoices, Certificates & Reports Imports
import PricingPlans from '../pages/pricing/PricingPlans';
import BillingHistory from '../pages/billing/BillingHistory';
import StudentCertificates from '../pages/certificates/StudentCertificates';
import CertificateVerification from '../pages/certificates/CertificateVerification';
import AdminReports from '../pages/admin/AdminReports';
import PlanManagement from '../pages/admin/PlanManagement';
import CouponManagement from '../pages/admin/CouponManagement';
import CertificateManagement from '../pages/admin/CertificateManagement';

// Part 8 Analytics Dashboards Imports
import AdminAnalyticsDashboard from '../pages/analytics/AdminAnalyticsDashboard';
import StudentAnalyticsDashboard from '../pages/analytics/StudentAnalyticsDashboard';
import MentorAnalyticsDashboard from '../pages/analytics/MentorAnalyticsDashboard';
import BatchAnalyticsView from '../pages/analytics/BatchAnalyticsView';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Public Auth & Marketing Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<EmailVerification />} />
      <Route path="/pricing" element={<PricingPlans />} />
      <Route path="/verify-certificate/:code" element={<CertificateVerification />} />

      {/* Full-Screen Built-In WebRTC Live Classroom Interface */}
      <Route element={<ProtectedRoute />}>
        <Route path="/live/:sessionId" element={<LiveClassroom />} />
        <Route path="/live" element={<LiveClassroom />} />
      </Route>

      {/* Full-Screen Exam Runner Interface (No Sidebar distraction during test) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/student/tests/:id/attempt/:attemptId" element={<div className="min-h-screen bg-background p-6"><StudentTestRunner /></div>} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route index element={<DashboardHome />} />
                <Route path="profile" element={<Profile />} />
                
                <Route path="batches" element={<BatchManagement />} />
                <Route path="batches/:id" element={<BatchDetail />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="courses/:id" element={<CourseDetail />} />
                <Route path="users" element={<UserManagement />} />

                {/* Examination Routes for Students & Mentors */}
                <Route path="tests" element={<StudentTestList />} />
                <Route path="tests/:id/start" element={<StudentTestStart />} />
                <Route path="tests/:id/result/:attemptId" element={<StudentTestResult />} />
                
                {/* Mentorship & Calendar Routes */}
                <Route path="sessions" element={<SessionCalendar />} />
                <Route path="calendar" element={<SessionCalendar />} />
                <Route path="attendance" element={<SessionCalendar />} />

                {/* Assignments & Announcements Routes */}
                <Route path="assignments" element={<StudentAssignmentList />} />
                <Route path="assignments/:id" element={<StudentAssignmentSubmit />} />
                <Route path="announcements" element={<AnnouncementBoard />} />
                
                {/* Payments, Billing & Credentials Routes */}
                <Route path="pricing" element={<PricingPlans />} />
                <Route path="billing" element={<BillingHistory />} />
                <Route path="certificates" element={<StudentCertificates />} />
                <Route path="analytics" element={<StudentAnalyticsDashboard />} />

                {/* Placeholder Routes for other parts */}
                <Route
                  path="my-courses"
                  element={
                    <PlaceholderPage
                      title="Student Learning Area"
                      description="Access study portals, slide decks, video links, and course modules."
                      nextPart="PART 3: Learning Experience"
                    />
                  }
                />

                {/* Catch-all dashboard subroutes */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          }
        />

        {/* /student/ alias routes for direct URL access */}
        <Route
          path="/student/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="calendar" element={<SessionCalendar />} />
                <Route path="sessions" element={<SessionCalendar />} />
                <Route path="tests" element={<StudentTestList />} />
                <Route path="tests/:id/start" element={<StudentTestStart />} />
                <Route path="tests/:id/result/:attemptId" element={<StudentTestResult />} />
                <Route path="assignments" element={<StudentAssignmentList />} />
                <Route path="assignments/:id" element={<StudentAssignmentSubmit />} />
                <Route path="announcements" element={<AnnouncementBoard />} />
                <Route path="pricing" element={<PricingPlans />} />
                <Route path="billing" element={<BillingHistory />} />
                <Route path="certificates" element={<StudentCertificates />} />
                <Route path="analytics" element={<StudentAnalyticsDashboard />} />
                <Route path="*" element={<Navigate to="/dashboard/assignments" replace />} />
              </Routes>
            </DashboardLayout>
          }
        />

        {/* /mentor/ alias routes for direct URL access */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MENTOR']} />}>
          <Route
            path="/mentor/*"
            element={
              <DashboardLayout>
                <Routes>
                  <Route path="calendar" element={<SessionCalendar />} />
                  <Route path="sessions" element={<SessionCalendar />} />
                  <Route path="assignments" element={<AssignmentManagement />} />
                  <Route path="announcements" element={<AnnouncementBoard />} />
                  <Route path="certificates" element={<CertificateManagement />} />
                  <Route path="analytics" element={<MentorAnalyticsDashboard />} />
                  <Route path="*" element={<Navigate to="/dashboard/assignments" replace />} />
                </Routes>
              </DashboardLayout>
            }
          />
        </Route>
      </Route>

      {/* Protected Admin & Mentor Authoring Routes */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MENTOR']} />}>
        <Route
          path="/admin/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="analytics" element={<AdminAnalyticsDashboard />} />
                <Route path="finance" element={<AdminReports />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="plans" element={<PlanManagement />} />
                <Route path="coupons" element={<CouponManagement />} />
                <Route path="certificates" element={<CertificateManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="mentors" element={<MentorManagement />} />
                <Route path="mentors/:id" element={<MentorDetail />} />
                <Route path="batches" element={<BatchManagement />} />
                <Route path="batches/:id" element={<BatchDetail />} />
                <Route path="batches/:id/analytics" element={<BatchAnalyticsView />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="courses/:id" element={<CourseDetail />} />

                {/* Test & Question Bank Studio */}
                <Route path="tests" element={<TestManagement />} />
                <Route path="tests/create" element={<TestBuilder />} />
                <Route path="tests/:id/edit" element={<TestBuilder />} />
                <Route path="tests/:id/analytics" element={<TestAnalytics />} />
                <Route path="question-bank" element={<QuestionBank />} />

                {/* Mentorship & Calendar */}
                <Route path="calendar" element={<SessionCalendar />} />
                <Route path="sessions" element={<SessionCalendar />} />

                {/* Assignments & Announcements Studio */}
                <Route path="assignments" element={<AssignmentManagement />} />
                <Route path="announcements" element={<AnnouncementBoard />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Route>

      {/* Catch-all global routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
