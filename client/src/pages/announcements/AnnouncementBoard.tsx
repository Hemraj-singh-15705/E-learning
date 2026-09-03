import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import api from '../../utils/api';
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Edit,
  Trash2
} from 'lucide-react';
import type {
  IAnnouncement,
  AnnouncementAudience,
  AnnouncementStatus
} from '../../types/announcement';

export const AnnouncementBoard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const isStaff = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MENTOR';

  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');

  // Dropdown options
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<IAnnouncement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>('ALL');
  const [batchId, setBatchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [status, setStatus] = useState<AnnouncementStatus>('PUBLISHED');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IAnnouncement | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    if (isStaff) {
      fetchDropdowns();
    }
  }, [audienceFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (audienceFilter !== 'ALL') params.targetAudience = audienceFilter;
      const res = await api.get('/announcements', { params });
      setAnnouncements(res.data.data.announcements || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [bRes, cRes] = await Promise.all([api.get('/batches'), api.get('/courses')]);
      setBatchesList(bRes.data.data.batches || []);
      setCoursesList(cRes.data.data.courses || []);
    } catch {
      // Ignore
    }
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setTargetAudience('ALL');
    setBatchId('');
    setCourseId('');
    setIsPinned(false);
    setStatus('PUBLISHED');
    setModalOpen(true);
  };

  const handleOpenEdit = (announcement: IAnnouncement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setTargetAudience(announcement.targetAudience);
    setBatchId(announcement.batch?._id || '');
    setCourseId(announcement.course?._id || '');
    setIsPinned(announcement.isPinned);
    setStatus(announcement.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    if (targetAudience === 'BATCH' && !batchId) {
      showToast('Please select a target batch', 'error');
      return;
    }

    if (targetAudience === 'COURSE' && !courseId) {
      showToast('Please select a target course', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        batch: targetAudience === 'BATCH' ? batchId : undefined,
        course: targetAudience === 'COURSE' ? courseId : undefined,
        isPinned,
        status
      };

      if (editingAnnouncement) {
        await api.put(`/announcements/${editingAnnouncement._id}`, payload);
        showToast('Announcement updated successfully', 'success');
      } else {
        await api.post('/announcements', payload);
        showToast('Announcement published to targeted audience!', 'success');
      }

      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: IAnnouncement) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${itemToDelete._id}`);
      showToast('Announcement deleted', 'success');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchAnnouncements();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete announcement', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (!search) return true;
    return (
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getAudienceLabel = (item: IAnnouncement) => {
    if (item.targetAudience === 'BATCH') return `Cohort: ${item.batch?.name || item.batch?.code || 'Batch'}`;
    if (item.targetAudience === 'COURSE') return `Course: ${item.course?.title || 'Curriculum'}`;
    if (item.targetAudience === 'STUDENTS') return 'Students Only';
    if (item.targetAudience === 'MENTORS') return 'Mentors Only';
    return 'Everyone (All Users)';
  };

  return (
    <div className="d-flex flex-column gap-4 animate-enter text-start">
      {/* Header Banner */}
      <div className="p-3.5 rounded-4 border d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 text-start shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div>
          <h1 className="fs-4 fw-black font-display mb-1 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
            <Megaphone className="h-5 w-5 text-warning" />
            Exam Updates & Noticeboard
          </h1>
          <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>
            Official DSSSB, CTET & BPSC exam notifications, batch timetables, and academic announcements.
          </p>
        </div>

        {isStaff && (
          <button onClick={handleOpenCreate} className="btn btn-warning text-dark btn-sm fw-bold d-inline-flex align-items-center gap-1.5 py-1.5 px-3">
            <Plus className="h-4 w-4" /> Broadcast Notice
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
          <div className="position-relative w-100" style={{ maxWidth: '320px' }}>
            <Search className="position-absolute text-secondary" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px' }} />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm ps-4 py-1"
              style={{ fontSize: '0.78rem' }}
            />
          </div>

          <div className="w-100 w-sm-auto">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="form-select form-select-sm py-1"
              style={{ fontSize: '0.78rem' }}
            >
              <option value="ALL">All Audiences</option>
              <option value="STUDENTS">Students Only</option>
              <option value="MENTORS">Faculty Mentors</option>
              <option value="BATCH">Cohort Batches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <LoadingState message="Loading announcements..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAnnouncements} />
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          title="No Announcements"
          description="There are no broadcasts or active announcements at this time."
          actionLabel={isStaff ? 'Broadcast Notice' : undefined}
          onAction={isStaff ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredAnnouncements.map((item) => {
            const isAuthorOrAdmin =
              user?.role === 'ADMIN' ||
              user?.role === 'SUPER_ADMIN' ||
              item.author?._id === user?.id;

            return (
              <div
                key={item._id}
                className="card p-3.5 rounded-4 border shadow-sm text-start"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: item.isPinned ? '#f59e0b' : '#e2e8f0'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-1.5">
                    {item.isPinned && (
                      <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.65rem' }}>
                        <Pin className="h-3 w-3 me-0.5" /> PINNED
                      </span>
                    )}
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                      {getAudienceLabel(item)}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2 text-secondary font-mono small" style={{ fontSize: '0.68rem' }}>
                    <span>{new Date(item.publishAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {isAuthorOrAdmin && (
                      <div className="d-flex align-items-center gap-1 ms-1">
                        <button onClick={() => handleOpenEdit(item)} className="btn btn-sm btn-outline-secondary p-0.5 border-0" title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="btn btn-sm btn-outline-danger p-0.5 border-0" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="fw-bold fs-6 mb-1" style={{ color: '#0f172a' }}>{item.title}</h4>
                <div className="text-secondary small mb-3" style={{ fontSize: '0.78rem', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                  {item.content}
                </div>

                <div className="pt-2 border-top d-flex align-items-center gap-2 text-secondary small" style={{ fontSize: '0.68rem', borderColor: '#f1f5f9' }}>
                  <div className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                    {item.author?.name?.slice(0, 2) || 'VM'}
                  </div>
                  <span>Posted by <strong style={{ color: '#0f172a' }}>{item.author?.name || 'Vishakha Ma\'am'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnnouncement ? 'Edit Announcement' : 'Broadcast Announcement'}
        size="lg"
      >
        <form onSubmit={handleSave} className="d-flex flex-column gap-3 text-start" style={{ color: '#0f172a' }}>
          <div className="card p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="row g-3">
              {/* Title */}
              <div className="col-12">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Announcement Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DSSSB TGT Math Special Marathon Class & New DPP Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-control form-control-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Target Audience */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Target Audience <span className="text-danger">*</span>
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as AnnouncementAudience)}
                  className="form-select form-select-sm py-1.5"
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="ALL">Everyone (All Aspirants & Educators)</option>
                  <option value="STUDENTS">All Registered Students</option>
                  <option value="MENTORS">All Faculty Mentors</option>
                  <option value="BATCH">Specific Batch Cohort</option>
                  <option value="COURSE">Specific Exam Course</option>
                </select>
              </div>

              {/* Target Batch */}
              {targetAudience === 'BATCH' && (
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                    Target Batch <span className="text-danger">*</span>
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    required
                    className="form-select form-select-sm py-1.5"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="">Select Batch...</option>
                    {batchesList.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Course */}
              {targetAudience === 'COURSE' && (
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                    Target Course <span className="text-danger">*</span>
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                    className="form-select form-select-sm py-1.5"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="">Select Course...</option>
                    {coursesList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Content */}
              <div className="col-12">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0f172a' }}>
                  Announcement Message Content <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full broadcast notice, class schedule updates, study material links, or important guidelines..."
                  required
                  className="form-control form-control-sm"
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Pin to top */}
              <div className="col-12">
                <div className="form-check p-2.5 rounded-2 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="form-check-input ms-0 me-2"
                  />
                  <label htmlFor="isPinned" className="form-check-label small fw-bold text-dark cursor-pointer" style={{ fontSize: '0.78rem' }}>
                    📌 Pin this announcement to top of the noticeboard
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top" style={{ borderColor: '#e2e8f0' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-outline-secondary btn-sm py-1.5 px-3"
              style={{ fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-warning text-dark btn-sm fw-bold py-1.5 px-4 shadow-sm"
              style={{ fontSize: '0.82rem' }}
            >
              {saving ? 'Publishing...' : editingAnnouncement ? 'Update Notice' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Notice"
        message={`Are you sure you want to delete the notice "${itemToDelete?.title}"?`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
};

export default AnnouncementBoard;
