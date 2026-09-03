import mongoose, { Schema } from 'mongoose';
import { IMentorshipSession } from '../types/session';

const ActionItemSchema = new Schema(
  {
    task: { type: String, required: true, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    isCompleted: { type: Boolean, default: false }
  },
  { _id: true }
);

const SessionNotesSchema = new Schema(
  {
    summary: { type: String, trim: true, default: '' },
    topics: [{ type: String, trim: true }],
    actionItems: [ActionItemSchema],
    privateMentorNotes: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const MentorshipSessionSchema = new Schema<IMentorshipSession>(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor is required']
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    type: {
      type: String,
      enum: ['ONE_TO_ONE', 'GROUP', 'BATCH'],
      required: [true, 'Session type is required'],
      default: 'ONE_TO_ONE'
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    meetingProvider: {
      type: String,
      enum: ['CUSTOM', 'ZOOM', 'GOOGLE_MEET', 'JITSI', 'TEAMS'],
      default: 'CUSTOM'
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
      trim: true
    },
    meetingPassword: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
    },
    notes: {
      type: SessionNotesSchema,
      default: () => ({
        summary: '',
        topics: [],
        actionItems: [],
        privateMentorNotes: ''
      })
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user is required']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast calendar lookups and conflict checking
MentorshipSessionSchema.index({ mentor: 1, startTime: 1, endTime: 1 });
MentorshipSessionSchema.index({ batch: 1, startTime: 1 });
MentorshipSessionSchema.index({ students: 1, startTime: 1 });
MentorshipSessionSchema.index({ status: 1, startTime: 1 });

export const MentorshipSession = mongoose.model<IMentorshipSession>(
  'MentorshipSession',
  MentorshipSessionSchema
);

export default MentorshipSession;
