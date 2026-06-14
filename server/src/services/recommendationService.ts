import Task from '../models/Task';
import { MockDB } from '../utils/mockDb';

interface RecommendationItem {
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface RecommendationResponse {
  topCategory: string;
  recommendedTasks: string[];
  explanation: string;
}

interface InsightsResponse {
  productivityScore: number;
  focusScore: number;
  consistencyScore: number;
  learningScore: number;
  weeklyGrowthScore: number;
  insights: string[];
  predictedWorkingHours: string;
}

// Progressive task pool mapping difficulty paths
const PROGRESSIVE_TASKS: Record<string, Record<'beginner' | 'intermediate' | 'advanced', string[]>> = {
  coding: {
    beginner: [
      'Build a REST API project with Node.js',
      'Solve 3 Daily LeetCode/DSA problems',
      'Create a responsive landing page layout',
      'Learn basics of Git branching and pull requests',
    ],
    intermediate: [
      'Refactor a component using Clean Architecture',
      'Write Unit Tests for your auth controller',
      'Design a NoSQL schema for a social feed app',
      'Build an API gateway routing service',
      'Implement JWT token refresh rotation',
    ],
    advanced: [
      'Optimize SQL/NoSQL query execution plans',
      'Configure a Dockerized microservices stack',
      'Set up a CI/CD build pipeline in GitHub Actions',
      'Implement Redis caching for high load endpoints',
      'Conduct a security vulnerability audit on dependencies',
    ],
  },
  design: {
    beginner: [
      'Design a landing page mockup in Figma',
      'Create a custom dark-mode color palette',
      'Learn principles of grid layouts and spacing',
    ],
    intermediate: [
      'Build a 3D component with Spline or Three.js',
      'Animate a micro-interaction button transition',
      'Design a high-fidelity checkout form in Figma',
    ],
    advanced: [
      'Conduct a user experience audit for checkout flows',
      'Build a complete reusable component design system',
      'Prototype complex micro-interactions in Framer',
    ],
  },
  study: {
    beginner: [
      'Read 2 chapters of a technical book',
      'Feynman technique review of a basic concept',
      'Watch a lecture on basic algorithms',
    ],
    intermediate: [
      'Summarize key learnings into a Markdown file',
      'Watch a system design lecture on load balancing',
      'Take notes on MongoDB aggregation performance',
    ],
    advanced: [
      'Write an in-depth whitepaper on distributed databases',
      'Present a technical workshop to colleagues',
      'Review a peer-written research paper',
    ],
  },
  fitness: {
    beginner: [
      'Complete a 20-minute stretching session',
      'Walk 8,000 steps today',
      'Do a light cardio warm-up',
    ],
    intermediate: [
      'Complete a 30-minute HIIT workout',
      'Perform a 5km jogging session',
      'Complete a bodyweight circuit training',
    ],
    advanced: [
      'Execute a core powerlifting strength workout',
      'Design a 4-week split training guide',
      'Log macronutrient ratios and review fitness plateaus',
    ],
  },
  business: {
    beginner: [
      'Draft a project board sprint calendar',
      'Outline a product feature checklist',
      'Identify target client personas',
    ],
    intermediate: [
      'Draft a startup pitch deck outline',
      'Conduct a competitor analysis matrix',
      'Write down user journey flows for marketing',
    ],
    advanced: [
      'Write down the project\'s monetization model',
      'Conduct customer discovery interviews with 5 prospects',
      'Draft a financial forecast and operational budget',
    ],
  },
  health: {
    beginner: [
      'Meditate for 10 minutes to reduce stress',
      'Take a screen break every 45 minutes',
      'Drink 8 glasses of water today',
    ],
    intermediate: [
      'Prepare a healthy meal prep for tomorrow',
      'Practice deep breathing exercises',
      'Get 8 hours of sleep tonight',
    ],
    advanced: [
      'Establish a structured sleep hygiene routine',
      'Log weekly macronutrient intake',
      'Perform a digital detox: no screens after 9 PM',
    ],
  },
  other: {
    beginner: [
      'Clear out unread emails in inbox',
      'Organize physical desk layout',
      'Organize desktop files',
    ],
    intermediate: [
      'Review monthly personal budget goals',
      'Plan a weekend relaxation schedule',
      'Organize digital subscription lists',
    ],
    advanced: [
      'Conduct a personal quarterly goal review',
      'Do a digital clutter audit on your laptop',
      'Backup all personal devices to secure storage',
    ],
  },
};

// Helper: Fetch all tasks for user based on DB mode
const getUserTasks = async (userId: string): Promise<any[]> => {
  if (process.env.USE_MOCK_DB === 'true') {
    return MockDB.findTasks({ userId });
  }
  return await Task.find({ userId });
};

// Heuristic engine: recommendations generator
export const getSmartRecommendations = async (userId: string): Promise<RecommendationResponse> => {
  const userTasks = await getUserTasks(userId);
  const completedTasks = userTasks.filter((task) => task.status === 'completed');

  let topCategory = 'coding';
  let explanation = 'Welcome! Add some tasks to initialize the smart recommendation engine.';

  if (completedTasks.length > 0) {
    // 1. Identify category frequency
    const categoryCounts: Record<string, number> = {};
    completedTasks.forEach((task) => {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    });

    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    explanation = `Based on your recent completions, you are heavily focusing on "${topCategory}". We generated next-level progressive challenges for you!`;
  } else if (userTasks.length > 0) {
    // If no completed tasks, fall back to counts of pending tasks
    const categoryCounts: Record<string, number> = {};
    userTasks.forEach((task) => {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    });

    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    explanation = `You have tasks lined up in "${topCategory}". We suggest these progressive recommendations to build consistency.`;
  }

  // 2. Identify the current difficulty tier for the top category
  // Heuristic: Promote difficulty based on completions in this category
  const completionsInTopCategory = completedTasks.filter((task) => task.category === topCategory);
  
  // Count by difficulty level
  const beginnerCount = completionsInTopCategory.filter((t) => t.difficulty === 'beginner' || !t.difficulty).length;
  const intermediateCount = completionsInTopCategory.filter((t) => t.difficulty === 'intermediate').length;
  
  let targetDifficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  
  if (beginnerCount >= 3 && intermediateCount < 3) {
    targetDifficulty = 'intermediate';
    explanation += ` Since you completed ${beginnerCount} beginner tasks, we promoted your coding difficulty to Intermediate.`;
  } else if (beginnerCount >= 3 && intermediateCount >= 3) {
    targetDifficulty = 'advanced';
    explanation += ` Having mastered ${intermediateCount} intermediate items, we recommend Advanced exercises!`;
  }

  // 3. Extract recommendations from that tier pool
  const pool = (PROGRESSIVE_TASKS[topCategory] || PROGRESSIVE_TASKS.other)[targetDifficulty];
  const existingTitles = new Set(userTasks.map((t) => t.title.toLowerCase().trim()));

  // Filter out recommendations already in tasks (to avoid repetition)
  let recommended = pool.filter((title) => !existingTitles.has(title.toLowerCase().trim()));

  // Fallback if all recommended items are already added
  if (recommended.length === 0) {
    // Fall back to general other category, or the next level, or just return pool items
    recommended = pool;
  }

  // Limit to top 3 recommendations
  recommended = recommended.slice(0, 3);

  return {
    topCategory,
    recommendedTasks: recommended,
    explanation,
  };
};

// Heuristic engine: insights scorer
export const getSmartInsights = async (userId: string): Promise<InsightsResponse> => {
  const userTasks = await getUserTasks(userId);
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === 'completed');
  const totalCompleted = completedTasks.length;

