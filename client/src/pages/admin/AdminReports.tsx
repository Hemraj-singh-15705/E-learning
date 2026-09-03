import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import type { IBusinessReportData } from '../../types/report';

export const AdminReports: React.FC = () => {
  const [reportData, setReportData] = useState<IBusinessReportData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/business?timeRange=${timeRange}`);
      setReportData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load business reports.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Aggregating financial and enrollment metrics..." />;
  if (error || !reportData) return <ErrorState message={error || 'Failed to load report'} onRetry={fetchReports} />;

  const summary = reportData.summary;
  const planBreakdown = reportData.planBreakdown || [];
  const monthlyRevenue = reportData.monthlyRevenue || [];
  const recentPayments = reportData.recentPayments || [];

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header with Time Range Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Business & Financial Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time monetization, revenue velocity, active subscriptions, and enrollment metrics.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-secondary/60 p-1.5 rounded-2xl border border-border">
          {[
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
            { label: '90 Days', value: '90d' },
            { label: '1 Year', value: '1y' },
            { label: 'All Time', value: 'all' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTimeRange(item.value)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                timeRange === item.value
                  ? 'bg-primary text-primary-foreground shadow-premium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Period Revenue
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400 mt-1">
                ₹{summary.periodRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                All-time: ₹{summary.allTimeRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Successful Payments
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-primary mt-1">
                {summary.successfulPayments}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Verified transactions
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Active Subscriptions
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-indigo-400 mt-1">
                {summary.activeSubscriptions}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Active learners
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Certificates Awarded
              </span>
              <span className="text-2xl sm:text-3xl font-black font-display text-amber-400 mt-1">
                {summary.certificatesIssued}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Verified graduates
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plan Revenue Breakdown */}
        <Card className="lg:col-span-6 bg-card border-border shadow-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Revenue by Subscription Tier
            </CardTitle>
            <CardDescription>Sales distribution across pricing plans</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {planBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                No subscription sales recorded in this time period.
              </p>
            ) : (
              planBreakdown.map((item, idx) => {
                const totalRev = summary.periodRevenue || 1;
                const percentage = Math.round((item.revenue / totalRev) * 100);

                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-foreground">{item.planName}</span>
                      <span className="font-mono font-bold text-primary">
                        ₹{item.revenue.toLocaleString('en-IN')} ({item.count} sales)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue Trend */}
        <Card className="lg:col-span-6 bg-card border-border shadow-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Monthly Revenue Performance
            </CardTitle>
            <CardDescription>Verified billing volume over time</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {monthlyRevenue.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                No monthly transactions recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                      <th className="pb-2">Month</th>
                      <th className="pb-2">Transactions</th>
                      <th className="pb-2 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthlyRevenue.map((m, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30">
                        <td className="py-2.5 font-mono font-bold text-foreground">{m.month}</td>
                        <td className="py-2.5 font-mono text-muted-foreground">{m.count}</td>
                        <td className="py-2.5 font-mono font-bold text-emerald-400 text-right">
                          ₹{m.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Successful Transactions Ledger */}
      <Card className="bg-card border-border shadow-premium">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Recent Verified Transactions
          </CardTitle>
          <CardDescription>Live audit ledger of successful student checkouts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-3">Order ID</th>
                    <th className="pb-3 px-3">Customer</th>
                    <th className="pb-3 px-3">Plan / Item</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Provider</th>
                    <th className="pb-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentPayments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-secondary/30">
                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        {pay.orderId}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{pay.user?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{pay.user?.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-foreground font-medium">
                        {pay.metadata?.planName || 'Plan Subscription'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        ₹{pay.amount.toLocaleString('en-IN')} {pay.currency || 'INR'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {pay.provider}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono">
                        {new Date(pay.paidAt || pay.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
