import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';
import Enrollment from '../models/Enrollment';
import Certificate from '../models/Certificate';

export const getBusinessReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeRange = '30d' } = req.query;

    const now = new Date();
    let startDate = new Date();

    if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
    else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
    else if (timeRange === '90d') startDate.setDate(now.getDate() - 90);
    else if (timeRange === '1y') startDate.setFullYear(now.getFullYear() - 1);
    else startDate = new Date(0); // All time

    const filter: any = { status: 'SUCCESS', createdAt: { $gte: startDate } };

    const [
      revenueAggregation,
      allTimeRevenueAgg,
      totalPaymentsCount,
      activeSubscriptionsCount,
      totalEnrollmentsCount,
      certificatesIssuedCount,
      recentPayments,
      planBreakdown,
      monthlyRevenue
    ] = await Promise.all([
      // Period Revenue
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // All-time Revenue
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Success payments in period
      Payment.countDocuments(filter),
      // Active subscriptions
      Subscription.countDocuments({ status: 'ACTIVE' }),
      // Active enrollments
      Enrollment.countDocuments({ status: 'ACTIVE' }),
      // Certificates
      Certificate.countDocuments({ status: 'ISSUED' }),
      // Recent transactions
      Payment.find({ status: 'SUCCESS' })
        .populate('user', 'name email avatar')
        .sort({ paidAt: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      // Breakdown by Plan
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$metadata.planName',
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      // Monthly Trend (Last 6 Months)
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    const periodRevenue = revenueAggregation[0]?.totalRevenue || 0;
    const allTimeRevenue = allTimeRevenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          periodRevenue,
          allTimeRevenue,
          successfulPayments: totalPaymentsCount,
          activeSubscriptions: activeSubscriptionsCount,
          activeEnrollments: totalEnrollmentsCount,
          certificatesIssued: certificatesIssuedCount
        },
        planBreakdown: planBreakdown.map((p) => ({
          planName: p._id || 'Standard Plan',
          count: p.count,
          revenue: p.revenue
        })),
        monthlyRevenue: monthlyRevenue.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          total: m.total,
          count: m.count
        })),
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};
