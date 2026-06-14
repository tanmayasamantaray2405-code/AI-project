import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import recommendationRoutes from './routes/recommendationRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/recommendations', recommendationRoutes);

// Health Check / Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Smart API System',
    status: 'online',
    version: '1.0.0',
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`📡 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
