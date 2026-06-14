"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-api';
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 3000, // 3-second timeout for quick fallback
        });
        console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
        process.env.USE_MOCK_DB = 'false';
    }
    catch (error) {
        console.warn(`\n⚠️  MongoDB Connection Error: ${error.message}`);
        console.warn(`⚠️  Falling back to SaaS local JSON database simulation mode!`);
        console.warn(`⚠️  Data will be persisted locally to 'mock-db.json'\n`);
        process.env.USE_MOCK_DB = 'true';
    }
};
exports.connectDB = connectDB;
