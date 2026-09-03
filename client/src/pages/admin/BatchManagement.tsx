import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { Search, Plus, Eye, Copy, Trash } from 'lucide-react';

interface BatchItem {
  _id: string;
  name: string;
  code: string;
  status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  capacity: number;
  mentors: any[];
  courses: any[];
  createdAt: string;
}

export const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [statusSelect, setStatusSelect] = useState<'DRAFT' | 'UPCOMING' | 'ACTIVE'>('DRAFT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/batches', {
        params: {
          search: search || undefined,
          status: status || undefined,
          page,
          limit: 10
        }
      });
      const { items, pagination } = response.data.data;
      setBatches(items);
      setTotalPages(pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load academic batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [search, status, page]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !capacity) {
      showToast('All primary fields are required.', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post('/batches', {
        name,
        code,
        capacity: parseInt(capacity, 10),
        status: statusSelect,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      showToast('Batch created successfully.', 'success');
      setIsModalOpen(false);
      // Reset form
      setName('');
      setCode('');
      setCapacity('30');
      setStatusSelect('DRAFT');
      setStartDate('');
      setEndDate('');
      fetchBatches();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create batch.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDuplicate = async (batchId: string) => {
    try {
      await api.post(`/batches/${batchId}/duplicate`);
      showToast('Batch duplicated successfully. Cloned version created as Draft.', 'success');
      fetchBatches();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to duplicate batch.', 'error');
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to delete this batch? All enrollment history for this batch will be lost.')) return;
    try {
      await api.delete(`/batches/${batchId}`);
      showToast('Batch deleted successfully.', 'success');
      fetchBatches();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete batch.', 'error');
    }
  };

  const getStatusVariant = (bStatus: string) => {
    if (bStatus === 'ACTIVE') return 'success';
    if (bStatus === 'UPCOMING') return 'primary';
    if (bStatus === 'DRAFT') return 'warning';
    if (bStatus === 'COMPLETED') return 'secondary';
    return 'default';
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Academic Batches</h1>
          <p className="text-sm text-muted-foreground">Manage cohort classes, assign study tracks, and enroll students.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Create Batch</span>
        </Button>
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4 items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by batch name or code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div className="w-40 shrink-0 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border focus:ring-primary focus:ring-opacity-50 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grid listing */}
      {loading ? (
        <LoadingState message="Fetching academic batches..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBatches} />
      ) : batches.length === 0 ? (
        <EmptyState description="No cohort batches found matching these criteria." />
      ) : (
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Code</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Mentors</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-mono font-bold text-foreground text-xs">{item.code}</TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <span onClick={() => navigate(`/admin/batches/${item._id}`)} className="cursor-pointer hover:underline hover:text-primary">
                      {item.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.mentors?.length || 0} Assigned</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.courses?.length || 0} Tracks</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.capacity} Seats</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/batches/${item._id}`)}
                        className="p-1 h-8 w-8"
                        title="Batch Workspace"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(item._id)}
                        className="p-1 h-8 w-8 text-primary border-primary/20 hover:bg-primary/5"
                        title="Duplicate Configuration"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item._id)}
                        className="p-1 h-8 w-8 text-rose-400 hover:text-rose-300"
                        title="Delete Batch"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Batch" size="md">
        <form onSubmit={handleCreateBatch} className="flex flex-col gap-4">
          <Input
            label="Batch Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Full Stack MERN Mentorship Oct 2026"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Batch Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. BATCH-OCT26"
              required
            />
            <Input
              label="Max Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="30"
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Initial Status</label>
            <select
              value={statusSelect}
              onChange={(e) => setStatusSelect(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
            >
              <option value="DRAFT">Draft</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitLoading}>
              Save Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BatchManagement;
