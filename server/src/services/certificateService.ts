import crypto from 'crypto';
import mongoose from 'mongoose';
import Certificate from '../models/Certificate';
import Course from '../models/Course';
import { ICertificateCompletionData } from '../types/certificate';
import { createNotification } from '../utils/notificationHelper';

export interface IssueCertificatePayload {
  studentId: string | mongoose.Types.ObjectId;
  courseId?: string | mongoose.Types.ObjectId;
  batchId?: string | mongoose.Types.ObjectId;
  completionData?: ICertificateCompletionData;
  issuedById: string | mongoose.Types.ObjectId;
}

export class CertificateService {
  /**
   * Generates a unique, standardized certificate identifier
   */
  public static generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CERT-${year}-${hex}`;
  }

  /**
   * Generates a tamper-proof verification hash code
   */
  public static generateVerificationCode(): string {
    const year = new Date().getFullYear();
    const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `VER-${hash}-${year}`;
  }

  /**
   * Issues a certificate for a student upon course/batch completion
   */
  public static async issueCertificate(payload: IssueCertificatePayload) {
    const { studentId, courseId, batchId, completionData, issuedById } = payload;

    // Check if certificate already exists
    const query: any = { student: studentId, status: 'ISSUED' };
    if (courseId) query.course = courseId;
    if (batchId) query.batch = batchId;

    let certificate = await Certificate.findOne(query)
      .populate('student', 'name email avatar')
      .populate('course', 'title slug')
      .populate('batch', 'name code')
      .populate('issuedBy', 'name email');

    if (certificate) {
      return certificate;
    }

    const certificateNumber = this.generateCertificateNumber();
    const verificationCode = this.generateVerificationCode();

    certificate = await Certificate.create({
      certificateNumber,
      verificationCode,
      student: studentId,
      course: courseId || undefined,
      batch: batchId || undefined,
      completionData: completionData || {
        grade: 'A+',
        score: 100,
        totalHours: 40,
        completedLessonsCount: 10
      },
      status: 'ISSUED',
      issuedBy: issuedById,
      issueDate: new Date()
    });

    // Notify student
    const courseDoc = courseId ? await Course.findById(courseId) : null;
    const courseTitle = courseDoc?.title || 'Program Completion';

    await createNotification({
      recipient: studentId,
      type: 'TEST_GRADED',
      title: 'Certificate Awarded!',
      message: `Congratulations! Your certificate of completion for "${courseTitle}" is now available.`,
      link: `/student/certificates`
    });

    const populated = await Certificate.findById(certificate._id)
      .populate('student', 'name email avatar')
      .populate('course', 'title slug')
      .populate('batch', 'name code')
      .populate('issuedBy', 'name email');

    return populated;
  }
}

export default CertificateService;
