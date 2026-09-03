import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
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
  Tag,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import type { ICoupon } from '../../types/payment';

export const CouponManagement: React.FC = () => {
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState<number | ''>(20);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [usageLimit, setUsageLimit] = useState<number | ''>(100);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<ICoupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data.coupons || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setType('PERCENTAGE');
    setValue(20);
    setMaxDiscount(50);
    setUsageLimit(100);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon: ICoupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value);
    setMaxDiscount(coupon.maxDiscount !== undefined ? coupon.maxDiscount : '');
    setUsageLimit(coupon.usageLimit !== undefined ? coupon.usageLimit : 100);
    setActive(coupon.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || value === '') {
      showToast('Coupon code and discount value are required', 'error');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit !== '' ? Number(usageLimit) : 100,
      active
    };

    setSaving(true);
    try {
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon._id}`, payload);
        showToast('Coupon updated successfully', 'success');
      } else {
        await api.post('/coupons', payload);
        showToast('Coupon created successfully', 'success');
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (coupon: ICoupon) => {
    setCouponToDelete(coupon);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/coupons/${couponToDelete._id}`);
      showToast('Coupon deleted successfully', 'success');
      setDeleteModalOpen(false);
      setCouponToDelete(null);
      fetchCoupons();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete coupon', 'error');
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
            <Tag className="h-6 w-6 text-primary" />
            Promo Codes & Coupons Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create promotional discount codes with percentage or flat deductions and usage limits.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="shadow-premium">
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <LoadingState message="Loading promo coupons..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCoupons} />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="No Coupons Configured"
          description="Create promo codes to offer discounts on checkout."
          actionLabel="Create Coupon"
          onAction={handleOpenCreate}
        />
      ) : (
        <Card className="bg-card border-border shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold bg-secondary/30">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Max Cap</th>
                  <th className="py-3 px-4">Usage (Used / Limit)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-secondary/20 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary text-sm">
                      {coupon.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {coupon.type}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `$${coupon.value} FLAT`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {coupon.maxDiscount ? `$${coupon.maxDiscount}` : 'None'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground font-semibold">
                      {coupon.usedCount} / {coupon.usageLimit || '∞'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={coupon.active ? 'success' : 'default'} className="text-[10px]">
                        {coupon.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-1.5 h-8 w-8"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(coupon)}
                          className="p-1.5 h-8 w-8 text-rose-400 hover:bg-rose-950/20"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Coupon Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? 'Edit Promo Code' : 'Create Promo Code'}
        size="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 -mt-2">
          <Input
            label="Coupon Code *"
            placeholder="e.g. FLASH50"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type *"
              value={type}
              onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FIXED')}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED', label: 'Fixed Amount ($)' }
              ]}
            />

            <Input
              label={type === 'PERCENTAGE' ? 'Discount Percent (%) *' : 'Discount Amount ($) *'}
              type="number"
              min="1"
              max={type === 'PERCENTAGE' ? 100 : 1000}
              value={value}
              onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Discount Cap ($) (Optional)"
              type="number"
              min="0"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
            />

            <Input
              label="Total Usage Limit"
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl border border-border">
            <input
              type="checkbox"
              id="couponActive"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="couponActive" className="text-xs font-semibold text-foreground cursor-pointer">
              Active for Student Checkouts
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Promo Code"
        message={`Are you sure you want to delete coupon "${couponToDelete?.code}"?`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setCouponToDelete(null);
        }}
      />
    </div>
  );
};

export default CouponManagement;
