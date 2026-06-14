import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-api';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000, // 3-second timeout for quick fallback
    });
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.warn(`\n⚠️  MongoDB Connection Error: ${(error as Error).message}`);
    console.warn(`⚠️  Falling back to SaaS local JSON database simulation mode!`);
    console.warn(`⚠️  Data will be persisted locally to 'mock-db.json'\n`);
    process.env.USE_MOCK_DB = 'true';
  }
};
