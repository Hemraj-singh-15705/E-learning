import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { NotificationType } from '../types/notification';

export interface SendNotificationPayload {
  recipient: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export const createNotification = async (payload: SendNotificationPayload) => {
  try {
    const notification = await Notification.create({
      recipient: payload.recipient,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      read: false
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const createBulkNotifications = async (
  recipients: Array<string | mongoose.Types.ObjectId>,
  payload: Omit<SendNotificationPayload, 'recipient'>
) => {
  try {
    if (!recipients || recipients.length === 0) return [];
    
    // Deduplicate recipients
    const uniqueRecipients = Array.from(
      new Set(recipients.map((r) => r.toString()))
    );

    const docs = uniqueRecipients.map((recipientId) => ({
      recipient: new mongoose.Types.ObjectId(recipientId),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      read: false
    }));

    const result = await Notification.insertMany(docs);
    return result;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    return [];
  }
};
