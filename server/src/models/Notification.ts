import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types/notification';

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true
    },
    type: {
      type: String,
      enum: [
        'ASSIGNMENT_CREATED',
        'ASSIGNMENT_GRADED',
        'ASSIGNMENT_RETURNED',
        'SESSION_SCHEDULED',
        'SESSION_UPDATED',
        'ANNOUNCEMENT_PUBLISHED',
        'TEST_AVAILABLE',
        'TEST_GRADED',
        'SYSTEM'
      ],
      default: 'SYSTEM',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    link: {
      type: String,
      trim: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

export default Notification;
