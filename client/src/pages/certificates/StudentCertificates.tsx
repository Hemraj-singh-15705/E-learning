import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  Award,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import type { ICertificate } from '../../types/certificate';

export const StudentCertificates: React.FC = () => {
  const { showToast } = useToast();

  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/certificates/my-certificates');
      setCertificates(res.data.data.certificates || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading your credentials..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCertificates} />;

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
            Official Credentials & Badges
          </span>
        </div>

        <h1 className="fw-black display-6 mb-1 font-display" style={{ color: '#78350f' }}>
          Certificates & Course Credentials
        </h1>

        <p className="small mb-0" style={{ maxWidth: '680px', fontSize: '0.88rem', color: '#92400e', lineHeight: '1.5' }}>
          Verified course completion certificates and teaching batch achievements certified by Vishakha Ma'am Academy.
        </p>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="card p-5 rounded-4 border text-center shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning d-inline-block mx-auto mb-3">
            <Award className="h-8 w-8" />
          </div>
          <h4 className="fw-bold fs-5 mb-1" style={{ color: '#0f172a' }}>No Certificates Issued Yet</h4>
          <p className="text-secondary small max-w-md mx-auto mb-3" style={{ fontSize: '0.82rem' }}>
            Complete your batch syllabus, attend 80%+ live sessions, and pass the final CBT assessment to unlock your official verified certificate.
          </p>
          <div>
            <a href="/dashboard/sessions" className="btn btn-warning text-dark btn-sm fw-bold px-3 py-1.5">
              Attend Live Classes
            </a>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {certificates.map((cert) => {
            const issueDate = new Date(cert.issueDate);
            const courseTitle = cert.course?.title || cert.batch?.name || 'Teaching Program Completion';

            return (
              <div key={cert._id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 p-3.5 rounded-4 border shadow-sm d-flex flex-column justify-content-between text-start card-hover" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold" style={{ fontSize: '0.65rem' }}>
                        <ShieldCheck className="h-3 w-3 me-1" /> {cert.status}
                      </span>
                      <span className="font-mono text-secondary small" style={{ fontSize: '0.68rem' }}>
                        {cert.certificateNumber}
                      </span>
                    </div>

                    <h5 className="fw-bold fs-6 mb-1" style={{ color: '#0f172a' }}>{courseTitle}</h5>
                    <div className="text-secondary small mb-3" style={{ fontSize: '0.72rem' }}>
                      Awarded to: <strong style={{ color: '#0f172a' }}>{cert.student?.name || 'Student'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                    <div className="text-secondary small" style={{ fontSize: '0.68rem' }}>
                      Issued: {issueDate.toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => showToast(`Certificate #${cert.certificateNumber} verified!`, 'success')}
                      className="btn btn-warning text-dark btn-sm fw-bold py-1 px-2.5"
                      style={{ fontSize: '0.72rem' }}
                    >
                      View Certificate
                    </button>
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

export default StudentCertificates;
