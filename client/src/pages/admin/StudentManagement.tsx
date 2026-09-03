import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { Search, Eye } from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
}

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          search: search || undefined,
          status: status || undefined,
          role: 'STUDENT',
          page,
          limit: 10
        }
      });
      const { items, pagination } = response.data.data;
      setStudents(items);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, status, page]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/users/${id}/status`, { status: nextStatus });
      showToast(`Student status configured to ${nextStatus}.`, 'success');
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to adjust student status.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Students Directory</h1>
        <p className="text-sm text-muted-foreground">Monitor profiles, review enrollment details, and verify study tracks.</p>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4 items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students by name or email..."
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
              <option value="ACTIVE">Active Only</option>
              <option value="PENDING">Pending verification</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <LoadingState message="Fetching students directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState description="No student accounts found matching these criteria." />
      ) : (
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.email}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'ACTIVE' ? 'success' : item.status === 'PENDING' ? 'warning' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/students/${item.id}`)}
                      className="flex items-center gap-1.5 h-8 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Profile</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(item.id, item.status)}
                      className={`h-8 text-xs ${item.status === 'ACTIVE' ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                      {item.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginations */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2">
              <span className="text-xs text-muted-foreground">
                Showing <strong className="text-foreground">{students.length}</strong> of{' '}
                <strong className="text-foreground">{totalItems}</strong> student accounts
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-muted-foreground flex items-center">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
