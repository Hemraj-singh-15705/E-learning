import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setCredentials } from '../../store/authSlice';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserCog, KeyRound } from 'lucide-react';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain uppercase, lowercase, number & symbol'
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  });

type PasswordFields = z.infer<typeof passwordSchema>;

export const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { showToast } = useToast();
  const dispatch = useDispatch();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmitPassword = async (data: PasswordFields) => {
    setPasswordLoading(true);
    try {
      const response = await api.patch('/auth/update-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      const { token, user: updatedUser } = response.data;
      dispatch(setCredentials({ token, user: updatedUser }));

      showToast('Password updated successfully.', 'success');
      resetPasswordForm();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to update password. Verify current credentials.';
      showToast(errMsg, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4 animate-enter text-start" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="p-3.5 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <h1 className="fs-4 fw-black font-display mb-1" style={{ color: '#0f172a' }}>My Profile & Account Settings</h1>
        <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>
          Manage your personal credentials, target teaching exam goals, and account security settings.
        </p>
      </div>

      <div className="row g-3">
        {/* Left Side: Profile Card */}
        <div className="col-12 col-md-4">
          <div className="card h-100 p-4 rounded-4 border shadow-sm text-center d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm border border-warning"
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#0f172a',
                  fontSize: '1.5rem',
                  fontWeight: '900'
                }}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>

              <h4 className="fw-bold fs-6 mb-1" style={{ color: '#0f172a' }}>{user?.name}</h4>
              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 mb-3" style={{ fontSize: '0.68rem' }}>
                {user?.role.replace('_', ' ')}
              </span>

              <div className="text-start p-3 rounded-3 border d-flex flex-column gap-2" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                <div>
                  <div className="text-secondary small fw-semibold" style={{ fontSize: '0.68rem' }}>Registered Email</div>
                  <div className="small fw-bold text-truncate" style={{ fontSize: '0.78rem', color: '#0f172a' }}>{user?.email}</div>
                </div>

                <div>
                  <div className="text-secondary small fw-semibold" style={{ fontSize: '0.68rem' }}>Verification Status</div>
                  <div className="mt-0.5">
                    {user?.isEmailVerified ? (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold" style={{ fontSize: '0.68rem' }}>
                        ✓ Verified Account
                      </span>
                    ) : (
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger fw-bold" style={{ fontSize: '0.68rem' }}>
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                {user?.bio && (
                  <div>
                    <div className="text-secondary small fw-semibold" style={{ fontSize: '0.68rem' }}>Target Goal</div>
                    <div className="small fw-bold text-warning" style={{ fontSize: '0.74rem', color: '#d97706' }}>{user.bio}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-secondary small pt-3 border-top mt-3" style={{ fontSize: '0.68rem', borderColor: '#f1f5f9' }}>
              Vishakha Ma'am Official Teaching Portal
            </div>
          </div>
        </div>

        {/* Right Side: Settings & Change Password */}
        <div className="col-12 col-md-8">
          <div className="d-flex flex-column gap-3">
            {/* Account Details Card */}
            <div className="card p-3.5 rounded-4 border shadow-sm text-start" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                  <UserCog className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="fw-bold fs-6 mb-0" style={{ color: '#0f172a' }}>Student Account Details</h5>
                  <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Profile information and role permissions</div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem' }}>Full Name</label>
                  <input type="text" value={user?.name || ''} readOnly className="form-control form-control-sm" style={{ fontSize: '0.78rem' }} />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem' }}>Email Address</label>
                  <input type="text" value={user?.email || ''} readOnly className="form-control form-control-sm" style={{ fontSize: '0.78rem' }} />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem' }}>Account Role</label>
                  <input type="text" value={user?.role || 'STUDENT'} readOnly className="form-control form-control-sm fw-bold" style={{ fontSize: '0.78rem', color: '#d97706' }} />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem' }}>Portal Status</label>
                  <input type="text" value={user?.status || 'ACTIVE'} readOnly className="form-control form-control-sm text-success fw-bold" style={{ fontSize: '0.78rem' }} />
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="card p-3.5 rounded-4 border shadow-sm text-start" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="fw-bold fs-6 mb-0" style={{ color: '#0f172a' }}>Update Safety Password</h5>
                  <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Ensure your account uses a strong, secure password</div>
                </div>
              </div>

              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="d-flex flex-column gap-3">
                <Input
                  id="currentPassword"
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.currentPassword?.message}
                  {...registerPassword('currentPassword')}
                />

                <Input
                  id="newPassword"
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.newPassword?.message}
                  {...registerPassword('newPassword')}
                />

                <Input
                  id="confirmNewPassword"
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.confirmNewPassword?.message}
                  {...registerPassword('confirmNewPassword')}
                />

                <div className="pt-2">
                  <Button type="submit" size="sm" isLoading={passwordLoading} className="btn btn-warning text-dark fw-bold">
                    <KeyRound className="h-4 w-4 me-1.5" /> Update Account Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
