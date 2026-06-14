import { Schema, model } from 'mongoose';
import { ITask } from '../types';

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Task category is required'],
      lowercase: true,
      trim: true,
      enum: {
        values: ['coding', 'design', 'study', 'fitness', 'business', 'health', 'other'],
        message: '{VALUE} is not a supported category',
      },
    },
    status: {
      type: String,
      required: [true, 'Task status is required'],
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries on user tasks
TaskSchema.index({ userId: 1, status: 1 });

export const Task = model<ITask>('Task', TaskSchema);
export default Task;
