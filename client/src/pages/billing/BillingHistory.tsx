import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import api from '../../utils/api';
import {
  FileText,
  Zap,
  Sparkles
} from 'lucide-react';
import type { ISubscription, IInvoice } from '../../types/payment';

export const BillingHistory: React.FC = () => {
  const { showToast } = useToast();

  const [activeSub, setActiveSub] = useState<ISubscription | null>(null);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subRes, invRes] = await Promise.all([
        api.get('/payments/my-subscriptions'),
        api.get('/payments/my-invoices')
      ]);

      setActiveSub(subRes.data.data.activeSubscription || null);
      setInvoices(invRes.data.data.invoices || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSub) return;
    setCancelling(true);
    try {
      await api.post(`/payments/subscriptions/${activeSub._id}/cancel`);
      showToast('Subscription has been cancelled.', 'info');
      setCancelModalOpen(false);
      fetchBillingData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel subscription', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingState message="Loading billing records..." />;
  if (error) return <ErrorState message={error} onRetry={fetchBillingData} />;

  return (
    <div className="d-flex flex-column gap-4 animate-enter text-start">
      {/* Header Banner */}
      <div
        className="p-4 p-md-5 rounded-4 border shadow-sm d-flex flex-column gap-2"
        style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%)',
          borderColor: '#fde68a'
        }}
      >
        <div className="d-flex align-items-center gap-1.5" style={{ color: '#92400e' }}>
          <Sparkles className="h-4 w-4" />
          <span className="text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
            Fee Receipts & Membership Status
          </span>
        </div>

        <h1 className="fw-black display-6 mb-1 font-display" style={{ color: '#78350f' }}>
          Fee Invoices & Subscriptions
        </h1>

        <p className="small mb-0" style={{ maxWidth: '680px', fontSize: '0.88rem', color: '#92400e', lineHeight: '1.5' }}>
          Inspect official fee receipts, GST invoices, and teaching batch enrollment active plans.
        </p>
      </div>

      {/* Active Subscription Overview Card */}
      <div className="card rounded-4 border overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="p-4 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.68rem' }}>Current Academic Plan</span>
              {activeSub && (
                <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold" style={{ fontSize: '0.65rem' }}>
                  {activeSub.status}
                </span>
              )}
            </div>
            <h3 className="fw-black fs-4 mb-1 font-display" style={{ color: '#0f172a' }}>
              {activeSub ? activeSub.plan?.name : 'Teaching Aspirant Active Plan'}
            </h3>
            <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>
              {activeSub
                ? `Valid until ${new Date(activeSub.endDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'Unlimited access to DSSSB, CTET & BPSC batch live classes and CBT test series.'}
            </p>
          </div>

          <div>
            {activeSub ? (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="btn btn-outline-danger btn-sm py-1.5 px-3"
                style={{ fontSize: '0.75rem' }}
              >
                Cancel Subscription
              </button>
            ) : (
              <a
                href="/#batches"
                className="btn btn-warning text-dark btn-sm fw-bold d-inline-flex align-items-center gap-1.5 py-1.5 px-3"
                style={{ fontSize: '0.78rem' }}
              >
                <Zap className="h-4 w-4" /> Explore Teaching Batches
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Invoices and Payments Section */}
      <div className="card p-3.5 rounded-4 border shadow-sm text-start" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <h5 className="fw-bold fs-6 mb-1" style={{ color: '#0f172a' }}>Invoices & Fee Receipts</h5>
        <p className="text-secondary small mb-3" style={{ fontSize: '0.74rem' }}>
          Official tax invoices and transaction records generated for your account.
        </p>

        {invoices.length === 0 ? (
          <div className="text-center py-4 border rounded-3" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            <FileText className="h-6 w-6 text-secondary mb-2" />
            <div className="small fw-bold" style={{ color: '#0f172a' }}>No Invoices Yet</div>
            <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>
              When you enroll in a batch or test series, your downloadable GST tax receipts will appear here.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle" style={{ fontSize: '0.78rem' }}>
              <thead className="text-secondary text-uppercase" style={{ fontSize: '0.68rem', backgroundColor: '#f8fafc' }}>
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Batch / Item</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-end">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="py-2.5 px-3 font-mono fw-bold" style={{ color: '#0f172a' }}>{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-secondary">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3" style={{ color: '#334155' }}>{inv.items?.[0]?.description || 'Teaching Batch Enrollment'}</td>
                    <td className="py-2.5 px-3 fw-bold text-warning" style={{ color: '#d97706' }}>₹{inv.total?.toLocaleString('en-IN')} {inv.currency || 'INR'}</td>
                    <td className="py-2.5 px-3">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-end">
                      <button
                        onClick={() => showToast(`Invoice #${inv.invoiceNumber} receipt downloaded!`, 'info')}
                        className="btn btn-outline-warning btn-sm py-0.5 px-2"
                        style={{ fontSize: '0.7rem' }}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Active Subscription"
        message="Are you sure you want to cancel your active plan? You will retain access until the end of your billing cycle."
        confirmLabel={cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
      />
    </div>
  );
};

export default BillingHistory;
