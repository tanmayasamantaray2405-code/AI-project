import { Request, Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../types';
import { MockDB } from '../utils/mockDb';

// @desc    Create a new task
// @route   POST /tasks
// @access  Private
export const createTask = async (req: AuthRequest, res: Response): Promise<any> => {
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
      const task = MockDB.createTask({
        title,
        category,
        status: status || 'pending',
        userId: resolvedUserId,
        priority: priority || 'medium',
        difficulty: difficulty || 'beginner',
        dueDate,
      });
      return res.status(201).json({ success: true, data: task });
    } catch (error) {
      return res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const task = await Task.create({
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
  } catch (error) {
    return res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get tasks for a specific user
// @route   GET /tasks/:userId
// @access  Private
export const getUserTasks = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const tasks = MockDB.findTasks({ userId });
      // Sort tasks by creation date (newest first)
      tasks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json({ success: true, data: tasks });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Update task status (complete/incomplete)
// @route   PUT /tasks/:id
// @access  Private
export const updateTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status, title, category, priority, difficulty, dueDate } = req.body;

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const task = MockDB.findTaskById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      const updatedTask = MockDB.updateTask(id, { status, title, category, priority, difficulty, dueDate });
      return res.json({ success: true, data: updatedTask });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const task = await Task.findById(id);

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
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Delete a task
// @route   DELETE /tasks/:id
// @access  Private
export const deleteTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const task = MockDB.findTaskById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      MockDB.deleteTask(id);
      return res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};
