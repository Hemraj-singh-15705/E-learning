import React, { useState, useEffect } from 'react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import api from '../../utils/api';
import {
  Layers,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import type { IPlan, BillingInterval } from '../../types/payment';

export const PlanManagement: React.FC = () => {
  const { showToast } = useToast();

  const [plans, setPlans] = useState<IPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IPlan | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(29);
  const [currency, setCurrency] = useState('USD');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('MONTHLY');
  const [duration, setDuration] = useState<number | ''>(30);
  const [featuresInput, setFeaturesInput] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<IPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/plans?includeInactive=true');
      setPlans(res.data.data.plans || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setSlug('');
    setDescription('');
    setPrice(49);
    setCurrency('USD');
    setBillingInterval('MONTHLY');
    setDuration(30);
    setFeaturesInput('Full Course Access, 2 Mentorship Sessions, Verified Certificates');
    setIsPopular(false);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: IPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setDescription(plan.description);
    setPrice(plan.price);
    setCurrency(plan.currency);
    setBillingInterval(plan.billingInterval);
    setDuration(plan.duration);
    setFeaturesInput((plan.features || []).join('\n'));
    setIsPopular(Boolean(plan.isPopular));
    setActive(plan.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || price === '') {
      showToast('Name, description, and price are required', 'error');
      return;
    }

    const features = featuresInput
      .split(/[\n,]/)
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      price: Number(price),
      currency: currency.toUpperCase(),
      billingInterval,
      duration: Number(duration) || 30,
      features,
      isPopular,
      active
    };

    setSaving(true);
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan._id}`, payload);
        showToast('Plan updated successfully', 'success');
      } else {
        await api.post('/plans', payload);
        showToast('Plan created successfully', 'success');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (plan: IPlan) => {
    setPlanToDelete(plan);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/plans/${planToDelete._id}`);
      showToast('Plan deleted successfully', 'success');
      setDeleteModalOpen(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete plan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Pricing Plans Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure subscription tiers, price points, duration windows, and feature entitlements.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="shadow-premium">
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Plans List */}
      {loading ? (
        <LoadingState message="Loading pricing plans..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPlans} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No Plans Configured"
          description="Create your first subscription tier for students."
          actionLabel="Create Plan"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan._id} className="flex flex-col justify-between bg-card border-border">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant={plan.active ? 'success' : 'default'} className="text-[10px]">
                    {plan.active ? 'Active' : 'Inactive'}
                  </Badge>

                  {plan.isPopular && (
                    <Badge variant="primary" className="text-[10px] font-bold">
                      Popular
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col">
                  <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-display text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {plan.currency} / {plan.billingInterval.toLowerCase()}
                  </span>
                </div>

                <div className="p-3 bg-secondary/30 rounded-xl border border-border text-xs flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">Features:</span>
                  <ul className="list-disc list-inside text-foreground space-y-0.5">
                    {plan.features.slice(0, 3).map((f, fidx) => (
                      <li key={fidx} className="truncate">{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Duration: {plan.duration} days
                  </span>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 h-8 w-8"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plan)}
                      className="p-1.5 h-8 w-8 text-rose-400 hover:bg-rose-950/20"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
        size="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 -mt-2">
          <Input
            label="Plan Name *"
            placeholder="e.g. Pro Learner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price ($) *"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />

            <Select
              label="Billing Interval *"
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
              options={[
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'QUARTERLY', label: 'Quarterly' },
                { value: 'YEARLY', label: 'Yearly' },
                { value: 'LIFETIME', label: 'Lifetime Pass' },
                { value: 'ONE_TIME', label: 'One Time Purchase' }
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Description *
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of this tier..."
              required
              className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Features List (one per line)
            </label>
            <textarea
              rows={4}
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="Unlimited Course Access&#10;1-on-1 Mentorship Sessions&#10;Verified Certificates"
              className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              Tag as "Most Popular"
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              Active & Available
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Pricing Plan"
        message={`Are you sure you want to delete the plan "${planToDelete?.name}"?`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setPlanToDelete(null);
        }}
      />
    </div>
  );
};

export default PlanManagement;
