import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Plan from '../models/Plan';
import { AppError } from '../utils/errors';

// 1. Get All Pricing Plans (Public / Authenticated)
export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const { includeInactive } = req.query;

    const filter: any = {};
    if (!userRole || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') || !includeInactive) {
      filter.active = true;
    }

    let plans = await Plan.find(filter)
      .populate('applicableCourses', 'title slug')
      .populate('applicableBatches', 'name code')
      .sort({ price: 1 })
      .lean();

    // Convert legacy USD plans to INR if found
    await Plan.updateMany(
      { currency: 'USD' },
      { $set: { currency: 'INR' } }
    );
    await Plan.updateOne({ slug: 'starter-learner', price: { $lt: 500 } }, { $set: { price: 999 } });
    await Plan.updateOne({ slug: 'pro-career-accelerator', price: { $lt: 500 } }, { $set: { price: 2499 } });
    await Plan.updateOne({ slug: 'mastery-lifetime-pass', price: { $lt: 500 } }, { $set: { price: 9999 } });

    // Auto-seed default Indian Rupee tiers if database has 0 plans
    if (plans.length === 0) {
      await Plan.create([
        {
          name: 'Starter Learner',
          slug: 'starter-learner',
          description: 'Essential access to foundational courses, quizzes, and community forum.',
          price: 999,
          currency: 'INR',
          billingInterval: 'MONTHLY',
          duration: 30,
          features: [
            'Access to 5 Core Courses',
            'Full Test & Quiz Engine Access',
            'Community Discussion Boards',
            'Weekly Mentorship Q&A Webinar'
          ],
          active: true,
          limits: {
            maxCourses: 5,
            mentorSessionsPerMonth: 1,
            testAttemptsLimit: 5,
            certificateIncluded: false
          }
        },
        {
          name: 'Pro Career Accelerator',
          slug: 'pro-career-accelerator',
          description: 'Comprehensive cohort training with 1-on-1 mentorship, code reviews, and verified certificates.',
          price: 2499,
          currency: 'INR',
          billingInterval: 'MONTHLY',
          duration: 30,
          isPopular: true,
          features: [
            'Unlimited Course Curriculum Access',
            'Dedicated 1-on-1 Mentorship Sessions',
            'Assignment Submissions & Code Reviews',
            'Official Verified Certificates of Completion',
            'Cohort Batch Projects & Live Workshops'
          ],
          active: true,
          limits: {
            maxCourses: 20,
            mentorSessionsPerMonth: 4,
            testAttemptsLimit: 10,
            certificateIncluded: true
          }
        },
        {
          name: 'Mastery Lifetime Pass',
          slug: 'mastery-lifetime-pass',
          description: 'Lifetime access to all current and future curriculum, private mentorship, and fast-track career coaching.',
          price: 9999,
          currency: 'INR',
          billingInterval: 'LIFETIME',
          duration: 3650,
          features: [
            'Lifetime Unlimited Access to All Courses',
            'Priority 1-on-1 Mentorship Booking',
            'Unlimited Verified Certificates',
            'Exclusive Industry Projects & Code Reviews',
            'Fast-track Job & Portfolio Guidance'
          ],
          active: true,
          limits: {
            maxCourses: 100,
            mentorSessionsPerMonth: 10,
            testAttemptsLimit: 50,
            certificateIncluded: true
          }
        }
      ]);
    }

    plans = await Plan.find(filter).sort({ price: 1 }).lean();

    res.status(200).json({
      status: 'success',
      results: plans.length,
      data: {
        plans
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Plan
export const getPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id.toLowerCase() };

    const plan = await Plan.findOne(query)
      .populate('applicableCourses', 'title slug')
      .populate('applicableBatches', 'name code')
      .lean();

    if (!plan) {
      return next(new AppError('Plan not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Plan (Admin)
export const createPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency = 'USD',
      billingInterval = 'MONTHLY',
      duration = 30,
      features = [],
      active = true,
      limits,
      applicableCourses = [],
      applicableBatches = [],
      isPopular = false
    } = req.body;

    if (!name || !description || price === undefined) {
      return next(new AppError('Name, description, and price are required', 400));
    }

    const planSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');

    const existing = await Plan.findOne({ slug: planSlug });
    if (existing) {
      return next(new AppError('A plan with this slug already exists', 400));
    }

    const plan = await Plan.create({
      name,
      slug: planSlug,
      description,
      price: Number(price),
      currency: currency.toUpperCase(),
      billingInterval,
      duration: Number(duration),
      features,
      active: Boolean(active),
      limits: limits || {
        maxCourses: 10,
        mentorSessionsPerMonth: 2,
        testAttemptsLimit: 5,
        certificateIncluded: true
      },
      applicableCourses,
      applicableBatches,
      isPopular: Boolean(isPopular)
    });

    res.status(201).json({
      status: 'success',
      message: 'Pricing plan created successfully',
      data: {
        plan
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Plan (Admin)
export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid plan ID', 400));
    }

    const plan = await Plan.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!plan) {
      return next(new AppError('Plan not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Plan updated successfully',
      data: {
        plan
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Plan (Admin)
export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid plan ID', 400));
    }

    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      return next(new AppError('Plan not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
