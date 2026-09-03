import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ArrowLeft, User, Briefcase, Calendar, Link2, Globe, BookOpen, Layers, BarChart } from 'lucide-react';

interface MentorProfileDetail {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    avatar?: string;
  };
  profile: {
    mentorId: string;
    designation?: string;
    specialization: string[];
    expertise: string[];
    experience?: number;
    qualification?: string;
    company?: string;
    bio?: string;
    skills: string[];
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      website?: string;
    };
    availability?: {
      days?: string[];
      slots?: string[];
    };
    profileCompletion: number;
  } | null;
  // In the future we will fetch assigned batches here
  batches: any[];
}

export const MentorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MentorProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchMentorDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users/${id}`);
      // The admin route returns user, profile. Let's fetch assigned batches for this mentor
      const profileData = response.data.data;
      
      // Query batches assigned to this mentor
      const batchRes = await api.get('/batches', {
        params: { limit: 100 }
      });
      const assignedBatches = batchRes.data.data.items.filter((b: any) => 
        b.mentors.some((m: any) => m._id === id)
      );

      setData({
        ...profileData,
        batches: assignedBatches
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve mentor profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorDetails();
  }, [id]);

  if (loading) return <LoadingState message="Fetching mentor detail profile..." />;
  if (error || !data) return <ErrorState message={error} onRetry={fetchMentorDetails} />;

  const { user, profile, batches } = data;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/mentors')} className="p-2 h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-foreground">{user.name}</h1>
            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'}>{user.status}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">ID: {profile?.mentorId || 'Not Configured'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Profile card & Socials */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Account Settings</CardTitle>
                <CardDescription className="text-xs">General contact details</CardDescription>
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

          {/* Socials / Links */}
          {profile && (
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-sm">Professional Links</CardTitle>
                  <CardDescription className="text-xs">Social accounts</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {profile.socialLinks?.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Link2 className="h-4 w-4 text-[#0a66c2]" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {profile.socialLinks?.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Link2 className="h-4 w-4 text-violet-400" />
                    <span>GitHub Profile</span>
                  </a>
                )}
                {profile.socialLinks?.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Globe className="h-4 w-4 text-primary" />
                    <span>Personal Website</span>
                  </a>
                )}
                {!profile.socialLinks?.linkedin && !profile.socialLinks?.github && !profile.socialLinks?.website && (
                  <span className="text-xs text-muted-foreground italic">No social links configured.</span>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center/Right column: Work details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Work Card */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/10">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Professional Expertise</CardTitle>
                <CardDescription className="text-xs">Designation, skills profile, and experience</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-semibold">Designation</span>
                  <span className="text-sm text-foreground font-semibold">
                    {profile?.designation ? `${profile.designation} at ${profile.company || '—'}` : '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-semibold">Experience Duration</span>
                  <span className="text-sm text-foreground font-semibold">
                    {profile?.experience ? `${profile.experience} Years` : '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Expertise Fields</span>
                {profile?.expertise && profile.expertise.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.expertise.map((tag) => (
                      <Badge key={tag} variant="primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No expertise badges registered.</span>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Bio Description</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile?.bio || 'This mentor has not provided a detailed bio narrative yet.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          {profile?.availability && (
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-sm">Weekly Availabilities</CardTitle>
                  <CardDescription className="text-xs">Scheduled mentor slots</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Available Days</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.availability.days && profile.availability.days.length > 0 ? (
                      profile.availability.days.map((d) => (
                        <Badge key={d} variant="secondary">{d}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No availability days specified.</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Time Slots</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.availability.slots && profile.availability.slots.length > 0 ? (
                      profile.availability.slots.map((s) => (
                        <Badge key={s} variant="default">{s}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No slot times configured.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Batches */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/10">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Assigned Batches</CardTitle>
                <CardDescription className="text-xs">Active course batches</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <EmptyState description="This mentor is not currently assigned to lead any study batches." />
              ) : (
                <div className="flex flex-col gap-3">
                  {batches.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">{b.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">Code: {b.code}</span>
                      </div>
                      <Badge variant={b.status === 'ACTIVE' ? 'success' : 'destructive'}>
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preparatory tabs: Placeholders for PART 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="opacity-80">
              <CardContent className="flex flex-col gap-3 pt-6">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Assigned Students</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Listings of all enrolled student progress cards, attendance sheets, and assignment submissions will link in PART 3.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-80">
              <CardContent className="flex flex-col gap-3 pt-6">
                <BarChart className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Mentor Sessions & Ratings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Live video session bookings, schedules, feedback ratings, and mentor performance stats will activate in PART 3.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDetail;
