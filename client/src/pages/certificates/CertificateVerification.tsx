import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  ShieldCheck,
  AlertCircle,
  Search,
  GraduationCap
} from 'lucide-react';
import type { ICertificate } from '../../types/certificate';

export const CertificateVerification: React.FC = () => {
  const { code: paramCode } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [searchCode, setSearchCode] = useState(paramCode || '');
  const [certificate, setCertificate] = useState<ICertificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramCode) {
      handleVerify(paramCode);
    }
  }, [paramCode]);

  const handleVerify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/certificates/verify/${codeToVerify.trim()}`);
      if (res.data.status === 'success' && res.data.isValid) {
        setCertificate(res.data.data.certificate);
      } else {
        setCertificate(null);
        setError(res.data.message || 'Certificate record not found.');
      }
    } catch (err: any) {
      setCertificate(null);
      setError(err.response?.data?.message || 'Invalid or unrecognized certificate verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      navigate(`/verify-certificate/${searchCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">
            Mentorship.AI
          </span>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="text-xs">
          Sign In
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-8 items-center justify-center my-6">
        {/* Verification Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20 mb-1">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Public Credential Verification Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg">
            Verify the authenticity of graduation certificates issued by Mentorship.AI Academy with real-time cryptographic validation.
          </p>
        </div>

        {/* Verification Search Bar */}
        <form onSubmit={handleSubmitSearch} className="w-full max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter Verification Code (e.g. VER-8A3F9C-2026)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
          <Button type="submit" disabled={loading || !searchCode.trim()} className="shadow-premium">
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        {/* Verification Result Card */}
        {loading ? (
          <LoadingState message="Verifying credential authenticity against institutional ledger..." />
        ) : error ? (
          <Card className="w-full max-w-xl border-rose-500/30 bg-rose-950/10 shadow-premium animate-enter">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-rose-500/20 text-rose-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="font-display text-lg font-bold text-rose-300">
                Invalid or Unverified Credential
              </h3>
              <p className="text-xs text-slate-300 max-w-sm">
                {error}
              </p>
            </CardContent>
          </Card>
        ) : certificate ? (
          <Card className="w-full max-w-xl border-emerald-500/30 bg-card shadow-2xl animate-enter overflow-hidden">
            {/* Validated Header Banner */}
            <div className="bg-emerald-950/30 border-b border-emerald-500/20 p-5 flex items-center justify-between text-emerald-400">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Officially Verified & Authentic Credential</span>
              </div>
              <Badge variant="success" className="font-bold text-[10px]">
                {certificate.status}
              </Badge>
            </div>

            <CardContent className="p-6 flex flex-col gap-5">
              {/* Recipient info */}
              <div className="flex flex-col gap-1 text-center py-2 border-b border-border">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Recipient Name
                </span>
                <span className="font-display text-2xl font-black text-foreground">
                  {certificate.student?.name}
                </span>
              </div>

              {/* Course Title */}
              <div className="flex flex-col gap-1 text-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Program Completed
                </span>
                <span className="font-display text-lg font-bold text-primary">
                  {certificate.course?.title || certificate.batch?.name || 'Advanced Engineering Track'}
                </span>
              </div>

              {/* Credential Data Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/30 rounded-xl border border-border text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Certificate Number:</span>
                  <span className="font-mono font-bold text-foreground">
                    {certificate.certificateNumber}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-muted-foreground">Verification Code:</span>
                  <span className="font-mono font-bold text-primary">
                    {certificate.verificationCode}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-mono text-foreground">
                    {new Date(certificate.issueDate).toLocaleDateString([], {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-muted-foreground">Issuing Authority:</span>
                  <span className="font-bold text-foreground">
                    Mentorship.AI Academy
                  </span>
                </div>
              </div>

              {/* Evaluation summary */}
              {certificate.completionData && (
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                  <span className="text-emerald-300 font-medium">Evaluation Standing:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    Grade {certificate.completionData.grade || 'A+'} ({certificate.completionData.score || 100}%)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-card">
        &copy; {new Date().getFullYear()} Mentorship.AI Inc. All rights reserved. Secure Credential Verification Protocol.
      </footer>
    </div>
  );
};

export default CertificateVerification;
