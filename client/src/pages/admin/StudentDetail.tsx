import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ArrowLeft, User, GraduationCap, MapPin, Target, BookOpen, Award, LineChart } from 'lucide-react';

interface EnrollmentItem {
  _id: string;
  batch: {
    _id: string;
    name: string;
    code: string;
    status: string;
  };
  enrollmentDate: string;
  status: string;
}

interface StudentProfileDetail {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    avatar?: string;
  };
  profile: {
    studentId: string;
    education?: {
      degree?: string;
      fieldOfStudy?: string;
      institution?: string;
      graduationYear?: number;
    };
    college?: string;
    course?: string;
    year?: string;
    city?: string;
    state?: string;
    country?: string;
    skills: string[];
    goals: string[];
    bio?: string;
    profileCompletion: number;
  } | null;
  enrollments: EnrollmentItem[];
}

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users/${id}`);
      setData(response.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  if (loading) return <LoadingState message="Fetching student detail profile..." />;
  if (error || !data) return <ErrorState message={error} onRetry={fetchStudentDetails} />;

  const { user, profile, enrollments } = data;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/students')} className="p-2 h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-foreground">{user.name}</h1>
            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'}>{user.status}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">ID: {profile?.studentId || 'Not Configured'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Overview */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Account Overview</CardTitle>
                <CardDescription className="text-xs">General account statistics</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Email Address</span>
                <span className="text-sm font-semibold text-foreground">{user.email}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</span>
                <span className="text-sm font-medium text-foreground">{user.phone || 'Not Configured'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Profile Completion</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden border border-border">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${profile?.profileCompletion || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground">{profile?.profileCompletion || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location / Meta */}
          {profile && (
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-sm">Demographics</CardTitle>
                  <CardDescription className="text-xs">Location & Bio data</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Location</span>
                  <span className="text-sm text-foreground">
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Not Configured'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Bio Description</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {profile.bio || 'This student has not set a bio summary yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center & Right column: Tabs & Detailed sections */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Section: Education */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/10">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Academics & Skills</CardTitle>
                <CardDescription className="text-xs">College background, skills profile, and targets</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-semibold">College</span>
                  <span className="text-sm text-foreground font-semibold">{profile?.college || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-semibold">Degree Course</span>
                  <span className="text-sm text-foreground font-semibold">
                    {profile?.education?.degree ? `${profile.education.degree} in ${profile.education.fieldOfStudy}` : '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Skills Portfolio</span>
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No specialized skills registered.</span>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  <span>Learning Targets</span>
                </span>
                {profile?.goals && profile.goals.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-muted-foreground gap-1 flex flex-col">
                    {profile.goals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No learning goals defined yet.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section: Enrollments */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Enrolled Batches</CardTitle>
                <CardDescription className="text-xs">Class tracks and status logs</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <EmptyState description="This student is not enrolled in any study tracks yet." />
              ) : (
                <div className="flex flex-col gap-3">
                  {enrollments.map((enr) => (
                    <div
                      key={enr._id}
                      className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">{enr.batch.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">Code: {enr.batch.code}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(enr.enrollmentDate).toLocaleDateString()}
                        </span>
                        <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'destructive'}>
                          {enr.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preparatory tabs: Placeholder panels for PART 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="opacity-80">
              <CardContent className="flex flex-col gap-3 pt-6">
                <LineChart className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Course Progress & Attendance</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Lectures attended, assignment submission timelines, and attendance grades will be integrated during PART 3 (Learning Experience).
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-80">
              <CardContent className="flex flex-col gap-3 pt-6">
                <Award className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-foreground">Tests & Certificates</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sandbox test dashboards, grade cards, certificate distributions, and rewards lists will activate in PART 3.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
