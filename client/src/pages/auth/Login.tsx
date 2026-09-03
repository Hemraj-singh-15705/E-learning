import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import AuthLayout from '../../components/layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {
  Sparkles,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  UserPlus
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid student email address'),
  password: z.string().min(1, 'Password is required')
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    targetExam: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type LoginFields = z.infer<typeof loginSchema>;
type SignupFields = z.infer<typeof signupSchema>;

export const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors }
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema)
  });

  // Signup Form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors }
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      targetExam: 'DSSSB TGT Math'
    }
  });

  const onLoginSubmit = async (data: LoginFields) => {
    setSubmitting(true);
    try {
      const response = await api.post('/auth/login', data);
      const user = response.data.user || response.data.data?.user;
      const token = response.data.token || response.data.data?.token;

      if (user && token) {
        dispatch(setCredentials({ user, token }));
        showToast(`Welcome back, ${user.name}!`, 'success');

        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          navigate('/admin/analytics');
        } else if (user.role === 'MENTOR') {
          navigate('/mentor/sessions');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error('Invalid authentication response.');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupFields) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'STUDENT',
        bio: `Teaching Aspirant - Target: ${data.targetExam || 'DSSSB / CTET'}`
      };

      const response = await api.post('/auth/register', payload);
      const user = response.data.user || response.data.data?.user;
      const token = response.data.token || response.data.data?.token;

      if (user && token) {
        dispatch(setCredentials({ user, token }));
        showToast(`Welcome to Vishakha Ma'am Classroom, ${user.name}!`, 'success');
        navigate('/dashboard');
      } else {
        showToast('Account created successfully! You can now log in.', 'success');
        setAuthMode('login');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const quickFillStudent = () => {
    setLoginValue('email', 'student@elearning.com');
    setLoginValue('password', 'Student@123456');
    showToast('Demo student credentials filled!', 'info');
  };

  return (
    <AuthLayout
      title={authMode === 'login' ? 'Student Study Room' : 'New Aspirant Sign Up'}
      subtitle={
        authMode === 'login'
          ? 'Access live lectures with Vishakha Ma\'am, attempt CBT mock tests & download DPP notes'
          : 'Create your free student account to join live teaching batches, DPP practice & test series'
      }
    >
      {/* Mode Switcher Tabs */}
      <div className="p-1 rounded-3 mb-4 d-flex border border-secondary" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 transition-all d-inline-flex align-items-center justify-content-center gap-1.5 ${
            authMode === 'login'
              ? 'btn-warning text-dark shadow-sm'
              : 'text-secondary border-0 bg-transparent'
          }`}
          style={{ fontSize: '0.82rem' }}
        >
          <GraduationCap className="h-4 w-4" /> Student Sign In
        </button>

        <button
          type="button"
          onClick={() => setAuthMode('signup')}
          className={`btn btn-sm flex-fill fw-bold rounded-2 py-2 transition-all d-inline-flex align-items-center justify-content-center gap-1.5 ${
            authMode === 'signup'
              ? 'btn-warning text-dark shadow-sm'
              : 'text-secondary border-0 bg-transparent'
          }`}
          style={{ fontSize: '0.82rem' }}
        >
          <UserPlus className="h-4 w-4" /> New Sign Up
        </button>
      </div>

      {/* LOGIN TAB */}
      {authMode === 'login' && (
        <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="d-flex flex-column gap-3 text-start">
          <Input
            id="login-email"
            label="Registered Student Email"
            type="email"
            placeholder="e.g. student@elearning.com"
            error={loginErrors.email?.message}
            {...registerLogin('email')}
          />

          <div>
            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              error={loginErrors.password?.message}
              {...registerLogin('password')}
            />
            <div className="d-flex justify-content-end mt-1">
              <Link
                to="/forgot-password"
                className="text-decoration-none small text-warning"
                style={{ fontSize: '0.78rem' }}
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" isLoading={submitting} className="w-100 mt-2 btn-warning text-dark fw-bold">
            <BookOpen className="h-4 w-4 me-2" />
            Enter Student Classroom
          </Button>

          {/* 1-Click Demo Student Access */}
          <div className="mt-2 pt-3 border-top border-secondary text-start">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Instant Preview Access
              </span>
              <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-40" style={{ fontSize: '0.65rem' }}>
                Verified Demo Student
              </span>
            </div>

            <button
              type="button"
              onClick={quickFillStudent}
              className="btn btn-outline-warning w-100 btn-sm py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              style={{ fontSize: '0.82rem' }}
            >
              <Sparkles className="h-4 w-4 text-warning" />
              1-Click Fill Demo Student (Rahul Sharma)
            </button>
          </div>
        </form>
      )}

      {/* SIGNUP TAB */}
      {authMode === 'signup' && (
        <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="d-flex flex-column gap-3 text-start">
          <Input
            id="signup-name"
            label="Full Name"
            type="text"
            placeholder="e.g. Pooja Rawat"
            error={signupErrors.name?.message}
            {...registerSignup('name')}
          />

          <Input
            id="signup-email"
            label="Email Address"
            type="email"
            placeholder="e.g. pooja@gmail.com"
            error={signupErrors.email?.message}
            {...registerSignup('email')}
          />

          <div>
            <label className="form-label text-slate-300 small fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Target Teaching Exam
            </label>
            <select
              className="form-select bg-dark text-light border-secondary"
              style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
              {...registerSignup('targetExam')}
            >
              <option value="DSSSB TGT/PGT Math">DSSSB TGT / PGT Mathematics</option>
              <option value="CTET 2026 Paper 1 & 2">CTET 2026 (Paper 1 & Paper 2)</option>
              <option value="BPSC TRE 4.0 Bihar">BPSC TRE 4.0 / 5.0 Bihar Teacher</option>
              <option value="KVS / NVS PRT & TGT">KVS / NVS Complete Selection</option>
              <option value="SUPER TET 2.0 UP">SUPER TET 2.0 & UP TGT</option>
              <option value="Teaching Mahapack">Teaching Mahapack (All Exams)</option>
            </select>
          </div>

          <Input
            id="signup-password"
            label="Create Password (Min 6 Characters)"
            type="password"
            placeholder="••••••••"
            error={signupErrors.password?.message}
            {...registerSignup('password')}
          />

          <Input
            id="signup-confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={signupErrors.confirmPassword?.message}
            {...registerSignup('confirmPassword')}
          />

          <Button type="submit" size="lg" isLoading={submitting} className="w-100 mt-2 btn-warning text-dark fw-bold">
            <UserPlus className="h-4 w-4 me-2" />
            Create Free Account & Enter
          </Button>

          <p className="text-secondary small text-center mb-0 mt-1" style={{ fontSize: '0.72rem' }}>
            By registering, you agree to Vishakha Ma'am Terms of Service & Privacy Policy.
          </p>
        </form>
      )}

      {/* Bottom Faculty & Admin Login Link */}
      <div className="mt-4 pt-3 border-top border-secondary text-center">
        <div className="text-secondary small mb-1" style={{ fontSize: '0.75rem' }}>
          Are you a Faculty Educator or Platform Admin?
        </div>
        <Link
          to="/admin/login"
          className="text-warning text-decoration-none fw-bold small d-inline-flex align-items-center gap-1 hover:underline"
          style={{ fontSize: '0.8rem' }}
        >
          <ShieldCheck className="h-4 w-4" />
          Access Admin & Faculty Console <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
