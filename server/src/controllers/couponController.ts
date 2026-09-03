import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon';
import Plan from '../models/Plan';
import { AppError } from '../utils/errors';

// 1. Validate Coupon (Public / Student Checkout)
export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code, planId } = req.body;
    const userId = req.user?.id;

    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      active: true
    });

    if (!coupon) {
      return next(new AppError('Invalid or expired coupon code', 400));
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return next(new AppError('Coupon is not yet active', 400));
    }
    if (coupon.endDate && now > coupon.endDate) {
      return next(new AppError('Coupon has expired', 400));
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return next(new AppError('Coupon usage limit reached', 400));
    }

    if (userId && coupon.usedBy && coupon.usedBy.some((u) => u.toString() === userId)) {
      return next(new AppError('You have already used this coupon', 400));
    }

    let planPrice = 0;
    if (planId) {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return next(new AppError('Plan not found for coupon calculation', 404));
      }
      planPrice = plan.price;

      if (
        coupon.applicablePlans &&
        coupon.applicablePlans.length > 0 &&
        !coupon.applicablePlans.some((p) => p.toString() === planId)
      ) {
        return next(new AppError('This coupon is not applicable to the selected plan', 400));
      }
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (coupon.value / 100) * planPrice;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.value, planPrice);
    }

    const finalAmount = Math.max(0, planPrice - discountAmount);

    res.status(200).json({
      status: 'success',
      message: 'Coupon code applied successfully',
      data: {
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          maxDiscount: coupon.maxDiscount
        },
        originalAmount: planPrice,
        discountAmount,
        finalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Coupons (Admin)
export const getCoupons = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let coupons = await Coupon.find()
      .populate('applicablePlans', 'name slug price')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-seed default sample promo code if none exist
    if (coupons.length === 0) {
      await Coupon.create([
        {
          code: 'WELCOME20',
          type: 'PERCENTAGE',
          value: 20,
          maxDiscount: 50,
          usageLimit: 500,
          usedCount: 0,
          active: true
        },
        {
          code: 'FLAT10',
          type: 'FIXED',
          value: 10,
          usageLimit: 200,
          usedCount: 0,
          active: true
        }
      ]);

      coupons = await Coupon.find().populate('applicablePlans', 'name slug price').lean();
    }

    res.status(200).json({
      status: 'success',
      results: coupons.length,
      data: {
        coupons
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Coupon (Admin)
export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      code,
      type = 'PERCENTAGE',
      value,
      maxDiscount,
      minOrderAmount,
      usageLimit = 100,
      startDate,
      endDate,
      active = true,
      applicablePlans = []
    } = req.body;

    if (!code || value === undefined) {
      return next(new AppError('Coupon code and discount value are required', 400));
    }

    const couponCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: couponCode });
    if (existing) {
      return next(new AppError('A coupon with this code already exists', 400));
    }

    const coupon = await Coupon.create({
      code: couponCode,
      type,
      value: Number(value),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      usageLimit: Number(usageLimit) || 100,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      active: Boolean(active),
      applicablePlans
    });

    const populated = await Coupon.findById(coupon._id).populate('applicablePlans', 'name slug price');

    res.status(201).json({
      status: 'success',
      message: 'Coupon created successfully',
      data: {
        coupon: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Coupon (Admin)
export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid coupon ID', 400));
    }

    const coupon = await Coupon.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true })
      .populate('applicablePlans', 'name slug price');

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Coupon updated successfully',
      data: {
        coupon
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Coupon (Admin)
export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid coupon ID', 400));
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
