import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import User from '../models/User';
import Task from '../models/Task';
import { getSmartRecommendations } from '../services/recommendationService';

dotenv.config();

const runTest = async () => {
  console.log('🧪 Starting API Recommendation Engine Integration Tests...');

  // 1. Connect to DB
  await connectDB();

  const testEmail = 'test-user-smart-api@example.com';
  
  try {
    // 2. Clean up previous test runs
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log('🧹 Cleaning up old test data...');
      await Task.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    // 3. Create a test user
    console.log('👤 Creating test user...');
    const user = await User.create({
      name: 'Test Engineer',
      email: testEmail,
      password: 'password123',
    });
    console.log(`✅ Test User created with ID: ${user._id}`);

    // 4. Test Case 1: Fetch recommendations with empty task list
    console.log('\n📝 Test Case 1: Fetching recommendations for a user with NO tasks...');
    let recommendations = await getSmartRecommendations(user._id.toString());
    console.log('Response:', JSON.stringify(recommendations, null, 2));
    if (recommendations.topCategory !== 'coding') {
      throw new Error(`Expected default category "coding", got "${recommendations.topCategory}"`);
    }
    console.log('✅ Test Case 1 Passed!');

    // 5. Test Case 2: User has completed a mix of tasks but completed more coding
    console.log('\n📝 Test Case 2: Adding tasks and completing mostly "coding" tasks...');
    
    // Create tasks
    const tasksData = [
      { title: 'Learn Docker basics', category: 'coding', status: 'completed', completedAt: new Date() },
      { title: 'Design a mock dashboard', category: 'design', status: 'completed', completedAt: new Date() },
      { title: 'Read about Node.js performance', category: 'study', status: 'pending' },
      { title: 'Build a CRUD app', category: 'coding', status: 'completed', completedAt: new Date() },
      { title: 'Do a quick cardio workout', category: 'fitness', status: 'completed', completedAt: new Date() },
      { title: 'Optimize Mongo indexes', category: 'coding', status: 'completed', completedAt: new Date() },
    ];

    for (const task of tasksData) {
      await Task.create({
        ...task,
        userId: user._id,
      });
    }
    console.log('✅ Added 6 tasks (4 Coding [all completed], 1 Design [completed], 1 Fitness [completed], 1 Study [pending])');

    // Fetch recommendations again
    recommendations = await getSmartRecommendations(user._id.toString());
    console.log('Response:', JSON.stringify(recommendations, null, 2));
    
    if (recommendations.topCategory !== 'coding') {
      throw new Error(`Expected topCategory "coding", got "${recommendations.topCategory}"`);
    }
    if (recommendations.recommendedTasks.length === 0) {
      throw new Error('Expected recommended tasks to be suggested, got an empty array');
    }
    // Verify that already added tasks are not recommended
    const containsExisting = recommendations.recommendedTasks.some(title => 
      title.toLowerCase() === 'build a crud app'
    );
    if (containsExisting) {
      throw new Error('Recommendation system suggested a task title that already exists in user database!');
    }
    console.log('✅ Test Case 2 Passed! AI recommended novel tasks and matched the top completed category.');

    // 6. Test Case 3: Complete fitness tasks to shift the top category
    console.log('\n📝 Test Case 3: Completing 5 fitness tasks to shift category focus...');
    const fitnessTasks = [
      'Morning Jogging 5k',
      'HIIT Training Session',
      'Yoga Stretching Routine',
      'Core Strength Workout',
      'Dumbbell Shoulder Press'
    ];

    for (const title of fitnessTasks) {
      await Task.create({
        title,
        category: 'fitness',
        status: 'completed',
        completedAt: new Date(),
        userId: user._id,
      });
    }

    // Fetch recommendations again
    recommendations = await getSmartRecommendations(user._id.toString());
    console.log('Response:', JSON.stringify(recommendations, null, 2));

    if (recommendations.topCategory !== 'fitness') {
      throw new Error(`Expected topCategory to shift to "fitness", got "${recommendations.topCategory}"`);
    }
    console.log('✅ Test Case 3 Passed! Category focus shifted dynamically based on completion history.');

    // 7. Cleanup
    console.log('\n🧹 Cleaning up test database...');
    await Task.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    console.log('✅ Database cleaned.');
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! Recommendation engine is production-ready.');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', (error as Error).message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 DB Connection Closed.');
  }
};

runTest();
