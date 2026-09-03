import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { Search, ArrowUpDown } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MENTOR' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  isEmailVerified: boolean;
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          search: search || undefined,
          role: role || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 10
        }
      });
      const { items, pagination } = response.data.data;
      setUsers(items);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user management directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, role, status, sortBy, sortOrder, page]);

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, { role: newRole });
      showToast(`User role updated to ${newRole}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user role.', 'error');
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getRoleVariant = (uRole: string) => {
    if (uRole === 'SUPER_ADMIN') return 'destructive';
    if (uRole === 'ADMIN') return 'primary';
    if (uRole === 'MENTOR') return 'secondary';
    return 'default';
  };

  const getStatusVariant = (uStatus: string) => {
    if (uStatus === 'ACTIVE') return 'success';
    if (uStatus === 'PENDING') return 'warning';
    return 'destructive';
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Coordinate system permissions, configure access roles, and deactivate accounts.</p>
        </div>
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="flex flex-col md:flex-row gap-4 p-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto shrink-0">
            <div className="w-36">
              <select
                value={role}
                onChange={(e) => { setRole(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border focus:ring-primary focus:ring-opacity-50 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="MENTOR">Mentor</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div className="w-36">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border focus:ring-primary focus:ring-opacity-50 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid listing */}
      {loading ? (
        <LoadingState message="Fetching system users..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState description="No user records matched your criteria." />
      ) : (
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  <div className="flex items-center gap-1.5">
                    <span>Joined</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.email}</TableCell>
                  <TableCell>
                    {currentUser?.role === 'SUPER_ADMIN' && item.role !== 'SUPER_ADMIN' ? (
                      <select
                        value={item.role}
                        onChange={(e) => handleRoleChange(item.id, e.target.value)}
                        className="px-2 py-1 bg-secondary text-foreground border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="MENTOR">Mentor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <Badge variant={getRoleVariant(item.role)}>
                        {item.role.replace('_', ' ')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.role !== 'SUPER_ADMIN' && item.id !== currentUser?.id ? (
                      item.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'INACTIVE')}
                          className="text-rose-400 hover:text-rose-300 px-2 py-1 h-auto text-xs"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'ACTIVE')}
                          className="text-emerald-400 hover:text-emerald-300 px-2 py-1 h-auto text-xs"
                        >
                          Activate
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Restricted</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2">
              <span className="text-xs text-muted-foreground">
                Showing <strong className="text-foreground">{users.length}</strong> of{' '}
                <strong className="text-foreground">{totalItems}</strong> records
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
                <span className="text-xs font-semibold text-muted-foreground flex items-center px-2">
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

export default UserManagement;
