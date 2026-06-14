"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const TaskSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Index for faster queries on user tasks
TaskSchema.index({ userId: 1, status: 1 });
exports.Task = (0, mongoose_1.model)('Task', TaskSchema);
exports.default = exports.Task;
