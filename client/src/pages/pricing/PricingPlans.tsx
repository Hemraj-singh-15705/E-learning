import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { RootState } from '../../store';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState } from '../../components/ui/States';
import api from '../../utils/api';
import {
  Sparkles,
  Check,
  Zap,
  Award,
  Calendar,
  CreditCard,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  GraduationCap
} from 'lucide-react';
import type { IPlan } from '../../types/payment';

export const PricingPlans: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<IPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intervalFilter, setIntervalFilter] = useState<string>('ALL');

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'SANDBOX' | 'STRIPE' | 'RAZORPAY'>('SANDBOX');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/plans');
      setPlans(res.data.data.plans || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pricing plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (plan: IPlan) => {
    if (!user) {
      showToast('Please sign in to choose a subscription plan', 'info');
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setCouponCode('');
    setAppliedCoupon(null);
    setPaymentSuccessData(null);
    setPaymentProvider('SANDBOX');
    setCheckoutModalOpen(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setValidatingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        planId: selectedPlan._id
      });
      setAppliedCoupon(res.data.data);
      showToast('Coupon applied successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid coupon code', 'error');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!selectedPlan) return;
    setProcessingPayment(true);
    try {
      // 1. Create Checkout Session
      const checkoutRes = await api.post('/payments/checkout', {
        planId: selectedPlan._id,
        couponCode: appliedCoupon?.coupon?.code || undefined,
        provider: paymentProvider,
        paymentMethod
      });

      const paymentSession = checkoutRes.data.data;

      // 2. Execute Server-Side Verification
      const verifyRes = await api.post('/payments/verify', {
        paymentId: paymentSession.paymentId,
        providerPaymentId: `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        providerOrderId: paymentSession.providerOrderId
      });

      setPaymentSuccessData(verifyRes.data.data);
      showToast('Payment confirmed! Plan activated.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Payment processing failed', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (intervalFilter === 'ALL') return true;
    return p.billingInterval === intervalFilter;
  });

  if (loading) return <LoadingState message="Loading pricing options..." />;
  if (error) return <ErrorState message={error} onRetry={fetchPlans} />;

  const originalPrice = selectedPlan?.price || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : originalPrice;

  return (
    <div className="container py-5">
      {/* Top Header */}
      {!user && (
        <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-4 mb-5">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none text-light">
            <div className="p-2 rounded-3 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}>
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="fw-black fs-5 tracking-tight text-white font-display">
              Mentorship<span style={{ color: '#a78bfa' }}>.AI</span>
            </span>
          </Link>
          <div className="d-flex gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center mb-5">
        <div className="badge rounded-pill bg-primary bg-opacity-25 text-light border border-primary border-opacity-50 px-3 py-1 text-uppercase fw-bold small mb-3">
          <Sparkles className="h-3.5 w-3.5 me-1 text-warning" /> Transparent & Flexible Pricing
        </div>
        
        <h1 className="display-5 fw-black text-white font-display mb-3">
          Invest in Your Mastery & Career
        </h1>
        
        <p className="text-secondary small max-w-xl mx-auto mb-4" style={{ maxWidth: '600px' }}>
          Access verified cohorts, 1-on-1 expert coaching, graded deliverables, timed quizzes, and verifiable certificates.
        </p>

        {/* Interval Filters */}
        <div className="btn-group p-1 bg-dark rounded-4 border border-secondary" role="group">
          {['ALL', 'MONTHLY', 'YEARLY', 'LIFETIME'].map((interval) => (
            <button
              key={interval}
              type="button"
              onClick={() => setIntervalFilter(interval)}
              className={`btn btn-sm rounded-3 px-3 py-1.5 fw-bold ${
                intervalFilter === interval
                  ? 'btn-primary'
                  : 'btn-dark text-secondary'
              }`}
            >
              {interval === 'ALL'
                ? 'All Tiers'
                : interval === 'MONTHLY'
                ? 'Monthly'
                : interval === 'YEARLY'
                ? 'Yearly (Save 20%)'
                : 'Lifetime Pass'}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="row g-4 justify-content-center mb-5">
        {filteredPlans.map((plan) => {
          const isPopular = plan.isPopular;

          return (
            <div key={plan._id} className="col-12 col-md-4">
              <div
                className={`card h-100 p-4 p-xl-5 text-start position-relative ${
                  isPopular ? 'border-primary border-2 shadow-lg' : ''
                }`}
                style={isPopular ? { backgroundColor: 'rgba(30, 27, 75, 0.4)' } : {}}
              >
                {isPopular && (
                  <div className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-primary px-3 py-1 text-uppercase fw-black shadow-sm">
                    ★ Most Popular Tier
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="fw-black text-white mb-0 font-display fs-4">{plan.name}</h3>
                  <Badge variant={isPopular ? 'primary' : 'default'}>{plan.billingInterval}</Badge>
                </div>

                <p className="text-secondary small mb-3" style={{ minHeight: '36px' }}>
                  {plan.description}
                </p>

                <div className="d-flex align-items-baseline gap-1 mb-4">
                  <span className="display-5 fw-black text-white font-display">₹{plan.price.toLocaleString('en-IN')}</span>
                  <span className="text-secondary small font-monospace">
                    {plan.billingInterval === 'LIFETIME' ? '/ one-time pass' : `/${plan.billingInterval.toLowerCase()}`}
                  </span>
                </div>

                <div className="py-3 border-top border-bottom border-secondary mb-4">
                  <div className="small fw-bold text-uppercase text-secondary mb-3" style={{ fontSize: '0.75rem' }}>
                    Included Features:
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-2 small text-light">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-dark border border-secondary mb-4 small text-secondary">
                  <div className="d-flex justify-content-between mb-1">
                    <span><Calendar className="h-3.5 w-3.5 me-1 text-primary" /> 1:1 Mentorship:</span>
                    <strong className="text-white">{plan.limits?.mentorSessionsPerMonth || 2}/mo</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span><Award className="h-3.5 w-3.5 me-1 text-warning" /> Verified Certificate:</span>
                    <strong className="text-white">{plan.limits?.certificateIncluded ? 'Included' : 'Optional'}</strong>
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenCheckout(plan)}
                  variant={isPopular ? 'primary' : 'outline'}
                  size="lg"
                  className="w-100 mt-auto"
                >
                  <Zap className="h-4 w-4 me-1.5" /> Select {plan.name}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={paymentSuccessData ? 'Subscription Activated!' : 'Complete Your Subscription'}
        size="md"
      >
        {paymentSuccessData ? (
          <div className="text-center py-3">
            <div className="h-16 w-16 rounded-circle bg-success bg-opacity-25 text-success border border-success mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h4 className="fw-bold text-white mb-1 font-display">Welcome to {selectedPlan?.name}!</h4>
            <p className="text-secondary small mb-4">Your payment was verified. Membership and cohort access are now active.</p>

            <div className="p-3 bg-dark rounded-3 border border-secondary text-start small mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary">Invoice Number:</span>
                <strong className="text-primary font-monospace">{paymentSuccessData.invoice?.invoiceNumber}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary">Amount Paid:</span>
                <strong className="text-white font-monospace">₹{Number(paymentSuccessData.payment?.amount || 0).toLocaleString('en-IN')} INR</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Active Period:</span>
                <span className="text-secondary font-monospace">
                  {new Date(paymentSuccessData.subscription?.startDate).toLocaleDateString()} -{' '}
                  {new Date(paymentSuccessData.subscription?.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline"
                className="w-50"
                onClick={() => {
                  setCheckoutModalOpen(false);
                  navigate('/student/billing');
                }}
              >
                <FileText className="h-3.5 w-3.5 me-1" /> View Invoice
              </Button>
              <Button
                className="w-50"
                onClick={() => {
                  setCheckoutModalOpen(false);
                  navigate('/dashboard');
                }}
              >
                Go to Workspace <ArrowRight className="h-3.5 w-3.5 ms-1" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-start">
            <div className="p-3 bg-dark border border-secondary rounded-3 d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="small text-primary text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Selected Tier</span>
                <div className="fw-bold text-white">{selectedPlan?.name}</div>
              </div>
              <span className="fs-5 fw-black text-white font-monospace">₹{selectedPlan?.price?.toLocaleString('en-IN')}</span>
            </div>

            <div className="mb-3">
              <label className="form-label text-slate-300 small fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>
                Coupon / Promo Code
              </label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <Tag className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. WELCOME20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="form-control"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </Button>
              </div>

              {appliedCoupon && (
                <div className="small text-success fw-semibold mt-1">
                  <Check className="h-3.5 w-3.5 me-1" />
                  Coupon {appliedCoupon.coupon?.code} applied (-₹{discountAmount.toLocaleString('en-IN')})
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label text-slate-300 small fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>
                Payment Method
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`btn w-100 p-2 text-start small fw-bold d-flex align-items-center gap-2 ${
                      paymentMethod === 'upi' ? 'btn-primary' : 'btn-outline-secondary text-light'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" /> UPI / QR Pay
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`btn w-100 p-2 text-start small fw-bold d-flex align-items-center gap-2 ${
                      paymentMethod === 'card' ? 'btn-primary' : 'btn-outline-secondary text-light'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> NetBanking / Card
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-dark rounded-3 border border-secondary small mb-3">
              <div className="d-flex justify-content-between text-secondary mb-1">
                <span>Subtotal:</span>
                <span className="font-monospace">₹{originalPrice.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="d-flex justify-content-between text-success fw-semibold mb-1">
                  <span>Discount:</span>
                  <span className="font-monospace">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>GST / Tax:</span>
                <span className="font-monospace">₹0.00</span>
              </div>
              <div className="d-flex justify-content-between text-white fw-bold pt-2 border-top border-secondary fs-6">
                <span>Total Due:</span>
                <span className="text-primary font-monospace">₹{finalPrice.toLocaleString('en-IN')} INR</span>
              </div>
            </div>

            <Button
              onClick={handleExecutePayment}
              disabled={processingPayment}
              size="lg"
              className="w-100 fw-bold"
            >
              <ShieldCheck className="h-4 w-4 me-2" />
              {processingPayment ? 'Verifying...' : `Pay ₹${finalPrice.toLocaleString('en-IN')} & Activate`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PricingPlans;
