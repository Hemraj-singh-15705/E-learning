import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../utils/errors';

export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully.',
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      next(new AppError('User not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;
    const currentUser = req.user;

    if (!currentUser) {
      next(new AppError('User authentication details not found.', 401));
      return;
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      next(new AppError('User to update not found.', 404));
      return;
    }

    // Authorization checks:
    // Only administrators or the user themselves can modify records
    const isSelf = currentUser.id === userToUpdate.id;
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    if (!isSelf && !isAdmin) {
      next(new AppError('You do not have permission to modify this profile.', 403));
      return;
    }

    const { name, phone, bio, avatar, role, status, permissions } = req.body;

    // Self-update filters (standard user profile changes)
    if (isSelf) {
      if (name) userToUpdate.name = name;
      if (phone) userToUpdate.phone = phone;
      if (bio !== undefined) userToUpdate.bio = bio;
      if (avatar !== undefined) userToUpdate.avatar = avatar;
    }

    // Admin updates (can alter roles, statuses, permissions)
    if (isAdmin) {
      if (name && !isSelf) userToUpdate.name = name;
      if (role) userToUpdate.role = role;
      if (status) userToUpdate.status = status;
      if (permissions) userToUpdate.permissions = permissions;
    }

    await userToUpdate.save();

    // Remove password before sending
    const updatedRecord = await User.findById(userToUpdate.id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedRecord }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userToDelete = await User.findByIdAndDelete(req.params.id);
    if (!userToDelete) {
      next(new AppError('User not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
