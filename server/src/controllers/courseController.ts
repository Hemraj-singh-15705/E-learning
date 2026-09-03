import { Request, Response, NextFunction } from 'express';
import Course from '../models/Course';
import { AppError } from '../utils/errors';

// Helper to generate URL-safe slugs
const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/-+/g, '-'); // collapse dashes
};

// 1. Get Courses with Search, Pagination, Sort, Filters
export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, category, level, status, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '10' } = req.query;

    const queryConditions: any = {};

    // Filter rules
    if (category) queryConditions.category = category;
    if (level) queryConditions.level = level;
    if (status) queryConditions.status = status;
    
    // Default visibility filters for students (Public only, draft hidden)
    // If not Admin/Mentor, default to active published courses
    const userRole = req.user?.role;
    if (userRole === 'STUDENT' || !userRole) {
      queryConditions.status = 'PUBLISHED';
      queryConditions.visibility = 'PUBLIC';
    }

    if (search) {
      queryConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const sortOption: any = {};
    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const courses = await Course.find(queryConditions)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const total = await Course.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Courses fetched successfully.',
      data: {
        items: courses,
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

// 2. Create Course
export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, shortDescription, thumbnail, category, level, language, duration, status, visibility } = req.body;

    let slug = generateSlug(title);
    
    // Check if slug exists, append random suffix if it does
    const existing = await Course.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const createdBy = req.user?.id;

    const course = await Course.create({
      title,
      slug,
      description,
      shortDescription,
      thumbnail,
      category,
      level: level || 'BEGINNER',
      language: language || 'English',
      duration,
      status: status || 'DRAFT',
      visibility: visibility || 'PUBLIC',
      createdBy
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Course
export const getCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      next(new AppError('Course not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Course fetched successfully.',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Course
export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, shortDescription, thumbnail, category, level, language, duration, status, visibility } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      next(new AppError('Course not found.', 404));
      return;
    }

    if (title && title !== course.title) {
      let slug = generateSlug(title);
      const existing = await Course.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
      course.slug = slug;
      course.title = title;
    }

    if (description !== undefined) course.description = description;
    if (shortDescription !== undefined) course.shortDescription = shortDescription;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (category !== undefined) course.category = category;
    if (level) course.level = level;
    if (language) course.language = language;
    if (duration !== undefined) course.duration = duration;
    if (status) course.status = status;
    if (visibility) course.visibility = visibility;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Course Status
export const updateCourseStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      next(new AppError('Invalid status value.', 400));
      return;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!course) {
      next(new AppError('Course not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: `Course status configured to ${status} successfully.`,
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Course
export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      next(new AppError('Course not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