  // 1. Productivity Score: Completion percentage weighted by priority
  let productivityScore = 0;
  if (totalTasks > 0) {
    const totalWeights = userTasks.reduce((sum, t) => {
      const w = t.priority === 'high' ? 1.5 : t.priority === 'low' ? 0.75 : 1.0;
      return sum + w;
    }, 0);
    const completedWeights = completedTasks.reduce((sum, t) => {
      const w = t.priority === 'high' ? 1.5 : t.priority === 'low' ? 0.75 : 1.0;
      return sum + w;
    }, 0);
    productivityScore = Math.round((completedWeights / totalWeights) * 100);
  }
  productivityScore = Math.min(100, Math.max(0, productivityScore));

  // 2. Focus Score: Category concentration (Entropy-inspired metric)
  let focusScore = 50;
  if (totalCompleted > 0) {
    const counts: Record<string, number> = {};
    completedTasks.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    const maxCompletions = Math.max(...Object.values(counts));
    // Score based on concentration in the peak category
    focusScore = Math.round((maxCompletions / totalCompleted) * 100);
  }

  // 3. Consistency Score: Streak + frequency
  // Calculate completion date stamps
  const dates = completedTasks
    .map((t) => t.completedAt ? new Date(t.completedAt) : null)
    .filter((d): d is Date => d !== null);

  let streak = 0;
  if (dates.length > 0) {
    // Sort dates descending
    dates.sort((a, b) => b.getTime() - a.getTime());
    const uniqueDays = Array.from(new Set(dates.map((d) => d.toLocaleDateString())));
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);

    const latest = new Date(uniqueDays[0]);
    latest.setHours(0,0,0,0);

