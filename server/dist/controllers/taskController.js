"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getUserTasks = exports.createTask = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const mockDb_1 = require("../utils/mockDb");
// @desc    Create a new task
// @route   POST /tasks
// @access  Private
const createTask = async (req, res) => {
    const { title, category, status, userId, priority, difficulty, dueDate } = req.body;
    // Resolve userId: either from body (for simple REST requests) or auth token
    const resolvedUserId = userId || (req.user ? req.user.id : null);
    if (!resolvedUserId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    if (!title || !category) {
        return res.status(400).json({ success: false, message: 'Title and Category are required' });
    }
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const task = mockDb_1.MockDB.createTask({
                title,
                category,
                status: status || 'pending',
                userId: resolvedUserId,
                priority: priority || 'medium',
                difficulty: difficulty || 'beginner',
                dueDate,
            });
            return res.status(201).json({ success: true, data: task });
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
    try {
        const task = await Task_1.default.create({
            title,
            category,
            status: status || 'pending',
            userId: resolvedUserId,
            priority: priority || 'medium',
            difficulty: difficulty || 'beginner',
            dueDate,
            completedAt: status === 'completed' ? new Date() : undefined,
        });
        return res.status(201).json({ success: true, data: task });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createTask = createTask;
// @desc    Get tasks for a specific user
// @route   GET /tasks/:userId
// @access  Private
const getUserTasks = async (req, res) => {
    const { userId } = req.params;
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const tasks = mockDb_1.MockDB.findTasks({ userId });
            // Sort tasks by creation date (newest first)
            tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json({ success: true, data: tasks });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const tasks = await Task_1.default.find({ userId }).sort({ createdAt: -1 });
        return res.json({ success: true, data: tasks });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserTasks = getUserTasks;
// @desc    Update task status (complete/incomplete)
// @route   PUT /tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    const { id } = req.params;
    const { status, title, category, priority, difficulty, dueDate } = req.body;
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const task = mockDb_1.MockDB.findTaskById(id);
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            const updatedTask = mockDb_1.MockDB.updateTask(id, { status, title, category, priority, difficulty, dueDate });
            return res.json({ success: true, data: updatedTask });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const task = await Task_1.default.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        // Update fields if provided
        if (status !== undefined) {
            task.status = status;
            task.completedAt = status === 'completed' ? new Date() : undefined;
        }
        if (title !== undefined) {
            task.title = title;
        }
        if (category !== undefined) {
            task.category = category;
        }
        if (priority !== undefined) {
            task.priority = priority;
        }
        if (difficulty !== undefined) {
            task.difficulty = difficulty;
        }
        if (dueDate !== undefined) {
            task.dueDate = dueDate;
        }
        const updatedTask = await task.save();
        return res.json({ success: true, data: updatedTask });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTask = updateTask;
// @desc    Delete a task
// @route   DELETE /tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    const { id } = req.params;
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const task = mockDb_1.MockDB.findTaskById(id);
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            mockDb_1.MockDB.deleteTask(id);
            return res.json({ success: true, message: 'Task deleted successfully' });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const task = await Task_1.default.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        await task.deleteOne();
        return res.json({ success: true, message: 'Task deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteTask = deleteTask;
