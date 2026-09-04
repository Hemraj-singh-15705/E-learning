import mongoose, { Schema } from 'mongoose';
import { IStudentProfile } from '../types/studentProfile';

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true
    },
    education: {
      degree: String,
      fieldOfStudy: String,
      institution: String,
      graduationYear: Number
    },
    college: String,
    course: String,
    year: String,
    city: String,
    state: String,
    country: String,
    skills: {
      type: [String],
      default: []
    },
    goals: {
      type: [String],
      default: []
    },
    bio: String,
    profileCompletion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', studentProfileSchema);
export default StudentProfile;
