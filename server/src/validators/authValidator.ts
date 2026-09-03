import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    role: z
      .enum(['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'STUDENT'], {
        errorMap: () => ({ message: 'Invalid user role specified' })
      })
      .optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
  }),
  params: z.object({
    token: z.string({ required_error: 'Reset token is required' })
  })
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Current password is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
  })
});
