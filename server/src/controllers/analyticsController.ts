import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Course from '../models/Course';
import Batch from '../models/Batch';
import Enrollment from '../models/Enrollment';
import Test from '../models/Test';
import TestAttempt from '../models/TestAttempt';
import MentorshipSession from '../models/MentorshipSession';
import Attendance from '../models/Attendance';
import Assignment from '../models/Assignment';
import AssignmentSubmission from '../models/AssignmentSubmission';
import Payment from '../models/Payment';
import Certificate from '../models/Certificate';
import { AppError } from '../utils/errors';

// 1. Admin Platform-Wide Analytics
export const getAdminAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalMentors,
      totalBatches,
      totalCourses,
      totalEnrollments,
      totalTestAttempts,
      avgTestScoreAgg,
      attendanceStatsAgg,
      totalAssignments,
      totalSubmissions,
      revenueAgg,
      totalCertificates
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'MENTOR' }),
      Batch.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'ACTIVE' }),
      TestAttempt.countDocuments({ status: 'COMPLETED' }),
      TestAttempt.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, avgScore: { $avg: '$score' }, avgPercentage: { $avg: '$percentage' } } }
      ]),
      Attendance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Assignment.countDocuments(),
      AssignmentSubmission.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Certificate.countDocuments({ status: 'ISSUED' })
    ]);

    // Format Attendance breakdown
    const attendanceMap: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    let totalAttendanceRecords = 0;
    attendanceStatsAgg.forEach((item) => {
      attendanceMap[item._id] = item.count;
      totalAttendanceRecords += item.count;
    });

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round(((attendanceMap.PRESENT + attendanceMap.LATE * 0.5) / totalAttendanceRecords) * 100)
      : 100;

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          mentors: totalMentors
        },
        academic: {
          batches: totalBatches,
          courses: totalCourses,
          activeEnrollments: totalEnrollments,
          certificatesIssued: totalCertificates
        },
        examinations: {
          totalAttempts: totalTestAttempts,
          averageScore: Math.round(avgTestScoreAgg[0]?.avgScore || 0),
          averagePercentage: Math.round(avgTestScoreAgg[0]?.avgPercentage || 0)
        },
        attendance: {
          totalRecords: totalAttendanceRecords,
          rate: attendanceRate,
          breakdown: attendanceMap
        },
        assignments: {
          totalAssignments,
          totalSubmissions
        },
        finance: {
          grossRevenue: revenueAgg[0]?.totalRevenue || 0,
          successfulPayments: revenueAgg[0]?.count || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Student Personalized Learning Analytics
export const getStudentAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.user?.id;

    const [
      enrollments,
      testAttempts,
      submissions,
      attendanceRecords,
      certificates
    ] = await Promise.all([
      Enrollment.find({ student: studentId, status: 'ACTIVE' })
        .populate({
          path: 'batch',
          select: 'name code courses',
          populate: { path: 'courses', select: 'title slug' }
        })
        .lean(),
      TestAttempt.find({ student: studentId, status: 'COMPLETED' })
        .populate('test', 'title passingMarks totalMarks')
        .sort({ completedAt: -1 })
        .lean(),
      AssignmentSubmission.find({ student: studentId })
        .populate('assignment', 'title totalMarks dueDate')
        .sort({ createdAt: -1 })
        .lean(),
      Attendance.find({ student: studentId }).lean(),
      Certificate.find({ student: studentId, status: 'ISSUED' }).lean()
    ]);

    // Calculate Test metrics
    const totalTests = testAttempts.length;
    const passedTests = testAttempts.filter((t) => t.isPassed).length;
    const avgScorePercentage = totalTests > 0
      ? Math.round(testAttempts.reduce((acc, t) => acc + (t.percentage || 0), 0) / totalTests)
      : 0;

    // Calculate Assignment metrics
    const totalAssignmentsSubmitted = submissions.length;
    const gradedAssignments = submissions.filter((s) => s.status === 'REVIEWED');
    const avgAssignmentMarks = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((acc, s) => acc + (s.marks || 0), 0) / gradedAssignments.length)
      : 0;

    // Calculate Attendance metrics
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const lateCount = attendanceRecords.filter((a) => a.status === 'LATE').length;
    const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
    const attendancePercentage = totalAttendance > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalAttendance) * 100)
      : 100;

    res.status(200).json({
      status: 'success',
      data: {
        enrolledCount: enrollments.length,
        courses: enrollments.map((e) => {
          const batchObj = e.batch as any;
          const courseTitles = batchObj?.courses?.map((c: any) => c.title).join(', ') || 'Curriculum Track';
          return {
            batchName: batchObj?.name || 'Cohort Batch',
            courseTitle: courseTitles
          };
        }),
        tests: {
          attempted: totalTests,
          passed: passedTests,
          passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
          avgScorePercentage
        },
        assignments: {
          submitted: totalAssignmentsSubmitted,
          graded: gradedAssignments.length,
          avgMarks: avgAssignmentMarks
        },
        attendance: {
          total: totalAttendance,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          percentage: attendancePercentage
        },
        certificatesCount: certificates.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mentor Cohort & Instruction Analytics
export const getMentorAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentorId = req.user?.id;

    // Find batches where mentor is assigned
    const assignedBatches = await Batch.find({ mentors: mentorId }).lean();
    const batchIds = assignedBatches.map((b) => b._id);

    const [
      totalStudentsCount,
      sessions,
      assignedTests,
      pendingAssignments
    ] = await Promise.all([
      Enrollment.countDocuments({ batch: { $in: batchIds }, status: 'ACTIVE' }),
      MentorshipSession.find({
        $or: [{ mentor: mentorId }, { batch: { $in: batchIds } }]
      }).lean(),
      Test.countDocuments({ batch: { $in: batchIds } }),
      AssignmentSubmission.countDocuments({
        status: { $in: ['SUBMITTED', 'LATE'] }
      })
    ]);

    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const scheduledSessions = sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE').length;

    res.status(200).json({
      status: 'success',
      data: {
        batches: {
          count: assignedBatches.length,
          list: assignedBatches.map((b) => ({ _id: b._id, name: b.name, code: b.code }))
        },
        students: {
          totalMentored: totalStudentsCount
        },
        sessions: {
          total: sessions.length,
          completed: completedSessions,
          scheduled: scheduledSessions
        },
        evaluations: {
          testsCreated: assignedTests,
          pendingAssignmentReviews: pendingAssignments
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Specific Batch Cohort Deep-Dive Analytics
export const getBatchAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return next(new AppError('Invalid batch ID', 400));
    }

    const batch = await Batch.findById(batchId)
      .populate('courses', 'title slug')
      .populate('mentors', 'name email')
      .lean();

    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    const [enrollments, attendanceStats, testAttempts] = await Promise.all([
      Enrollment.find({ batch: batchId }).populate('student', 'name email avatar').lean(),
      Attendance.aggregate([
        { $match: { batch: new mongoose.Types.ObjectId(batchId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      TestAttempt.aggregate([
        {
          $lookup: {
            from: 'tests',
            localField: 'test',
            foreignField: '_id',
            as: 'testDoc'
          }
        },
        { $unwind: '$testDoc' },
        { $match: { 'testDoc.batch': new mongoose.Types.ObjectId(batchId), status: 'COMPLETED' } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$score' },
            avgPercentage: { $avg: '$percentage' },
            passedCount: {
              $sum: { $cond: [{ $eq: ['$isPassed', true] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const attendanceMap: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    let totalAttendance = 0;
    attendanceStats.forEach((item) => {
      attendanceMap[item._id] = item.count;
      totalAttendance += item.count;
    });

    const attendanceRate = totalAttendance > 0
      ? Math.round(((attendanceMap.PRESENT + attendanceMap.LATE * 0.5) / totalAttendance) * 100)
      : 100;

    const testStats = testAttempts[0] || { totalAttempts: 0, avgPercentage: 0, passedCount: 0 };
    const passRate = testStats.totalAttempts > 0
      ? Math.round((testStats.passedCount / testStats.totalAttempts) * 100)
      : 0;

    const courseTitles = (batch.courses as any[])?.map((c: any) => c.title).join(', ') || 'Curriculum Track';
    const mentorNames = (batch.mentors as any[])?.map((m: any) => m.name).join(', ') || 'Lead Mentor';

    res.status(200).json({
      status: 'success',
      data: {
        batch: {
          _id: batch._id,
          name: batch.name,
          code: batch.code,
          course: courseTitles,
          mentor: mentorNames
        },
        students: {
          total: enrollments.length,
          active: enrollments.filter((e) => e.status === 'ACTIVE').length
        },
        attendance: {
          rate: attendanceRate,
          breakdown: attendanceMap,
          totalRecords: totalAttendance
        },
        performance: {
          totalTestAttempts: testStats.totalAttempts,
          avgTestPercentage: Math.round(testStats.avgPercentage),
          testPassRate: passRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
