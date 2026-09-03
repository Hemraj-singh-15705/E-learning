import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { ArrowLeft, Plus, Trash, Play } from 'lucide-react';

interface MentorData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface CourseData {
  _id: string;
  title: string;
  slug: string;
  level: string;
}

interface EnrollmentItem {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    status: string;
    avatar?: string;
  };
  enrollmentDate: string;
  status: string;
}

interface BatchDetailData {
  _id: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  capacity: number;
  mentors: MentorData[];
  courses: CourseData[];
  settings: Record<string, any>;
}

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [batch, setBatch] = useState<BatchDetailData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown options lists for Assignments
  const [allMentors, setAllMentors] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'student' | 'mentor' | 'course' | null>(null);
  const [modalSelectId, setModalSelectId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchBatchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${id}`);
      setBatch(res.data.data.batch);
      setEnrollments(res.data.data.enrollments);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve batch particulars.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignOptions = async () => {
    try {
      // Get all mentors
      const mRes = await api.get('/admin/users', { params: { role: 'MENTOR', limit: 100 } });
      setAllMentors(mRes.data.data.items);

      // Get all courses
      const cRes = await api.get('/courses', { params: { limit: 100 } });
      setAllCourses(cRes.data.data.items);

      // Get all students
      const sRes = await api.get('/admin/users', { params: { role: 'STUDENT', limit: 100 } });
      setAllStudents(sRes.data.data.items);
    } catch (err) {
      console.error('Failed to load relations database records.');
    }
  };

  useEffect(() => {
    fetchBatchDetail();
    loadAssignOptions();
  }, [id]);

  const handleStatusChange = async (nextStatus: string) => {
    try {
      await api.patch(`/batches/${id}/status`, { status: nextStatus });
      showToast(`Batch status updated to ${nextStatus}.`, 'success');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to change batch status.', 'error');
    }
  };

  // 1. Assign Mentor
  const handleAssignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSelectId) return;
    setModalLoading(true);
    try {
      await api.post(`/batches/${id}/mentors`, { mentorId: modalSelectId });
      showToast('Mentor assigned to batch successfully.', 'success');
      setActiveModal(null);
      setModalSelectId('');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign mentor.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveMentor = async (mentorId: string) => {
    if (!window.confirm('Remove this mentor from the batch assignment list?')) return;
    try {
      await api.delete(`/batches/${id}/mentors/${mentorId}`);
      showToast('Mentor assignment removed.', 'success');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to remove mentor.', 'error');
    }
  };

  // 2. Assign Course
  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSelectId) return;
    setModalLoading(true);
    try {
      await api.post(`/batches/${id}/courses`, { courseId: modalSelectId });
      showToast('Course assigned to batch successfully.', 'success');
      setActiveModal(null);
      setModalSelectId('');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign course.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!window.confirm('Remove this course from the batch?')) return;
    try {
      await api.delete(`/batches/${id}/courses/${courseId}`);
      showToast('Course removed from batch.', 'success');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to remove course.', 'error');
    }
  };

  // 3. Enroll Student
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSelectId) return;
    setModalLoading(true);
    try {
      await api.post(`/batches/${id}/enrollments`, { studentId: modalSelectId });
      showToast('Student enrolled successfully.', 'success');
      setActiveModal(null);
      setModalSelectId('');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to enroll student.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!window.confirm('Unenroll this student from the batch?')) return;
    try {
      await api.delete(`/batches/${id}/enrollments/${studentId}`);
      showToast('Student unenrolled successfully.', 'success');
      fetchBatchDetail();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to unenroll student.', 'error');
    }
  };

  if (loading) return <LoadingState message="Fetching batch details..." />;
  if (error || !batch) return <ErrorState message={error} onRetry={fetchBatchDetail} />;

  // Filter out already assigned list to avoid duplicates in select dropdowns
  const availableMentors = allMentors.filter(m => !batch.mentors.some(bm => bm._id === m.id));
  const availableCourses = allCourses.filter(c => !batch.courses.some(bc => bc._id === c._id));
  const availableStudents = allStudents.filter(s => !enrollments.some(e => e.student._id === s.id));

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/batches')} className="p-2 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-foreground">{batch.name}</h1>
              <Badge variant={batch.status === 'ACTIVE' ? 'success' : batch.status === 'DRAFT' ? 'warning' : 'secondary'}>
                {batch.status}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Code: {batch.code}</span>
          </div>
        </div>

        {/* Action Status config */}
        <div className="flex gap-2">
          {batch.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusChange('ACTIVE')} className="flex items-center gap-1.5 text-xs">
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Launch Batch</span>
            </Button>
          )}
          {batch.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('COMPLETED')} className="text-xs">
              Complete Batch
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="mentors">Mentors ({batch.mentors.length})</TabsTrigger>
          <TabsTrigger value="courses">Courses ({batch.courses.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Batch Details</CardTitle>
                  <CardDescription className="text-xs">Program description and overview</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {batch.description || 'No description provided for this batch yet.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground font-semibold">Start Date</span>
                      <span className="text-sm text-foreground font-semibold">
                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'Flexible'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground font-semibold">Expected End Date</span>
                      <span className="text-sm text-foreground font-semibold">
                        {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Flexible'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right statistics */}
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metrics</CardTitle>
                  <CardDescription className="text-xs">Capacity allocations</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-xs text-muted-foreground font-semibold">Capacity limit</span>
                    <span className="text-sm text-foreground font-bold">{batch.capacity} Seats</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-xs text-muted-foreground font-semibold">Seats filled</span>
                    <span className="text-sm text-foreground font-bold">
                      {enrollments.length} / {batch.capacity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Assigned Mentors</span>
                    <span className="text-sm text-foreground font-bold">{batch.mentors.length} Coaches</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Students */}
        <TabsContent value="students" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-base text-foreground">Enrolled Students</h3>
                <p className="text-xs text-muted-foreground">Manage enrolled students list.</p>
              </div>
              <Button size="sm" onClick={() => { setActiveModal('student'); setModalSelectId(''); }} className="flex items-center gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Enroll Student</span>
              </Button>
            </div>

            {enrollments.length === 0 ? (
              <EmptyState description="No students have been enrolled in this batch yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enr) => (
                    <TableRow key={enr._id}>
                      <TableCell className="font-semibold text-foreground">{enr.student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{enr.student.email}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(enr.enrollmentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'default'}>{enr.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnenrollStudent(enr.student._id)}
                          className="text-rose-400 hover:text-rose-300 p-1 h-8 w-8"
                          title="Unenroll student"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Mentors */}
        <TabsContent value="mentors" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-base text-foreground">Assigned Mentors</h3>
                <p className="text-xs text-muted-foreground">Expert coaches leading assignments.</p>
              </div>
              <Button size="sm" onClick={() => { setActiveModal('mentor'); setModalSelectId(''); }} className="flex items-center gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Assign Mentor</span>
              </Button>
            </div>

            {batch.mentors.length === 0 ? (
              <EmptyState description="No mentors have been assigned to this batch yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.mentors.map((men) => (
                    <TableRow key={men._id}>
                      <TableCell className="font-semibold text-foreground">{men.name}</TableCell>
                      <TableCell className="text-muted-foreground">{men.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMentor(men._id)}
                          className="text-rose-400 hover:text-rose-300 p-1 h-8 w-8"
                          title="Remove Mentor assignment"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Courses */}
        <TabsContent value="courses" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-base text-foreground">Assigned Courses</h3>
                <p className="text-xs text-muted-foreground">Syllabus modules mapped to this batch.</p>
              </div>
              <Button size="sm" onClick={() => { setActiveModal('course'); setModalSelectId(''); }} className="flex items-center gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Course</span>
              </Button>
            </div>

            {batch.courses.length === 0 ? (
              <EmptyState description="No syllabus courses mapped to this batch yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Difficulty Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.courses.map((crs) => (
                    <TableRow key={crs._id}>
                      <TableCell className="font-semibold text-foreground">{crs.title}</TableCell>
                      <TableCell>
                        <Badge variant={crs.level === 'ADVANCED' ? 'destructive' : 'secondary'}>{crs.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCourse(crs._id)}
                          className="text-rose-400 hover:text-rose-300 p-1 h-8 w-8"
                          title="Remove Course syllabus link"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Settings */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Batch Configuration Settings</CardTitle>
              <CardDescription className="text-xs">JSON metadata preferences and tags</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Custom settings mapping</label>
                <pre className="p-4 bg-secondary rounded-xl text-xs font-mono border border-border text-foreground overflow-x-auto">
                  {JSON.stringify(batch.settings || {}, null, 2)}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Custom parameters mapped inside settings are preserved when duplicating batches, enabling templates configurations setup.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      {/* 1. Enroll Student Modal */}
      <Modal isOpen={activeModal === 'student'} onClose={() => setActiveModal(null)} title="Enroll Student in Batch" size="sm">
        <form onSubmit={handleEnrollStudent} className="flex flex-col gap-4">
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Student</label>
            <select
              value={modalSelectId}
              onChange={(e) => setModalSelectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
              required
            >
              <option value="">-- Choose a Student --</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" isLoading={modalLoading} disabled={!modalSelectId}>Enroll</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Assign Mentor Modal */}
      <Modal isOpen={activeModal === 'mentor'} onClose={() => setActiveModal(null)} title="Assign Coach to Batch" size="sm">
        <form onSubmit={handleAssignMentor} className="flex flex-col gap-4">
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Mentor</label>
            <select
              value={modalSelectId}
              onChange={(e) => setModalSelectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
              required
            >
              <option value="">-- Choose a Mentor --</option>
              {availableMentors.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" isLoading={modalLoading} disabled={!modalSelectId}>Assign</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Assign Course Modal */}
      <Modal isOpen={activeModal === 'course'} onClose={() => setActiveModal(null)} title="Assign Syllabus Course to Batch" size="sm">
        <form onSubmit={handleAssignCourse} className="flex flex-col gap-4">
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Course</label>
            <select
              value={modalSelectId}
              onChange={(e) => setModalSelectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
              required
            >
              <option value="">-- Choose a Course Program --</option>
              {availableCourses.map(c => (
                <option key={c._id} value={c._id}>{c.title} ({c.level})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" isLoading={modalLoading} disabled={!modalSelectId}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BatchDetail;
