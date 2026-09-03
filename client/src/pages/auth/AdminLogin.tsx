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
import { ShieldCheck, Sparkles, ArrowLeft, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid administrator or faculty email'),
  password: z.string().min(1, 'Password is required')
});

type LoginFields = z.infer<typeof loginSchema>;

export const AdminLogin: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFields) => {
    setSubmitting(true);
    try {
      const response = await api.post('/auth/login', data);
      const user = response.data.user || response.data.data?.user;
      const token = response.data.token || response.data.data?.token;

      if (user && token) {
        dispatch(setCredentials({ user, token }));
        showToast(`Welcome to Administration Workspace, ${user.name}!`, 'success');
        
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
      const errMsg = error.response?.data?.message || 'Administrative authentication failed. Please verify your credentials.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const quickFill = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <AuthLayout
      title="Admin & Faculty Portal"
      subtitle="Authorized management console for institute administrators, academic heads & mentors"
    >
      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-4 border border-warning border-opacity-25" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
        <div className="d-flex align-items-center gap-2 text-warning">
          <ShieldCheck className="h-5 w-5" />
          <span className="small fw-bold">Full Management Control</span>
        </div>
        <span className="badge bg-warning bg-opacity-25 text-warning small">Batches & Classes</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
        <Input
          id="email"
          label="Staff / Administrator Email"
          type="email"
          placeholder="admin@elearning.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            id="password"
            label="Security Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="d-flex justify-content-end mt-1">
            <Link
              to="/forgot-password"
              className="text-decoration-none small fw-semibold text-warning"
              style={{ fontSize: '0.8rem' }}
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" isLoading={submitting} className="w-100 mt-2 btn-warning text-dark fw-bold">
          <Lock className="h-4 w-4 me-2" />
          Access Admin Dashboard
        </Button>

        {/* Admin Quick Credentials */}
        <div className="mt-3 pt-3 border-top border-secondary text-start">
          <div className="d-flex align-items-center gap-1.5 small fw-bold text-uppercase text-secondary mb-2" style={{ fontSize: '0.7rem' }}>
            <Sparkles className="h-3.5 w-3.5 text-warning" />
            1-Click Administrative Demo Access:
          </div>
          <div className="d-flex flex-column gap-2">
            <button
              type="button"
              onClick={() => quickFill('admin@elearning.com', 'Admin@123456')}
              className="btn btn-sm btn-outline-warning text-start d-flex align-items-center justify-content-between p-2 rounded-3"
            >
              <div>
                <div className="fw-bold small text-white">👑 Super Admin (Full Control)</div>
                <div className="text-secondary" style={{ fontSize: '0.72rem' }}>admin@elearning.com | Manage all batches, faculty, tests & finance</div>
              </div>
              <span className="badge bg-warning text-dark small">Select</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('manager@elearning.com', 'Admin@123456')}
              className="btn btn-sm btn-outline-secondary text-start d-flex align-items-center justify-content-between p-2 rounded-3"
            >
              <div>
                <div className="fw-bold small text-white">💼 Academic Head (Batch & Curriculum)</div>
                <div className="text-secondary" style={{ fontSize: '0.72rem' }}>manager@elearning.com | Manage live schedules & students</div>
              </div>
              <span className="badge bg-secondary text-light small">Select</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('mentor@elearning.com', 'Mentor@123456')}
              className="btn btn-sm btn-outline-primary text-start d-flex align-items-center justify-content-between p-2 rounded-3"
            >
              <div>
                <div className="fw-bold small text-white">👨‍🏫 Master Faculty / Mentor</div>
                <div className="text-secondary" style={{ fontSize: '0.72rem' }}>mentor@elearning.com | Live classes, assignments & grading</div>
              </div>
              <span className="badge bg-primary text-white small">Select</span>
            </button>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-3 text-center border border-secondary" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <p className="small text-secondary mb-2">Are you a student looking to access your enrolled courses?</p>
          <Link to="/login" className="btn btn-sm btn-outline-light w-100 d-inline-flex align-items-center justify-content-center gap-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Switch to Student Login Portal
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
