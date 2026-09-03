import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import MentorProfile from '../models/MentorProfile';
import Batch from '../models/Batch';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { AppError } from '../utils/errors';

// 1. Dashboard Statistics
export const getAdminDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalMentors = await User.countDocuments({ role: 'MENTOR' });
    const totalBatches = await Batch.countDocuments();
    const totalCourses = await Course.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics fetched successfully.',
      data: {
        totalStudents,
        totalMentors,
        totalBatches,
        totalCourses
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. User Listing with Search, Filter, Sort, Pagination
export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, role, status, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '10' } = req.query;

    const queryConditions: any = {};

    // Filter by role
    if (role) {
      queryConditions.role = role;
    }

    // Filter by account status
    if (status) {
      queryConditions.status = status;
    }

    // Search by name or email
    if (search) {
      queryConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const sortOption: any = {};
    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(queryConditions)
      .select('-password')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const total = await User.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully.',
      data: {
        items: users,
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

// 3. View Single User with profile details
export const getUserProfile = async (
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

    let profile: any = null;

    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'MENTOR') {
      profile = await MentorProfile.findOne({ user: user._id });
    }

    // Fetch student's enrollments if student
    let enrollments: any[] = [];
    if (user.role === 'STUDENT') {
      enrollments = await Enrollment.find({ student: user._id })
        .populate('batch', 'name code slug status')
        .sort('-createdAt');
    }

    res.status(200).json({
      success: true,
      message: 'User and profile details fetched successfully.',
      data: {
        user,
        profile,
        enrollments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update User Profile details (Admin edit tool)
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;
    const { name, phone, role, status, permissions, bio, avatar, education, college, course, year, city, state, country, skills, goals, designation, specialization, expertise, experience, qualification, company, socialLinks, availability } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      next(new AppError('User not found.', 404));
      return;
    }

    // Prevent escalations from non-SUPER_ADMIN changing role to SUPER_ADMIN
    const requester = req.user;
    if (role === 'SUPER_ADMIN' && requester?.role !== 'SUPER_ADMIN') {
      next(new AppError('Unauthorized: Only Super Administrators can configure role elevation.', 403));
      return;
    }

    // Update main User attributes
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (permissions) user.permissions = permissions;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    // Update or create role specific profile
    if (user.role === 'STUDENT') {
      let student = await StudentProfile.findOne({ user: user._id });
      if (!student) {
        // Generate STU-xxxx ID
        const studentId = 'STU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        student = new StudentProfile({ user: user._id, studentId });
      }

      if (education) student.education = education;
      if (college !== undefined) student.college = college;
      if (course !== undefined) student.course = course;
      if (year !== undefined) student.year = year;
      if (city !== undefined) student.city = city;
      if (state !== undefined) student.state = state;
      if (country !== undefined) student.country = country;
      if (skills) student.skills = skills;
      if (goals) student.goals = goals;
      if (bio !== undefined) student.bio = bio;

      // Calculate completion rate estimate
      let fieldsFilled = 0;
      if (student.college) fieldsFilled++;
      if (student.course) fieldsFilled++;
      if (student.skills.length > 0) fieldsFilled++;
      if (student.education?.institution) fieldsFilled++;
      student.profileCompletion = Math.min(Math.round((fieldsFilled / 4) * 100), 100);

      await student.save();
    } else if (user.role === 'MENTOR') {
      let mentor = await MentorProfile.findOne({ user: user._id });
      if (!mentor) {
        // Generate MEN-xxxx ID
        const mentorId = 'MEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        mentor = new MentorProfile({ user: user._id, mentorId });
      }

      if (designation !== undefined) mentor.designation = designation;
      if (specialization) mentor.specialization = specialization;
      if (expertise) mentor.expertise = expertise;
      if (experience !== undefined) mentor.experience = experience;
      if (qualification !== undefined) mentor.qualification = qualification;
      if (company !== undefined) mentor.company = company;
      if (bio !== undefined) mentor.bio = bio;
      if (skills) mentor.skills = skills;
      if (socialLinks) mentor.socialLinks = socialLinks;
      if (availability) mentor.availability = availability;

      let fieldsFilled = 0;
      if (mentor.designation) fieldsFilled++;
      if (mentor.company) fieldsFilled++;
      if (mentor.experience) fieldsFilled++;
      if (mentor.specialization.length > 0) fieldsFilled++;
      mentor.profileCompletion = Math.min(Math.round((fieldsFilled / 4) * 100), 100);

      await mentor.save();
    }

    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      success: true,
      message: 'Account and profile details updated successfully.',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Toggle User account state
export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      next(new AppError('Invalid status option specified.', 400));
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      next(new AppError('User not found.', 404));
      return;
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status configured to ${status} successfully.`,
      data: { status: user.status }
    });
  } catch (error) {
    next(error);
  }
};