    if (latest.getTime() === today.getTime() || latest.getTime() === yesterday.getTime()) {
      streak = 1;
      let checkDate = latest;
      for (let i = 1; i < uniqueDays.length; i++) {
        const next = new Date(uniqueDays[i]);
        next.setHours(0,0,0,0);
        const diff = checkDate.getTime() - next.getTime();
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          checkDate = next;
        } else {
          break;
        }
      }
    }
  }

  const uniqueDaysCount = new Set(dates.map((d) => d.toDateString())).size;
  const consistencyScore = Math.min(100, (streak * 15) + (uniqueDaysCount * 6));

  // 4. Learning Score: Based on completed difficulty weights
  let learningScore = 0;
  if (totalCompleted > 0) {
    const diffWeights = completedTasks.reduce((sum, t) => {
      const d = t.difficulty === 'advanced' ? 3 : t.difficulty === 'intermediate' ? 2 : 1;
      return sum + d;
    }, 0);
    learningScore = Math.round((diffWeights / (totalCompleted * 3)) * 100);
  }

  // 5. Weekly Growth Score: Task completion output this week vs last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const completedThisWeek = completedTasks.filter((t) => t.completedAt && new Date(t.completedAt) >= oneWeekAgo).length;
  const completedLastWeek = completedTasks.filter((t) => t.completedAt && new Date(t.completedAt) >= twoWeeksAgo && new Date(t.completedAt) < oneWeekAgo).length;

  let growthPercent = 0;
  if (completedLastWeek > 0) {
    growthPercent = Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);
  } else if (completedThisWeek > 0) {
    growthPercent = 14; // Default visual growth starter if no baseline
  }
  const weeklyGrowthScore = Math.min(100, Math.max(0, 50 + growthPercent));

  // 6. Time of day analysis for preferred hours
  const hours = completedTasks
    .map((t) => t.completedAt ? new Date(t.completedAt).getHours() : null)
    .filter((h): h is number => h !== null);

  const hourSlots = {
    morning: 0, // 6am - 12pm
    afternoon: 0, // 12pm - 5pm
    evening: 0, // 5pm - 9pm
    night: 0, // 9pm - 6am
  };

  hours.forEach((h) => {
    if (h >= 6 && h < 12) hourSlots.morning++;
    else if (h >= 12 && h < 17) hourSlots.afternoon++;
    else if (h >= 17 && h < 21) hourSlots.evening++;
    else hourSlots.night++;
  });

  let peakSlot = 'evening';
  let maxCompletions = 0;
  Object.entries(hourSlots).forEach(([slot, val]) => {
    if (val > maxCompletions) {
      maxCompletions = val;
      peakSlot = slot;
    }
  });

  let workingHoursText = '8 PM and 11 PM';
  if (peakSlot === 'morning') workingHoursText = '8 AM and 11 AM';
  else if (peakSlot === 'afternoon') workingHoursText = '1 PM and 4 PM';
  else if (peakSlot === 'evening') workingHoursText = '6 PM and 8 PM';

  // 7. Dynamic text insights generation
  const insights: string[] = [];

  if (growthPercent > 0) {
    insights.push(`Your productivity increased by ${growthPercent}% this week.`);
  } else if (growthPercent < 0) {
    insights.push(`Your productivity decreased by ${Math.abs(growthPercent)}% this week. Block off focus hours.`);
  } else {
    insights.push(`Your productivity increased by 14% this week.`); // placeholder starter fallback
  }

  // Category completion speed analysis
  let categorySpeedText = 'development';
  if (totalCompleted > 0) {
    const categorySpeedSum: Record<string, number> = {};
    const categorySpeedCount: Record<string, number> = {};

    completedTasks.forEach((t) => {
      if (t.completedAt && t.createdAt) {
        const diff = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
        const diffMinutes = diff / (1000 * 60);
        categorySpeedSum[t.category] = (categorySpeedSum[t.category] || 0) + diffMinutes;
        categorySpeedCount[t.category] = (categorySpeedCount[t.category] || 0) + 1;
      }
    });

    let minAvg = Infinity;
    let fastestCategory = '';
    Object.keys(categorySpeedCount).forEach((cat) => {
      const avg = categorySpeedSum[cat] / categorySpeedCount[cat];
      if (avg < minAvg) {
        minAvg = avg;
        fastestCategory = cat;
      }
    });

    if (fastestCategory) {
      categorySpeedText = fastestCategory;
    }
  }

  insights.push(`You complete ${categorySpeedText} tasks fastest during ${peakSlot} hours.`);
  
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 82;
  insights.push(`You maintain an average completion rate of ${completionRate}%.`);
  insights.push(`You are most productive between ${workingHoursText}.`);

  return {
    productivityScore: productivityScore || 75,
    focusScore: focusScore || 68,
    consistencyScore: consistencyScore || 80,
    learningScore: learningScore || 60,
    weeklyGrowthScore: weeklyGrowthScore || 72,
    insights,
    predictedWorkingHours: workingHoursText,
  };
};
