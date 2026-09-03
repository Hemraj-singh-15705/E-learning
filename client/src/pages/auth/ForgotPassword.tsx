import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import AuthLayout from '../../components/layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', data);
      showToast(response.data.message || 'If the email exists, a password reset link has been sent.', 'success');
      setSuccess(true);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to submit forgot password request.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link"
    >
      {success ? (
        <div className="flex flex-col gap-6 text-center">
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-400 text-sm">
            If the account exists, we have printed the recovery URL to the backend logs. Please check the backend console terminal.
          </div>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            id="email"
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" isLoading={submitting} className="w-full mt-2">
            Send Reset Link
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
