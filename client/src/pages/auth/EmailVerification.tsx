import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { setCredentials } from '../../store/authSlice';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import AuthLayout from '../../components/layouts/AuthLayout';

export const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const verifyTriggered = useRef(false);

  useEffect(() => {
    // Avoid double trigger in React StrictMode
    if (verifyTriggered.current) return;
    verifyTriggered.current = true;

    const verifyToken = async () => {
      if (!token) {
        setStatus('failed');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        const { user, token: accessToken } = response.data;
        
        dispatch(setCredentials({ user, token: accessToken }));
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        showToast('Account verified successfully!', 'success');
        
        // Auto-redirect to dashboard after 2.5 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2500);
      } catch (error: any) {
        setStatus('failed');
        const errMsg = error.response?.data?.message || 'Verification link is invalid or has expired.';
        setMessage(errMsg);
        showToast(errMsg, 'error');
      }
    };

    verifyToken();
  }, [token, dispatch, navigate, showToast]);

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Confirming your user status in our database"
    >
      <div className="flex flex-col items-center justify-center p-6 text-center gap-6">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-enter">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl">
              {message}
            </p>
            <p className="text-xs text-muted-foreground animate-pulse">
              Redirecting you to dashboard shortly...
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4 animate-enter">
            <XCircle className="h-12 w-12 text-rose-400" />
            <p className="text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl">
              {message}
            </p>
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline mt-2">
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
