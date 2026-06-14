"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const recommendationRoutes_1 = __importDefault(require("./routes/recommendationRoutes"));
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
(0, db_1.connectDB)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/users', userRoutes_1.default);
app.use('/tasks', taskRoutes_1.default);
app.use('/recommendations', recommendationRoutes_1.default);
// Health Check / Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Smart API System',
        status: 'online',
        version: '1.0.0',
    });
});
// Global Error Handler
app.use((err, req, res, next) => {
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
