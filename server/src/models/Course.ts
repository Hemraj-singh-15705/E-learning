import mongoose, { Schema } from 'mongoose';
import { ICourse } from '../types/course';

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: String,
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    thumbnail: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      trim: true
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER'
    },
    language: {
      type: String,
      default: 'English'
    },
    duration: String,
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ level: 1 });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
