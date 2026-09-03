import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, CheckCircle2, Award, BookOpen } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="container-fluid min-vh-100 d-flex p-0 position-relative overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      <div className="row g-0 w-100 min-vh-100 position-relative" style={{ zIndex: 10 }}>
        {/* Form Column */}
        <div className="col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-sm-5">
          <div>
            {/* Top Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Link to="/" className="d-flex align-items-center gap-2.5 text-decoration-none">
                <div className="p-1.5 rounded-3 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <GraduationCap className="h-5 w-5 text-dark" />
                </div>
                <div className="d-flex flex-column text-start">
                  <span className="fw-black fs-5 tracking-tight font-display lh-1" style={{ color: '#0f172a' }}>
                    Vishakha Ma'am<span style={{ color: '#d97706' }}> Official</span>
                  </span>
                  <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                    Teaching Exam Portal
                  </span>
                </div>
              </Link>
              <Link to="/" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 small text-decoration-none py-1 px-3">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
              </Link>
            </div>

            {/* Auth Card Container */}
            <div className="mx-auto" style={{ maxWidth: '460px' }}>
              <div className="mb-3 text-start">
                <h2 className="fw-black mb-1 font-display" style={{ color: '#0f172a', fontSize: '1.75rem' }}>{title}</h2>
                <p className="text-secondary small" style={{ fontSize: '0.84rem' }}>{subtitle}</p>
              </div>

              <div
                className="card p-4 p-sm-4 border shadow-sm"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '1.25rem'
                }}
              >
                {children}
              </div>
            </div>
          </div>

          <div className="text-center text-secondary small mt-4" style={{ fontSize: '0.74rem' }}>
            © {new Date().getFullYear()} Vishakha Ma'am Official • Leading Indian Teaching Recruitment Portal
          </div>
        </div>

        {/* Brand Side Column */}
        <div
          className="d-none d-lg-flex col-lg-6 p-5 flex-column justify-content-between text-start"
          style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%)',
            borderLeft: '1px solid #fde68a'
          }}
        >
          <div className="my-auto" style={{ maxWidth: '520px' }}>
            <span className="badge bg-warning text-dark fw-bold px-3 py-1 mb-3 text-uppercase" style={{ fontSize: '0.72rem' }}>
              🏆 India's #1 Teaching Exam Mentor
            </span>

            <h2 className="display-6 fw-black mb-3 font-display" style={{ color: '#78350f' }}>
              Crack DSSSB, CTET, KVS & BPSC with Top Ranks
            </h2>

            <p className="mb-4" style={{ color: '#92400e', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Join structured live interactive batches by Vishakha Ma'am (Gold Medalist in Mathematics). Master high-yield shortcut formulas, solve daily DPPs, and take real CBT mock tests.
            </p>

            <div className="d-flex flex-column gap-2.5">
              <div className="d-flex align-items-center gap-2 p-2.5 rounded-3 bg-white bg-opacity-80 border border-warning border-opacity-30 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-warning shrink-0" />
                <span className="small fw-bold" style={{ color: '#78350f' }}>
                  Live 2-Way Audio Doubt Solving in Every Lecture
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 p-2.5 rounded-3 bg-white bg-opacity-80 border border-warning border-opacity-30 shadow-sm">
                <Award className="h-5 w-5 text-warning shrink-0" />
                <span className="small fw-bold" style={{ color: '#78350f' }}>
                  1,00,000+ Aspirants Mentored with Proven Selections
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 p-2.5 rounded-3 bg-white bg-opacity-80 border border-warning border-opacity-30 shadow-sm">
                <BookOpen className="h-5 w-5 text-warning shrink-0" />
                <span className="small fw-bold" style={{ color: '#78350f' }}>
                  Handwritten Formula Booklets & Class Notes Included
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-4 border-top" style={{ borderColor: 'rgba(120, 53, 15, 0.15)' }}>
            <span className="small fw-semibold" style={{ color: '#78350f' }}>Official YouTube: @vishakhamam_official</span>
            <span className="badge bg-dark text-warning fw-bold px-2 py-1">50,000+ Selected Teachers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
