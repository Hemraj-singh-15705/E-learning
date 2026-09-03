import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';

interface CourseDetailData {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  duration?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
}

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.data.course);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const handlePublishToggle = async () => {
    if (!course) return;
    const nextStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const response = await api.patch(`/courses/${id}/status`, { status: nextStatus });
      setCourse(response.data.data.course);
      showToast(`Course configured to ${nextStatus}.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to configure course status.', 'error');
    }
  };

  if (loading) return <LoadingState message="Fetching course details..." />;
  if (error || !course) return <ErrorState message={error} onRetry={fetchCourseDetails} />;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/courses')} className="p-2 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-foreground">{course.title}</h1>
              <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'warning'}>{course.status}</Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Slug: {course.slug}</span>
          </div>
        </div>
        
        <Button
          variant={course.status === 'PUBLISHED' ? 'outline' : 'primary'}
          size="sm"
          onClick={handlePublishToggle}
          className="self-start sm:self-auto"
        >
          {course.status === 'PUBLISHED' ? 'Unpublish Course' : 'Publish Course'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Specifications</CardTitle>
                <CardDescription className="text-xs">Course metadata configurations</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Difficulty Level</span>
                <div className="mt-1">
                  <Badge variant={course.level === 'ADVANCED' ? 'destructive' : course.level === 'INTERMEDIATE' ? 'primary' : 'secondary'}>
                    {course.level}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Category</span>
                <span className="text-sm text-foreground font-semibold">{course.category || 'General Learning'}</span>
              </div>

              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Estimated Duration</span>
                <span className="text-sm text-foreground font-semibold">{course.duration || 'Flexible Timeline'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Instruction Language</span>
                <span className="text-sm text-foreground font-medium">{course.language}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Syllabus Outline Placeholders for PART 3 */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course Description</CardTitle>
              <CardDescription className="text-xs">Summary of learning material</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {course.shortDescription || 'No short overview statement provided.'}
              </p>
              {course.description && (
                <div className="pt-4 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Detailed Syllabus Outline</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {course.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module Syllabus Builder (Placeholder empty state for PART 3) */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Modules Curriculum (Syllabus Structure)</CardTitle>
                <CardDescription className="text-xs">Curriculum modules, lessons and resources</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {/* Prepare structure: Modules -> Lessons -> Resources */}
              <EmptyState
                title="Curriculum Builder Unavailable"
                description="No lessons or resources configured yet. Course curriculum builders, video lesson upload tools, and PDF material download libraries will be fully integrated during PART 3 (Learning Experience)."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
