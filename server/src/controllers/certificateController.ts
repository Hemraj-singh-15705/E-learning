import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Certificate from '../models/Certificate';
import User from '../models/User';
import CertificateService from '../services/certificateService';
import { AppError } from '../utils/errors';

// 1. Public Certificate Verification (No auth required)
export const verifyCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      return next(new AppError('Certificate verification code is required', 400));
    }

    const cleanCode = code.trim().toUpperCase();

    const certificate = await Certificate.findOne({
      $or: [{ verificationCode: cleanCode }, { certificateNumber: cleanCode }]
    })
      .populate('student', 'name avatar')
      .populate('course', 'title slug level duration')
      .populate('batch', 'name code')
      .populate('issuedBy', 'name role')
      .lean();

    if (!certificate) {
      return next(new AppError('No valid certificate found matching this verification code', 404));
    }

    if (certificate.status === 'REVOKED') {
      res.status(200).json({
        status: 'fail',
        isValid: false,
        message: 'This certificate has been revoked by the issuing institution.',
        data: {
          certificate: {
            certificateNumber: certificate.certificateNumber,
            verificationCode: certificate.verificationCode,
            status: 'REVOKED'
          }
        }
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      isValid: true,
      data: {
        certificate
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Logged-in Student's Certificates
export const getMyCertificates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const certificates = await Certificate.find({ student: userId, status: 'ISSUED' })
      .populate('course', 'title slug level duration')
      .populate('batch', 'name code')
      .populate('issuedBy', 'name email')
      .sort({ issueDate: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: certificates.length,
      data: {
        certificates
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get All Certificates Ledger (Admin / Mentor)
export const getCertificates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId, batchId, status, search, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (courseId) filter.course = courseId;
    if (batchId) filter.batch = batchId;
    if (status && status !== 'ALL') filter.status = status;
    if (search) {
      filter.$or = [
        { certificateNumber: { $regex: String(search), $options: 'i' } },
        { verificationCode: { $regex: String(search), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [certificates, totalCount] = await Promise.all([
      Certificate.find(filter)
        .populate('student', 'name email avatar')
        .populate('course', 'title slug')
        .populate('batch', 'name code')
        .populate('issuedBy', 'name email')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Certificate.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      data: {
        certificates
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Manually Issue Certificate (Admin / Mentor)
export const issueCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, courseId, batchId, completionData } = req.body;
    const issuedById = req.user?.id;

    if (!studentId) {
      return next(new AppError('Student ID is required', 400));
    }

    const student = await User.findById(studentId);
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    const certificate = await CertificateService.issueCertificate({
      studentId,
      courseId,
      batchId,
      completionData,
      issuedById
    });

    res.status(201).json({
      status: 'success',
      message: 'Certificate issued successfully!',
      data: {
        certificate
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Revoke Certificate (Admin)
export const revokeCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid certificate ID', 400));
    }

    const certificate = await Certificate.findByIdAndUpdate(
      id,
      { $set: { status: 'REVOKED' } },
      { new: true }
    );

    if (!certificate) {
      return next(new AppError('Certificate not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Certificate has been revoked',
      data: {
        certificate
      }
    });
  } catch (error) {
    next(error);
  }
};
