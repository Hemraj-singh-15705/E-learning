import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import AuthLayout from '../../components/layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain an uppercase letter, lowercase letter, number, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data: ResetPasswordFields) => {
    if (!token) {
      showToast('Reset token is missing from the URL.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: data.password
      });

      const { user, token: accessToken } = response.data;
      dispatch(setCredentials({ user, token: accessToken }));
      showToast('Password reset successfully. You are now logged in.', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to reset password. The link may have expired.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Ensure your new password contains uppercase, lowercase, numbers, and symbols"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input
          id="password"
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" isLoading={submitting} className="w-full mt-2">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
