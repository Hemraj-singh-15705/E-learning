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
import { Search, Plus, Eye, Trash } from 'lucide-react';

interface CourseItem {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [levelSelect, setLevelSelect] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [duration, setDuration] = useState('');
  const [shortDesc, setShortDesc] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses', {
        params: {
          search: search || undefined,
          level: level || undefined,
          status: status || undefined,
          page,
          limit: 10
        }
      });
      const { items, pagination } = response.data.data;
      setCourses(items);
      setTotalPages(pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, level, status, page]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showToast('Course title is required.', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post('/courses', {
        title,
        category,
        level: levelSelect,
        duration,
        shortDescription: shortDesc,
        status: 'DRAFT'
      });
      showToast('Course created successfully as Draft.', 'success');
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setCategory('');
      setDuration('');
      setShortDesc('');
      setLevelSelect('BEGINNER');
      fetchCourses();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create course.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusChange = async (courseId: string, nextStatus: string) => {
    try {
      await api.patch(`/courses/${courseId}/status`, { status: nextStatus });
      showToast(`Course configured to ${nextStatus}.`, 'success');
      fetchCourses();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update course status.', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action is permanent.')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      showToast('Course deleted successfully.', 'success');
      fetchCourses();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete course.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Course Directory</h1>
          <p className="text-sm text-muted-foreground">Draft syllabus decks, publish learning programs, and assign modules.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>New Course</span>
        </Button>
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4 items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search course titles or categories..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div className="flex gap-4 w-full sm:w-auto shrink-0">
            <div className="w-36">
              <select
                value={level}
                onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border focus:ring-primary focus:ring-opacity-50 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              >
                <option value="">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div className="w-36">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border focus:ring-primary focus:ring-opacity-50 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid listing */}
      {loading ? (
        <LoadingState message="Fetching course directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCourses} />
      ) : courses.length === 0 ? (
        <EmptyState description="No courses registered matching these criteria." />
      ) : (
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-semibold text-foreground">
                    <span onClick={() => navigate(`/admin/courses/${item._id}`)} className="cursor-pointer hover:underline hover:text-primary">
                      {item.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={item.level === 'ADVANCED' ? 'destructive' : item.level === 'INTERMEDIATE' ? 'primary' : 'secondary'}>
                      {item.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.duration || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'PUBLISHED' ? 'success' : item.status === 'DRAFT' ? 'warning' : 'default'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/courses/${item._id}`)}
                      className="p-1 h-8 w-8"
                      title="View modules details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    {item.status === 'DRAFT' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(item._id, 'PUBLISHED')}
                        className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1 h-auto"
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(item._id, 'DRAFT')}
                        className="text-amber-400 hover:text-amber-300 text-xs px-2 py-1 h-auto"
                      >
                        Unpublish
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCourse(item._id)}
                      className="text-rose-400 hover:text-rose-300 p-1 h-8 w-8"
                      title="Delete Course"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Course" size="md">
        <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
          <Input
            label="Course Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master React and TypeScript Patterns"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Web Development"
            />
            <Input
              label="Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 10 weeks"
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty Level</label>
            <select
              value={levelSelect}
              onChange={(e) => setLevelSelect(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Description</label>
            <textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Provide a concise course syllabus summary..."
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm h-24 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitLoading}>
              Save Course Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseManagement;
