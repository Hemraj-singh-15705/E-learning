import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import MentorshipSession from '../models/MentorshipSession';
import Attendance from '../models/Attendance';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { AppError } from '../utils/errors';

// 1. Get Sessions (Role-aware calendar & list queries)
export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      status,
      type,
      mentorId,
      batchId,
      courseId,
      search
    } = req.query;

    const userRole = req.user?.role;
    const userId = req.user?.id;

    const filter: any = {};

    // Date range filter for calendar views
    if (startDate && endDate) {
      filter.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.startTime = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.endTime = { $lte: new Date(endDate as string) };
    }

    if (status) {
      if (status !== 'ALL') {
        filter.status = status;
      }
    }

    if (type) {
      if (type !== 'ALL') {
        filter.type = type;
      }
    }

    if (batchId) {
      filter.batch = batchId;
    }

    if (courseId) {
      filter.course = courseId;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } }
      ];
    }

    // Role-specific constraints
    if (userRole === 'STUDENT') {
      // Find batches where student is actively enrolled
      const enrollments = await Enrollment.find({
        student: userId,
        status: 'ACTIVE'
      }).select('batch');
      const studentBatchIds = enrollments.map((e) => e.batch);

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { students: userId },
          { batch: { $in: studentBatchIds }, type: 'BATCH' }
        ]
      });
    } else if (userRole === 'MENTOR') {
      if (mentorId) {
        filter.mentor = mentorId;
      } else {
        // Mentor sees their assigned sessions
        filter.mentor = userId;
      }
    } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      if (mentorId) {
        filter.mentor = mentorId;
      }
    }

    const sessions = await MentorshipSession.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('students', 'name email avatar')
      .populate('batch', 'name code')
      .populate('course', 'title slug')
      .sort({ startTime: 1 })
      .lean();

    // Security sanitization for students: strip privateMentorNotes
    const sanitizedSessions = sessions.map((s) => {
      if (userRole === 'STUDENT') {
        if (s.notes) {
          const { privateMentorNotes, ...publicNotes } = s.notes;
          return { ...s, notes: publicNotes };
        }
      }
      return s;
    });

    res.status(200).json({
      status: 'success',
      results: sanitizedSessions.length,
      data: {
        sessions: sanitizedSessions
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Session by ID
export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid session ID format', 400));
    }

    const session = await MentorshipSession.findById(id)
      .populate('mentor', 'name email avatar')
      .populate('students', 'name email avatar')
      .populate('batch', 'name code')
      .populate('course', 'title slug')
      .populate('createdBy', 'name email')
      .lean();

    if (!session) {
      return next(new AppError('Mentorship session not found', 404));
    }

    // Check authorization for students
    if (userRole === 'STUDENT') {
      const isDirectStudent = session.students.some(
        (s: any) => s._id.toString() === userId || s.toString() === userId
      );

      let isBatchEnrolled = false;
      if (session.batch) {
        const batchId = (session.batch as any)._id || session.batch;
        const enrollment = await Enrollment.findOne({
          student: userId,
          batch: batchId,
          status: 'ACTIVE'
        });
        if (enrollment) isBatchEnrolled = true;
      }

      if (!isDirectStudent && !isBatchEnrolled) {
        return next(new AppError('You are not authorized to view this session', 403));
      }

      // Strip confidential mentor notes for students
      if (session.notes) {
        const { privateMentorNotes, ...publicNotes } = session.notes;
        session.notes = publicNotes as any;
      }
    }

    // If session is a BATCH session and requester is Admin/Mentor, include full cohort list
    let cohortStudents: any[] = [];
    if (session.batch && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MENTOR')) {
      const batchId = (session.batch as any)._id || session.batch;
      const enrollments = await Enrollment.find({
        batch: batchId,
        status: 'ACTIVE'
      }).populate('student', 'name email avatar');
      cohortStudents = enrollments.map((e: any) => e.student).filter(Boolean);
    }

    res.status(200).json({
      status: 'success',
      data: {
        session,
        cohortStudents
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Session (with conflict detection)
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      mentor,
      students = [],
      batch,
      course,
      type = 'ONE_TO_ONE',
      startTime,
      endTime,
      meetingProvider = 'CUSTOM',
      meetingLink,
      meetingPassword,
      notes
    } = req.body;

    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!title || !startTime || !endTime || !meetingLink) {
      return next(new AppError('Please provide title, startTime, endTime, and meetingLink', 400));
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid start or end time format', 400));
    }

    if (start >= end) {
      return next(new AppError('Session startTime must be earlier than endTime', 400));
    }

    // Determine target mentor ID
    let targetMentorId = mentor;
    if (userRole === 'MENTOR') {
      targetMentorId = userId;
    } else if (!targetMentorId) {
      return next(new AppError('Mentor ID is required to schedule a session', 400));
    }

    // Check mentor existence
    const mentorUser = await User.findById(targetMentorId);
    if (!mentorUser || (mentorUser.role !== 'MENTOR' && mentorUser.role !== 'ADMIN' && mentorUser.role !== 'SUPER_ADMIN')) {
      return next(new AppError('Assigned user must be a Mentor or Admin', 400));
    }

    // Business Rule: Check for scheduling conflicts for the mentor
    const conflictingSession = await MentorshipSession.findOne({
      mentor: targetMentorId,
      status: { $in: ['SCHEDULED', 'LIVE'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (conflictingSession) {
      return next(
        new AppError(
          `Scheduling Conflict: Mentor "${mentorUser.name}" already has an active session "${conflictingSession.title}" scheduled from ${conflictingSession.startTime.toLocaleTimeString()} to ${conflictingSession.endTime.toLocaleTimeString()}`,
          409
        )
      );
    }

    const sessionData: any = {
      title,
      description,
      mentor: targetMentorId,
      students,
      type,
      startTime: start,
      endTime: end,
      meetingProvider,
      meetingLink,
      meetingPassword,
      status: 'SCHEDULED',
      createdBy: userId
    };

    if (batch) sessionData.batch = batch;
    if (course) sessionData.course = course;
    if (notes) sessionData.notes = notes;

    const newSession = await MentorshipSession.create(sessionData);

    const populated = await MentorshipSession.findById(newSession._id)
      .populate('mentor', 'name email avatar')
      .populate('students', 'name email avatar')
      .populate('batch', 'name code')
      .populate('course', 'title slug');

    res.status(201).json({
      status: 'success',
      message: 'Mentorship session scheduled successfully',
      data: {
        session: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Session (Reschedule, edit details, conflict check)
export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid session ID format', 400));
    }

    const session = await MentorshipSession.findById(id);
    if (!session) {
      return next(new AppError('Mentorship session not found', 404));
    }

    // Authorization check
    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      session.mentor.toString() !== userId &&
      session.createdBy.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to edit this session', 403));
    }

    const {
      title,
      description,
      mentor,
      students,
      batch,
      course,
      type,
      startTime,
      endTime,
      meetingProvider,
      meetingLink,
      meetingPassword,
      status
    } = req.body;

    const start = startTime ? new Date(startTime) : session.startTime;
    const end = endTime ? new Date(endTime) : session.endTime;

    if (start >= end) {
      return next(new AppError('Session startTime must be earlier than endTime', 400));
    }

    const targetMentorId = mentor || session.mentor;

    // Check conflict if timing or mentor has changed
    if (
      startTime ||
      endTime ||
      (mentor && mentor.toString() !== session.mentor.toString())
    ) {
      const conflict = await MentorshipSession.findOne({
        _id: { $ne: session._id },
        mentor: targetMentorId,
        status: { $in: ['SCHEDULED', 'LIVE'] },
        startTime: { $lt: end },
        endTime: { $gt: start }
      });

      if (conflict) {
        return next(
          new AppError(
            `Scheduling Conflict: Mentor already has a session "${conflict.title}" during this time window.`,
            409
          )
        );
      }
    }

    if (title !== undefined) session.title = title;
    if (description !== undefined) session.description = description;
    if (mentor !== undefined && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
      session.mentor = mentor;
    }
    if (students !== undefined) session.students = students;
    if (batch !== undefined) session.batch = batch;
    if (course !== undefined) session.course = course;
    if (type !== undefined) session.type = type;
    if (startTime !== undefined) session.startTime = start;
    if (endTime !== undefined) session.endTime = end;
    if (meetingProvider !== undefined) session.meetingProvider = meetingProvider;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (meetingPassword !== undefined) session.meetingPassword = meetingPassword;
    if (status !== undefined) session.status = status;

    await session.save();

    const updated = await MentorshipSession.findById(session._id)
      .populate('mentor', 'name email avatar')
      .populate('students', 'name email avatar')
      .populate('batch', 'name code')
      .populate('course', 'title slug');

    res.status(200).json({
      status: 'success',
      message: 'Mentorship session updated successfully',
      data: {
        session: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Session Status (e.g. LIVE, COMPLETED, CANCELLED)
export const updateSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return next(new AppError('Invalid session status', 400));
    }

    const session = await MentorshipSession.findById(id);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      session.mentor.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to update this session status', 403));
    }

    session.status = status;
    await session.save();

    res.status(200).json({
      status: 'success',
      message: `Session status updated to ${status}`,
      data: {
        session
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update Session Notes & Action Items
export const updateSessionNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { summary, topics, actionItems, privateMentorNotes } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const session = await MentorshipSession.findById(id);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      session.mentor.toString() !== userId
    ) {
      return next(new AppError('Only the assigned mentor or an admin can edit session notes', 403));
    }

    session.notes = {
      summary: summary !== undefined ? summary : session.notes?.summary || '',
      topics: topics !== undefined ? topics : session.notes?.topics || [],
      actionItems: actionItems !== undefined ? actionItems : session.notes?.actionItems || [],
      privateMentorNotes:
        privateMentorNotes !== undefined
          ? privateMentorNotes
          : session.notes?.privateMentorNotes || ''
    };

    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Session notes updated successfully',
      data: {
        notes: session.notes
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete Session
export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const session = await MentorshipSession.findById(id);
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      session.mentor.toString() !== userId &&
      session.createdBy.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to delete this session', 403));
    }

    // Remove session and associated attendance
    await Attendance.deleteMany({ session: session._id });
    await MentorshipSession.findByIdAndDelete(session._id);

    res.status(200).json({
      status: 'success',
      message: 'Mentorship session and attendance logs deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get Mentorship Metrics for Dashboards
export const getDashboardSessionsSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const now = new Date();

    if (userRole === 'MENTOR') {
      const upcoming = await MentorshipSession.find({
        mentor: userId,
        status: { $in: ['SCHEDULED', 'LIVE'] },
        endTime: { $gte: now }
      })
        .populate('batch', 'name code')
        .populate('students', 'name email avatar')
        .sort({ startTime: 1 })
        .limit(5)
        .lean();

      const totalCompleted = await MentorshipSession.countDocuments({
        mentor: userId,
        status: 'COMPLETED'
      });

      const totalScheduled = await MentorshipSession.countDocuments({
        mentor: userId,
        status: 'SCHEDULED'
      });

      res.status(200).json({
        status: 'success',
        data: {
          upcomingSessions: upcoming,
          metrics: {
            completedSessions: totalCompleted,
            scheduledSessions: totalScheduled
          }
        }
      });
    } else if (userRole === 'STUDENT') {
      const enrollments = await Enrollment.find({
        student: userId,
        status: 'ACTIVE'
      }).select('batch');
      const studentBatchIds = enrollments.map((e) => e.batch);

      const upcoming = await MentorshipSession.find({
        $or: [
          { students: userId },
          { batch: { $in: studentBatchIds }, type: 'BATCH' }
        ],
        status: { $in: ['SCHEDULED', 'LIVE'] },
        endTime: { $gte: now }
      })
        .populate('mentor', 'name email avatar')
        .populate('batch', 'name code')
        .sort({ startTime: 1 })
        .limit(5)
        .lean();

      // Sanitise notes
      const sanitized = upcoming.map((s) => {
        if (s.notes) {
          const { privateMentorNotes, ...publicNotes } = s.notes;
          return { ...s, notes: publicNotes };
        }
        return s;
      });

      res.status(200).json({
        status: 'success',
        data: {
          upcomingSessions: sanitized
        }
      });
    } else {
      // Admin dashboard summary
      const upcoming = await MentorshipSession.find({
        status: { $in: ['SCHEDULED', 'LIVE'] },
        endTime: { $gte: now }
      })
        .populate('mentor', 'name email avatar')
        .populate('batch', 'name code')
        .sort({ startTime: 1 })
        .limit(5)
        .lean();

      const totalLive = await MentorshipSession.countDocuments({ status: 'LIVE' });
      const totalScheduled = await MentorshipSession.countDocuments({ status: 'SCHEDULED' });
      const totalCompleted = await MentorshipSession.countDocuments({ status: 'COMPLETED' });

      res.status(200).json({
        status: 'success',
        data: {
          upcomingSessions: upcoming,
          metrics: {
            liveSessions: totalLive,
            scheduledSessions: totalScheduled,
            completedSessions: totalCompleted
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
