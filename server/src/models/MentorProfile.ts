import mongoose, { Schema } from 'mongoose';
import { IMentorProfile } from '../types/mentorProfile';

const mentorProfileSchema = new Schema<IMentorProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    mentorId: {
      type: String,
      required: true,
      unique: true
    },
    designation: String,
    specialization: {
      type: [String],
      default: []
    },
    expertise: {
      type: [String],
      default: []
    },
    experience: Number,
    qualification: String,
    company: String,
    bio: String,
    skills: {
      type: [String],
      default: []
    },
    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String,
      website: String
    },
    availability: {
      days: {
        type: [String],
        default: []
      },
      slots: {
        type: [String],
        default: []
      }
    },
    profileCompletion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const MentorProfile = mongoose.model<IMentorProfile>('MentorProfile', mentorProfileSchema);
export default MentorProfile;
