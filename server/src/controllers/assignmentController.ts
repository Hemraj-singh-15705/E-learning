import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Assignment from '../models/Assignment';
import AssignmentSubmission from '../models/AssignmentSubmission';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { AppError } from '../utils/errors';
import { createNotification, createBulkNotifications } from '../utils/notificationHelper';

// 1. Get Assignments (Role-filtered)
export const getAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      courseId,
      batchId,
      status,
      search,
      page = '1',
      limit = '10'
    } = req.query;

    const userRole = req.user?.role;
    const userId = req.user?.id;

    const filter: any = {};

    if (courseId) filter.course = courseId;
    if (batchId) filter.batch = batchId;

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } }
      ];
    }

    if (userRole === 'STUDENT') {
      // Find batches where student is actively enrolled
      const enrollments = await Enrollment.find({
        student: userId,
        status: 'ACTIVE'
      }).select('batch');
      const studentBatchIds = enrollments.map((e) => e.batch);

      filter.batch = { $in: studentBatchIds };
      filter.status = 'PUBLISHED';

      const assignments = await Assignment.find(filter)
        .populate('batch', 'name code')
        .populate('course', 'title slug')
        .populate('mentor', 'name email avatar')
        .sort({ dueDate: 1 })
        .lean();

      // Attach student's submission status to each assignment
      const assignmentIds = assignments.map((a) => a._id);
      const studentSubmissions = await AssignmentSubmission.find({
        assignment: { $in: assignmentIds },
        student: userId
      }).lean();

      const subMap = new Map<string, any>();
      studentSubmissions.forEach((sub) => {
        subMap.set(sub.assignment.toString(), sub);
      });

      const formatted = assignments.map((a) => {
        const mySub = subMap.get(a._id.toString());
        return {
          ...a,
          mySubmission: mySub
            ? {
                _id: mySub._id,
                status: mySub.status,
                marks: mySub.marks,
                feedback: mySub.feedback,
                submittedAt: mySub.submittedAt,
                files: mySub.files,
                githubUrl: mySub.githubUrl,
                liveUrl: mySub.liveUrl
              }
            : null
        };
      });

      res.status(200).json({
        status: 'success',
        results: formatted.length,
        data: {
          assignments: formatted
        }
      });
      return;
    }

    // Mentor or Admin view
    if (userRole === 'MENTOR') {
      if (!batchId) {
        // Mentor sees assignments where they are assigned as mentor or created by them
        filter.$or = [{ mentor: userId }, { createdBy: userId }];
      }
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [assignments, totalCount] = await Promise.all([
      Assignment.find(filter)
        .populate('batch', 'name code')
        .populate('course', 'title slug')
        .populate('mentor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Assignment.countDocuments(filter)
    ]);

    // Attach submission counts for each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds }
    }).select('assignment status');

    const countsMap = new Map<string, { total: number; reviewed: number; pending: number }>();
    submissions.forEach((sub) => {
      const aId = sub.assignment.toString();
      const current = countsMap.get(aId) || { total: 0, reviewed: 0, pending: 0 };
      current.total += 1;
      if (sub.status === 'REVIEWED') current.reviewed += 1;
      else current.pending += 1;
      countsMap.set(aId, current);
    });

    const formatted = assignments.map((a) => ({
      ...a,
      submissionStats: countsMap.get(a._id.toString()) || { total: 0, reviewed: 0, pending: 0 }
    }));

    res.status(200).json({
      status: 'success',
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      data: {
        assignments: formatted
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Assignment
export const getAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid assignment ID format', 400));
    }

    const assignment = await Assignment.findById(id)
      .populate('batch', 'name code')
      .populate('course', 'title slug')
      .populate('mentor', 'name email avatar')
      .populate('createdBy', 'name email')
      .lean();

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    if (userRole === 'STUDENT') {
      const mySubmission = await AssignmentSubmission.findOne({
        assignment: id,
        student: userId
      })
        .populate('reviewedBy', 'name email avatar')
        .lean();

      res.status(200).json({
        status: 'success',
        data: {
          assignment: {
            ...assignment,
            mySubmission
          }
        }
      });
      return;
    }

    // Mentor / Admin: include submission count breakdown
    const submissionCount = await AssignmentSubmission.countDocuments({ assignment: id });
    const reviewedCount = await AssignmentSubmission.countDocuments({
      assignment: id,
      status: 'REVIEWED'
    });

    res.status(200).json({
      status: 'success',
      data: {
        assignment: {
          ...assignment,
          submissionStats: {
            total: submissionCount,
            reviewed: reviewedCount,
            pending: submissionCount - reviewedCount
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Assignment
export const createAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      course,
      module,
      lesson,
      batch,
      mentor,
      dueDate,
      totalMarks = 100,
      allowedFileTypes = ['pdf', 'zip', 'docx', 'png', 'jpg', 'js', 'ts', 'py'],
      maxFileSize = 25,
      maxFiles = 5,
      status = 'DRAFT'
    } = req.body;

    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!title || !description || !dueDate) {
      return next(new AppError('Title, description, and dueDate are required', 400));
    }

    let targetMentor = mentor;
    if (userRole === 'MENTOR') {
      targetMentor = userId;
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: course || undefined,
      module: module || undefined,
      lesson: lesson || undefined,
      batch: batch || undefined,
      mentor: targetMentor || undefined,
      dueDate: new Date(dueDate),
      totalMarks: Number(totalMarks) || 100,
      allowedFileTypes,
      maxFileSize: Number(maxFileSize) || 25,
      maxFiles: Number(maxFiles) || 5,
      status,
      createdBy: userId
    });

    // If published and assigned to a batch, notify all active enrolled students
    if (status === 'PUBLISHED' && batch) {
      const enrollments = await Enrollment.find({
        batch,
        status: 'ACTIVE'
      }).select('student');

      const studentIds = enrollments.map((e) => e.student);
      await createBulkNotifications(studentIds, {
        type: 'ASSIGNMENT_CREATED',
        title: 'New Assignment Published',
        message: `A new assignment "${assignment.title}" has been published. Due on ${assignment.dueDate.toLocaleDateString()}.`,
        link: `/student/assignments/${assignment._id}`
      });
    }

    const populated = await Assignment.findById(assignment._id)
      .populate('batch', 'name code')
      .populate('course', 'title slug')
      .populate('mentor', 'name email avatar');

    res.status(201).json({
      status: 'success',
      message: 'Assignment created successfully',
      data: {
        assignment: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Assignment
export const updateAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid assignment ID format', 400));
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      assignment.createdBy.toString() !== userId &&
      assignment.mentor?.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to edit this assignment', 403));
    }

    const previousStatus = assignment.status;

    const {
      title,
      description,
      course,
      module,
      lesson,
      batch,
      mentor,
      dueDate,
      totalMarks,
      allowedFileTypes,
      maxFileSize,
      maxFiles,
      status
    } = req.body;

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (course !== undefined) assignment.course = course || undefined;
    if (module !== undefined) assignment.module = module || undefined;
    if (lesson !== undefined) assignment.lesson = lesson || undefined;
    if (batch !== undefined) assignment.batch = batch || undefined;
    if (mentor !== undefined) assignment.mentor = mentor || undefined;
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
    if (totalMarks !== undefined) assignment.totalMarks = Number(totalMarks);
    if (allowedFileTypes !== undefined) assignment.allowedFileTypes = allowedFileTypes;
    if (maxFileSize !== undefined) assignment.maxFileSize = Number(maxFileSize);
    if (maxFiles !== undefined) assignment.maxFiles = Number(maxFiles);
    if (status !== undefined) assignment.status = status;

    await assignment.save();

    // Trigger notification if newly published
    if (previousStatus === 'DRAFT' && assignment.status === 'PUBLISHED' && assignment.batch) {
      const enrollments = await Enrollment.find({
        batch: assignment.batch,
        status: 'ACTIVE'
      }).select('student');

      const studentIds = enrollments.map((e) => e.student);
      await createBulkNotifications(studentIds, {
        type: 'ASSIGNMENT_CREATED',
        title: 'New Assignment Published',
        message: `Assignment "${assignment.title}" is now open for submission.`,
        link: `/student/assignments/${assignment._id}`
      });
    }

    const populated = await Assignment.findById(assignment._id)
      .populate('batch', 'name code')
      .populate('course', 'title slug')
      .populate('mentor', 'name email avatar');

    res.status(200).json({
      status: 'success',
      message: 'Assignment updated successfully',
      data: {
        assignment: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Assignment
export const deleteAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      assignment.createdBy.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to delete this assignment', 403));
    }

    await AssignmentSubmission.deleteMany({ assignment: id });
    await Assignment.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Assignment and all student submissions deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 6. Student Submit / Resubmit Assignment
export const submitAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { files = [], answer, githubUrl, liveUrl, isDraft = false } = req.body;
    const userId = req.user?.id;

    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.status !== 'PUBLISHED') {
      return next(new AppError('Assignment is not available for submission', 404));
    }

    // Check student enrollment in batch
    if (assignment.batch) {
      const enrollment = await Enrollment.findOne({
        student: userId,
        batch: assignment.batch,
        status: 'ACTIVE'
      });
      if (!enrollment) {
        return next(new AppError('You are not enrolled in the cohort for this assignment', 403));
      }
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;
    const submissionStatus = isDraft ? 'DRAFT' : isLate ? 'LATE' : 'SUBMITTED';

    // File validation against allowed rules
    if (files.length > assignment.maxFiles) {
      return next(
        new AppError(`You can only attach up to ${assignment.maxFiles} files`, 400)
      );
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: id, student: userId },
      {
        $set: {
          assignment: id,
          student: userId,
          files,
          answer: answer || '',
          githubUrl: githubUrl || undefined,
          liveUrl: liveUrl || undefined,
          submittedAt: now,
          status: submissionStatus
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // If submitted, notify mentor
    if (!isDraft && assignment.mentor) {
      const studentUser = await User.findById(userId).select('name');
      await createNotification({
        recipient: assignment.mentor,
        type: 'SYSTEM',
        title: 'New Assignment Submission',
        message: `${studentUser?.name || 'A student'} submitted their work for "${assignment.title}"${isLate ? ' (Late)' : ''}.`,
        link: `/admin/assignments`
      });
    }

    res.status(200).json({
      status: 'success',
      message: isDraft
        ? 'Draft saved successfully'
        : isLate
        ? 'Assignment submitted (Late)'
        : 'Assignment submitted successfully!',
      data: {
        submission
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Grade Student Submission
export const gradeSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, status = 'REVIEWED' } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return next(new AppError('Invalid submission ID format', 400));
    }

    const submission = await AssignmentSubmission.findById(submissionId).populate(
      'assignment'
    );
    if (!submission) {
      return next(new AppError('Submission not found', 404));
    }

    const assignment = submission.assignment as any;

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      assignment.mentor?.toString() !== userId &&
      assignment.createdBy?.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to grade this submission', 403));
    }

    const numMarks = Number(marks);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > assignment.totalMarks) {
      return next(
        new AppError(
          `Marks must be between 0 and ${assignment.totalMarks}`,
          400
        )
      );
    }

    submission.marks = numMarks;
    submission.feedback = feedback || '';
    submission.status = status === 'RETURNED' ? 'RETURNED' : 'REVIEWED';
    submission.reviewedBy = new mongoose.Types.ObjectId(userId);
    submission.reviewedAt = new Date();

    await submission.save();

    // Trigger notification to student
    const notifType = status === 'RETURNED' ? 'ASSIGNMENT_RETURNED' : 'ASSIGNMENT_GRADED';
    const notifTitle = status === 'RETURNED' ? 'Assignment Returned for Revision' : 'Assignment Graded';
    const notifMessage =
      status === 'RETURNED'
        ? `Your submission for "${assignment.title}" has been returned by the mentor for revision. Please review feedback.`
        : `Your submission for "${assignment.title}" has been evaluated: ${numMarks}/${assignment.totalMarks} Marks.`;

    await createNotification({
      recipient: submission.student,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      link: `/student/assignments/${assignment._id}`
    });

    const populated = await AssignmentSubmission.findById(submission._id)
      .populate('student', 'name email avatar')
      .populate('reviewedBy', 'name email avatar');

    res.status(200).json({
      status: 'success',
      message: 'Submission graded successfully',
      data: {
        submission: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get All Submissions for an Assignment (Mentor / Admin)
export const getAssignmentSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const assignment = await Assignment.findById(id).populate('batch');
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      assignment.mentor?.toString() !== userId &&
      assignment.createdBy.toString() !== userId
    ) {
      return next(new AppError('You are not authorized to view submissions for this assignment', 403));
    }

    const submissions = await AssignmentSubmission.find({ assignment: id })
      .populate('student', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .sort({ submittedAt: -1 })
      .lean();

    // Also get all enrolled batch students to show submission status for entire cohort
    let cohortStudents: any[] = [];
    if (assignment.batch) {
      const batchId = (assignment.batch as any)._id || assignment.batch;
      const enrollments = await Enrollment.find({
        batch: batchId,
        status: 'ACTIVE'
      }).populate('student', 'name email avatar');

      const subMap = new Map<string, any>();
      submissions.forEach((s) => {
        subMap.set(s.student?._id?.toString() || s.student?.toString(), s);
      });

      cohortStudents = enrollments
        .map((e: any) => e.student)
        .filter(Boolean)
        .map((st: any) => {
          const sId = st._id.toString();
          const sub = subMap.get(sId);
          return {
            student: st,
            hasSubmitted: Boolean(sub),
            submission: sub || null
          };
        });
    }

    res.status(200).json({
      status: 'success',
      data: {
        assignment,
        submissions,
        cohortOverview: cohortStudents
      }
    });
  } catch (error) {
    next(error);
  }
};
