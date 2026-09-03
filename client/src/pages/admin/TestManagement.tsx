import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  Edit,
  Trash2,
  BookOpen,
  Layers,
  Database,
  Shuffle
} from 'lucide-react';
import type { ITest, TestStatus } from '../../types/test';

export const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<ITest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ITest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10
      };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/tests', { params });
      setTests(res.data.data.items || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
      setTotalCount(res.data.data.pagination?.total || 0);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTests();
  };

  const handleStatusToggle = async (test: ITest) => {
    const nextStatus: TestStatus = test.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.patch(`/tests/${test._id}/status`, { status: nextStatus });
      showToast(`Test ${nextStatus === 'PUBLISHED' ? 'published' : 'moved to draft'}.`, 'success');
      setTests((prev) =>
        prev.map((t) => (t._id === test._id ? { ...t, status: nextStatus } : t))
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update test status.', 'error');
    }
  };

  const handleDeleteClick = (test: ITest) => {
    setSelectedTest(test);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTest) return;
    setDeleting(true);
    try {
      await api.delete(`/tests/${selectedTest._id}`);
      showToast('Test deleted successfully.', 'success');
      setDeleteModalOpen(false);
      setSelectedTest(null);
      fetchTests();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete test.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const publishedCount = tests.filter((t) => t.status === 'PUBLISHED').length;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Tests & Examination Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, publish, and manage timed quizzes, batch examinations, and auto-graded assessments.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/question-bank')}
            className="flex-1 sm:flex-none"
          >
            <Database className="h-4 w-4 mr-2 text-violet-400" />
            Question Bank
          </Button>
          <Button
            onClick={() => navigate('/admin/tests/create')}
            className="flex-1 sm:flex-none shadow-premium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tests</p>
              <h3 className="text-2xl font-bold font-display text-foreground mt-1">{totalCount}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/10">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Published</p>
              <h3 className="text-2xl font-bold font-display text-emerald-400 mt-1">{publishedCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Draft Tests</p>
              <h3 className="text-2xl font-bold font-display text-amber-400 mt-1">
                {tests.filter((t) => t.status === 'DRAFT').length}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/10">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Engine Features</p>
              <h3 className="text-sm font-semibold text-foreground mt-1">Auto-Grading & Anti-Cheat</h3>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'ALL' },
                    { label: 'Published Only', value: 'PUBLISHED' },
                    { label: 'Drafts Only', value: 'DRAFT' },
                    { label: 'Archived', value: 'ARCHIVED' }
                  ]}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tests Listing Table */}
      {loading ? (
        <LoadingState message="Fetching examination tests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTests} />
      ) : tests.length === 0 ? (
        <EmptyState
          title="No Tests Found"
          description={search ? 'No tests match your search filter.' : 'Get started by creating your first exam or quiz.'}
          actionLabel="Create Test"
          onAction={() => navigate('/admin/tests/create')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4">
            {tests.map((test) => (
              <Card key={test._id} hoverable className="transition-all">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Test Details */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 text-primary border border-primary/10 rounded-xl shrink-0 mt-1 md:mt-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold font-display text-base text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/admin/tests/${test._id}/edit`)}>
                          {test.title}
                        </h3>
                        <Badge
                          variant={
                            test.status === 'PUBLISHED'
                              ? 'success'
                              : test.status === 'DRAFT'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {test.status}
                        </Badge>
                        {test.negativeMarking && (
                          <Badge variant="destructive" className="text-[10px]">
                            Negative Marking: -{test.negativeMarkValue || 'default'}
                          </Badge>
                        )}
                        {test.randomizeQuestions && (
                          <Badge variant="primary" className="text-[10px] flex items-center gap-1">
                            <Shuffle className="h-3 w-3" />
                            Randomized
                          </Badge>
                        )}
                      </div>

                      {test.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                          {test.description}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <strong>{test.duration} mins</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Pass: <strong>{test.passingMarks} / {test.totalMarks} marks</strong>
                        </span>
                        {test.course && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                            {typeof test.course === 'object' ? test.course.title : 'Course linked'}
                          </span>
                        )}
                        {test.batch && (
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-amber-400" />
                            {typeof test.batch === 'object' ? test.batch.name : 'Batch linked'}
                          </span>
                        )}
                        <span>
                          Attempts: <strong>{test.attemptsAllowed === 0 ? 'Unlimited' : test.attemptsAllowed}</strong>
                        </span>
                        <span>
                          Questions: <strong>{test.questions?.length || 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusToggle(test)}
                      className="text-xs"
                    >
                      {test.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/admin/tests/${test._id}/analytics`)}
                      className="p-2 h-9 w-9"
                      title="View Analytics"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/admin/tests/${test._id}/edit`)}
                      className="p-2 h-9 w-9"
                      title="Edit Test & Questions"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(test)}
                      className="p-2 h-9 w-9 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300"
                      title="Delete Test"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-2 py-3">
              <span className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} ({totalCount} total tests)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Examination Test"
        message={`Are you sure you want to delete "${selectedTest?.title}"? All questions specific to this test will be removed. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Test'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedTest(null);
        }}
      />
    </div>
  );
};

export default TestManagement;
