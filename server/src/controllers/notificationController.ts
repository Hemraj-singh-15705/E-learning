import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { AppError } from '../utils/errors';

// 1. Get Logged-in User's Notifications
export const getMyNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = '30', page = '1' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false })
    ]);

    res.status(200).json({
      status: 'success',
      totalCount,
      unreadCount,
      data: {
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mark Single Notification as Read
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid notification ID', 400));
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mark All Notifications as Read
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Single Notification
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid notification ID', 400));
    }

    const result = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!result) {
      return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// 5. Clear All Notifications
export const clearAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    await Notification.deleteMany({ recipient: userId });

    res.status(200).json({
      status: 'success',
      message: 'All notifications cleared'
    });
  } catch (error) {
    next(error);
  }
};
