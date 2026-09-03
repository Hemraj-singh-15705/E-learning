import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import MentorshipSession from '../models/MentorshipSession';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { AppError } from '../utils/errors';

// 1. Get Attendance for a Session
export const getSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return next(new AppError('Invalid session ID format', 400));
    }

    const session = await MentorshipSession.findById(sessionId)
      .populate('mentor', 'name email avatar')
      .populate('batch', 'name code')
      .lean();

    if (!session) {
      return next(new AppError('Mentorship session not found', 404));
    }

    // Role-based logic
    if (userRole === 'STUDENT') {
      // Student can ONLY view their own attendance
      const myRecord = await Attendance.findOne({
        session: sessionId,
        student: userId
      }).populate('markedBy', 'name');

      res.status(200).json({
        status: 'success',
        data: {
          myAttendance: myRecord
        }
      });
      return;
    }

    // Admin / Mentor
    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      session.mentor._id.toString() !== userId &&
      session.createdBy.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to view attendance for this session', 403));
    }

    // Fetch existing attendance records
    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'name email avatar')
      .populate('markedBy', 'name email')
      .lean();

    // Map existing records by student ID
    const attendanceMap = new Map<string, any>();
    attendanceRecords.forEach((rec: any) => {
      const sId = rec.student?._id?.toString() || rec.student?.toString();
      attendanceMap.set(sId, rec);
    });

    // Build comprehensive roster list
    let fullRoster: any[] = [];

    if (session.type === 'BATCH' && session.batch) {
      // Get all active students enrolled in this batch
      const batchId = (session.batch as any)._id || session.batch;
      const enrollments = await Enrollment.find({
        batch: batchId,
        status: 'ACTIVE'
      }).populate('student', 'name email avatar');

      fullRoster = enrollments
        .map((e: any) => e.student)
        .filter(Boolean)
        .map((student: any) => {
          const sId = student._id.toString();
          const existing = attendanceMap.get(sId);
          return {
            student,
            status: existing ? existing.status : 'ABSENT',
            joinedAt: existing?.joinedAt || null,
            leftAt: existing?.leftAt || null,
            duration: existing?.duration || 0,
            notes: existing?.notes || '',
            markedBy: existing?.markedBy || null,
            isMarked: Boolean(existing)
          };
        });
    } else {
      // 1:1 or GROUP session
      const studentIds = session.students || [];
      const studentDocs = await User.find({
        _id: { $in: studentIds }
      }).select('name email avatar');

      fullRoster = studentDocs.map((student: any) => {
        const sId = student._id.toString();
        const existing = attendanceMap.get(sId);
        return {
          student,
          status: existing ? existing.status : 'ABSENT',
          joinedAt: existing?.joinedAt || null,
          leftAt: existing?.leftAt || null,
          duration: existing?.duration || 0,
          notes: existing?.notes || '',
          markedBy: existing?.markedBy || null,
          isMarked: Boolean(existing)
        };
      });
    }

    // Compute stats
    const total = fullRoster.length;
    const present = fullRoster.filter((r) => r.status === 'PRESENT').length;
    const absent = fullRoster.filter((r) => r.status === 'ABSENT').length;
    const late = fullRoster.filter((r) => r.status === 'LATE').length;
    const excused = fullRoster.filter((r) => r.status === 'EXCUSED').length;

    res.status(200).json({
      status: 'success',
      data: {
        session,
        roster: fullRoster,
        stats: {
          total,
          present,
          absent,
          late,
          excused,
          attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mark / Bulk Update Session Attendance
export const markSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { records } = req.body; // Array of { studentId, status, joinedAt, leftAt, duration, notes }
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return next(new AppError('Invalid session ID format', 400));
    }

    if (!Array.isArray(records) || records.length === 0) {
      return next(new AppError('Please provide an array of attendance records', 400));
    }

    const session = await MentorshipSession.findById(sessionId);
    if (!session) {
      return next(new AppError('Mentorship session not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      session.mentor.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to mark attendance for this session', 403));
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    const bulkOps: any[] = records.map((rec: any) => {
      const status = validStatuses.includes(rec.status) ? rec.status : 'PRESENT';
      return {
        updateOne: {
          filter: {
            session: new mongoose.Types.ObjectId(sessionId),
            student: new mongoose.Types.ObjectId(rec.studentId)
          },
          update: {
            $set: {
              session: new mongoose.Types.ObjectId(sessionId),
              student: new mongoose.Types.ObjectId(rec.studentId),
              status,
              joinedAt: rec.joinedAt ? new Date(rec.joinedAt) : undefined,
              leftAt: rec.leftAt ? new Date(rec.leftAt) : undefined,
              duration: typeof rec.duration === 'number' ? rec.duration : 0,
              notes: rec.notes || '',
              markedBy: new mongoose.Types.ObjectId(userId)
            }
          },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(bulkOps as any);

    // If session is still SCHEDULED, update to COMPLETED or LIVE
    if (session.status === 'SCHEDULED' || session.status === 'LIVE') {
      // If all marked, we can optionally mark COMPLETED if requested
      if (req.body.markSessionCompleted) {
        session.status = 'COMPLETED';
        await session.save();
      }
    }

    const updatedRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'name email avatar')
      .populate('markedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Attendance saved successfully',
      data: {
        records: updatedRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Student Attendance Summary & History
export const getStudentAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const reqUserId = req.user?.id;
    const targetStudentId = req.query.studentId ? String(req.query.studentId) : reqUserId;

    // Authorization check
    if (userRole === 'STUDENT' && targetStudentId !== reqUserId) {
      return next(new AppError('Students can only view their own attendance', 403));
    }

    if (!mongoose.Types.ObjectId.isValid(targetStudentId)) {
      return next(new AppError('Invalid student ID format', 400));
    }

    const records = await Attendance.find({ student: targetStudentId })
      .populate({
        path: 'session',
        select: 'title type startTime endTime status mentor meetingProvider batch',
        populate: [
          { path: 'mentor', select: 'name email avatar' },
          { path: 'batch', select: 'name code' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;

    const attendanceRate =
      totalSessions > 0
        ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
        : 100;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalSessions,
          presentCount,
          lateCount,
          excusedCount,
          absentCount,
          attendanceRate
        },
        history: records
      }
    });
  } catch (error) {
    next(error);
  }
};
