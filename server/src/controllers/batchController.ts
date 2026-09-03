import { Request, Response, NextFunction } from 'express';
import Batch from '../models/Batch';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import { AppError } from '../utils/errors';

// Helper to generate slugs
const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// 1. Get Batches
export const getBatches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '10' } = req.query;

    const queryConditions: any = {};

    if (status) {
      queryConditions.status = status;
    }

    // Role verification filters:
    // Students and Mentors can only see batches they are enrolled in or assigned to
    const userRole = req.user?.role;
    if (userRole === 'STUDENT') {
      const activeEnrollments = await Enrollment.find({ student: req.user?.id, status: 'ACTIVE' });
      const batchIds = activeEnrollments.map(e => e.batch);
      queryConditions._id = { $in: batchIds };
    } else if (userRole === 'MENTOR') {
      queryConditions.mentors = req.user?.id;
    }

    if (search) {
      queryConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const sortOption: any = {};
    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const batches = await Batch.find(queryConditions)
      .populate('mentors', 'name email avatar')
      .populate('courses', 'title slug level')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const total = await Batch.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Batches fetched successfully.',
      data: {
        items: batches,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create Batch
export const createBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, description, thumbnail, status, startDate, endDate, capacity, settings } = req.body;

    let slug = generateSlug(name);
    const existingSlug = await Batch.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Check code duplication
    const existingCode = await Batch.findOne({ code });
    if (existingCode) {
      next(new AppError('A batch with this code already exists.', 400));
      return;
    }

    const batch = await Batch.create({
      name,
      slug,
      code,
      description,
      thumbnail,
      status: status || 'DRAFT',
      startDate,
      endDate,
      capacity,
      settings: settings || {},
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Batch created successfully.',
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Batch
export const getBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('mentors', 'name email phone avatar bio')
      .populate('courses', 'title slug category level duration language status');

    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    // Fetch enrolled students
    const enrollments = await Enrollment.find({ batch: batch._id })
      .populate('student', 'name email phone avatar status')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Batch fetched successfully.',
      data: {
        batch,
        enrollments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Batch
export const updateBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, description, thumbnail, status, startDate, endDate, capacity, settings } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    if (code && code !== batch.code) {
      const existing = await Batch.findOne({ code });
      if (existing) {
        next(new AppError('A batch with this code already exists.', 400));
        return;
      }
      batch.code = code;
    }

    if (name && name !== batch.name) {
      let slug = generateSlug(name);
      const existing = await Batch.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
      batch.slug = slug;
      batch.name = name;
    }

    if (description !== undefined) batch.description = description;
    if (thumbnail !== undefined) batch.thumbnail = thumbnail;
    if (status) batch.status = status;
    if (startDate !== undefined) batch.startDate = startDate;
    if (endDate !== undefined) batch.endDate = endDate;
    if (capacity !== undefined) batch.capacity = capacity;
    if (settings) batch.settings = settings;

    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully.',
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Batch Status
export const updateBatchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(status)) {
      next(new AppError('Invalid status value.', 400));
      return;
    }

    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: `Batch status configured to ${status} successfully.`,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Batch
export const deleteBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    // Clean up all enrollments associated with this batch
    await Enrollment.deleteMany({ batch: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// 7. Duplicate Batch
export const duplicateBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sourceBatch = await Batch.findById(req.params.id);
    if (!sourceBatch) {
      next(new AppError('Source batch not found.', 404));
      return;
    }

    const newName = `${sourceBatch.name} (Copy)`;
    let newSlug = generateSlug(newName);
    const existing = await Batch.findOne({ slug: newSlug });
    if (existing) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const newCode = `${sourceBatch.code}-DUP-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create duplicated batch using configurations (discard enrollments)
    const duplicatedBatch = await Batch.create({
      name: newName,
      slug: newSlug,
      code: newCode,
      description: sourceBatch.description,
      thumbnail: sourceBatch.thumbnail,
      status: 'DRAFT', // clones start as draft
      startDate: sourceBatch.startDate,
      endDate: sourceBatch.endDate,
      capacity: sourceBatch.capacity,
      mentors: sourceBatch.mentors,
      courses: sourceBatch.courses,
      settings: sourceBatch.settings,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Batch duplicated successfully.',
      data: { batch: duplicatedBatch }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Assign Mentor
export const addMentorToBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mentorId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'MENTOR') {
      next(new AppError('User is not a valid mentor.', 400));
      return;
    }

    if (batch.mentors.includes(mentor._id as any)) {
      next(new AppError('Mentor already assigned to this batch.', 400));
      return;
    }

    batch.mentors.push(mentor._id as any);
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Mentor assigned to batch successfully.',
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Remove Mentor
export const removeMentorFromBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mentorId } = req.params;
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    batch.mentors = batch.mentors.filter(id => id.toString() !== mentorId);
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Mentor removed from batch successfully.',
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 10. Assign Course
export const addCourseToBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    if (batch.courses.includes(courseId)) {
      next(new AppError('Course already assigned to this batch.', 400));
      return;
    }

    batch.courses.push(courseId);
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Course assigned to batch successfully.',
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 11. Remove Course
export const removeCourseFromBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    batch.courses = batch.courses.filter(id => id.toString() !== courseId);
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Course removed from batch successfully.',
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// 12. Enroll Student
export const enrollStudentToBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.body;
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      next(new AppError('Batch not found.', 404));
      return;
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'STUDENT') {
      next(new AppError('User is not a valid student.', 400));
      return;
    }

    // Check duplicate active enrollment
    const existing = await Enrollment.findOne({ student: student._id, batch: batch._id });
    if (existing) {
      next(new AppError('Student is already enrolled in this batch.', 400));
      return;
    }

    // Check capacity limit
    const currentCount = await Enrollment.countDocuments({ batch: batch._id, status: 'ACTIVE' });
    if (currentCount >= batch.capacity) {
      next(new AppError('Batch capacity limit exceeded.', 400));
      return;
    }

    const enrollment = await Enrollment.create({
      student: student._id,
      batch: batch._id,
      status: 'ACTIVE',
      enrolledBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully.',
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};

// 13. Unenroll Student
export const unenrollStudentFromBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const batchId = req.params.id;

    const enrollment = await Enrollment.findOneAndDelete({ student: studentId, batch: batchId });
    if (!enrollment) {
      next(new AppError('Enrollment record not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Student unenrolled successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
