import mongoose, { Schema } from 'mongoose';
import { IAnnouncement } from '../types/announcement';

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'MENTORS', 'BATCH', 'COURSE'],
      required: [true, 'Target audience is required'],
      default: 'ALL'
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    publishAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED'
    }
  },
  {
    timestamps: true
  }
);

AnnouncementSchema.index({ targetAudience: 1, status: 1 });
AnnouncementSchema.index({ batch: 1, status: 1 });
AnnouncementSchema.index({ course: 1, status: 1 });
AnnouncementSchema.index({ isPinned: -1, publishAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>(
  'Announcement',
  AnnouncementSchema
);

export default Announcement;
