import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Announcement from '../models/Announcement';
import Enrollment from '../models/Enrollment';
import Batch from '../models/Batch';
import User from '../models/User';
import { AppError } from '../utils/errors';
import { createBulkNotifications } from '../utils/notificationHelper';

// 1. Get Announcements (Role & Audience-filtered)
export const getAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { batchId, courseId, targetAudience, status, page = '1', limit = '15' } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const filter: any = {};

    if (userRole === 'STUDENT') {
      // Find batches where student is actively enrolled
      const enrollments = await Enrollment.find({
        student: userId,
        status: 'ACTIVE'
      }).select('batch');
      const studentBatchIds = enrollments.map((e) => e.batch);

      filter.status = 'PUBLISHED';
      filter.$or = [
        { targetAudience: 'ALL' },
        { targetAudience: 'STUDENTS' },
        { targetAudience: 'BATCH', batch: { $in: studentBatchIds } }
      ];
    } else if (userRole === 'MENTOR') {
      // Mentor view
      const mentorBatches = await Batch.find({
        mentors: userId
      }).select('_id');
      const mentorBatchIds = mentorBatches.map((b) => b._id);

      filter.status = 'PUBLISHED';
      filter.$or = [
        { targetAudience: 'ALL' },
        { targetAudience: 'MENTORS' },
        { targetAudience: 'BATCH', batch: { $in: mentorBatchIds } },
        { author: userId }
      ];
    } else {
      // Admin / Super Admin
      if (status && status !== 'ALL') filter.status = status;
      if (targetAudience && targetAudience !== 'ALL') filter.targetAudience = targetAudience;
      if (batchId) filter.batch = batchId;
      if (courseId) filter.course = courseId;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [announcements, totalCount] = await Promise.all([
      Announcement.find(filter)
        .populate('author', 'name email avatar role')
        .populate('batch', 'name code')
        .populate('course', 'title slug')
        .sort({ isPinned: -1, publishAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Announcement.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      data: {
        announcements
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Announcement
export const getAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid announcement ID format', 400));
    }

    const announcement = await Announcement.findById(id)
      .populate('author', 'name email avatar role')
      .populate('batch', 'name code')
      .populate('course', 'title slug')
      .lean();

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        announcement
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Announcement
export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      content,
      targetAudience = 'ALL',
      batch,
      course,
      isPinned = false,
      status = 'PUBLISHED'
    } = req.body;

    const userId = req.user?.id;

    if (!title || !content) {
      return next(new AppError('Title and content are required', 400));
    }

    const announcement = await Announcement.create({
      title,
      content,
      author: userId,
      targetAudience,
      batch: batch || undefined,
      course: course || undefined,
      isPinned: Boolean(isPinned),
      status,
      publishAt: new Date()
    });

    // Notify targeted audience if published
    if (status === 'PUBLISHED') {
      let recipientIds: any[] = [];

      if (targetAudience === 'BATCH' && batch) {
        const enrollments = await Enrollment.find({ batch, status: 'ACTIVE' }).select(
          'student'
        );
        recipientIds = enrollments.map((e) => e.student);
      } else if (targetAudience === 'STUDENTS') {
        const students = await User.find({ role: 'STUDENT', status: 'ACTIVE' }).select(
          '_id'
        );
        recipientIds = students.map((s) => s._id);
      } else if (targetAudience === 'MENTORS') {
        const mentors = await User.find({ role: 'MENTOR', status: 'ACTIVE' }).select(
          '_id'
        );
        recipientIds = mentors.map((m) => m._id);
      } else if (targetAudience === 'ALL') {
        const users = await User.find({ status: 'ACTIVE' }).select('_id');
        recipientIds = users.map((u) => u._id);
      }

      await createBulkNotifications(recipientIds, {
        type: 'ANNOUNCEMENT_PUBLISHED',
        title: 'New Announcement',
        message: announcement.title,
        link: '/dashboard/announcements'
      });
    }

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name email avatar role')
      .populate('batch', 'name code')
      .populate('course', 'title slug');

    res.status(201).json({
      status: 'success',
      message: 'Announcement published successfully',
      data: {
        announcement: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Announcement
export const updateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid announcement ID format', 400));
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      announcement.author.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to edit this announcement', 403));
    }

    const { title, content, targetAudience, batch, course, isPinned, status } = req.body;

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (batch !== undefined) announcement.batch = batch || undefined;
    if (course !== undefined) announcement.course = course || undefined;
    if (isPinned !== undefined) announcement.isPinned = Boolean(isPinned);
    if (status !== undefined) announcement.status = status;

    await announcement.save();

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name email avatar role')
      .populate('batch', 'name code')
      .populate('course', 'title slug');

    res.status(200).json({
      status: 'success',
      message: 'Announcement updated successfully',
      data: {
        announcement: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Announcement
export const deleteAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      announcement.author.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to delete this announcement', 403));
    }

    await Announcement.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
