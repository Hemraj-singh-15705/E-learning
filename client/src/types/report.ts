export interface IBusinessReportSummary {
  periodRevenue: number;
  allTimeRevenue: number;
  successfulPayments: number;
  activeSubscriptions: number;
  activeEnrollments: number;
  certificatesIssued: number;
}

export interface IPlanRevenueBreakdown {
  planName: string;
  count: number;
  revenue: number;
}

export interface IMonthlyRevenueItem {
  month: string;
  total: number;
  count: number;
}

export interface IBusinessReportData {
  summary: IBusinessReportSummary;
  planBreakdown: IPlanRevenueBreakdown[];
  monthlyRevenue: IMonthlyRevenueItem[];
  recentPayments: any[];
}
