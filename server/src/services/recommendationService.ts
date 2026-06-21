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
  hasEnoughData: boolean;
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
// -----------------------------------------------------------------
// CATEGORY LABELS: CODING | DSA | WEB_DEV | FITNESS | HEALTH | LEARNING
// Rule: If task contains [API, Node.js, LeetCode, HTML, CSS, function, code] → NEVER FITNESS
// FITNESS only for: workout, gym, yoga, running, calories, steps, body training
// -----------------------------------------------------------------

/** Keywords that unambiguously signal a CODING / backend task */
const CODING_KEYWORDS = [
  'api', 'node', 'nodejs', 'javascript', 'typescript',
  'function', 'code', 'rest', 'express', 'database', 'sql', 'nosql',
  'schema', 'git', 'docker', 'redis', 'jwt', 'ci/cd', 'microservice',
  'refactor', 'unit test', 'auth', 'endpoint', 'github', 'backend',
  'server', 'controller', 'middleware', 'route', 'deployment'
];

/** Keywords that signal a DSA / algorithmic task */
const DSA_KEYWORDS = [
  'leetcode', 'algorithm', 'dsa', 'data structure', 'dynamic programming',
  'binary search', 'graph', 'tree traversal', 'sorting', 'recursion',
  'complexity', 'big o', 'sliding window', 'two pointer'
];

/** Keywords that signal a WEB_DEV / frontend task */
const WEB_DEV_KEYWORDS = [
  'html', 'css', 'react', 'component', 'landing page', 'responsive',
  'figma', 'ui', 'ux', 'frontend', 'three.js', 'spline', 'framer',
  'animation', 'tailwind', 'sass', 'bootstrap', 'design system'
];

/** Keywords that signal a genuine FITNESS task */
const FITNESS_KEYWORDS = [
  'workout', 'gym', 'yoga', 'running', 'run', 'jog', 'calories', 'steps',
  'body training', 'stretching', 'cardio', 'hiit', 'powerlifting',
  'macronutrient', 'bodyweight', 'squat', 'deadlift', 'plank', 'pushup',
  'pull-up', 'weight', 'reps', 'sets', 'sprint', 'cycling', 'swim'
];

/**
 * Ensures a task title is never mis-categorised as fitness when it contains
 * coding-specific vocabulary. Maps titles to one of:
 * CODING | DSA | WEB_DEV | FITNESS | HEALTH | LEARNING | other
 *
 * Rule: If task contains [API, Node.js, LeetCode, HTML, CSS, function, code]
 *       → NEVER FITNESS
 * FITNESS only when genuine fitness keywords (workout, gym, yoga, etc.) are present.
 */
const correctCategory = (rawCategory: string, title: string): string => {
  const lower = title.toLowerCase();

  // 1. DSA guard — LeetCode / algorithm / data structures
  if (DSA_KEYWORDS.some(kw => lower.includes(kw))) return 'dsa';

  // 2. WEB_DEV guard — HTML / CSS / React / frontend
  if (WEB_DEV_KEYWORDS.some(kw => lower.includes(kw))) return 'web_dev';

  // 3. CODING guard — API / Node / backend
  if (CODING_KEYWORDS.some(kw => lower.includes(kw))) return 'coding';

  // 4. FITNESS guard — ONLY allow fitness when genuine fitness keywords are present
  //    This prevents any coding/tech task from ever landing in FITNESS
  if (rawCategory === 'fitness') {
    return FITNESS_KEYWORDS.some(kw => lower.includes(kw)) ? 'fitness' : 'other';
  }

  // 5. Return the raw category for health / learning / other
  return rawCategory;
};

// -----------------------------------------------------------------
// PROGRESSIVE TASK POOL — Organised by category label
// Categories: coding | dsa | web_dev | fitness | health | learning | other
// -----------------------------------------------------------------
const PROGRESSIVE_TASKS: Record<string, Record<'beginner' | 'intermediate' | 'advanced', string[]>> = {

  // ── CODING: backend, APIs, infrastructure, databases ─────────────
  coding: {
    beginner: [
      'Build a REST API server with Node.js and Express',
      'Learn basics of Git branching and pull requests',
      'Create a basic CRUD backend with MongoDB',
      'Write a Node.js script to fetch data from an API',
    ],
    intermediate: [
      'Write Unit Tests for your auth controller',
      'Design a NoSQL schema for a social feed app',
      'Build an API gateway routing service',
      'Implement JWT token refresh rotation',
      'Refactor backend code using Clean Architecture principles',
    ],
    advanced: [
      'Optimize SQL/NoSQL query execution plans',
      'Configure a Dockerized microservices stack',
      'Set up a CI/CD build pipeline in GitHub Actions',
      'Implement Redis caching for high load endpoints',
      'Conduct a security vulnerability audit on backend dependencies',
    ],
  },

  // ── DSA: Data Structures & Algorithms, LeetCode ──────────────────
  dsa: {
    beginner: [
      'Solve 3 LeetCode easy problems on arrays',
      'Implement a stack and queue from scratch',
      'Study Big-O complexity with practical examples',
      'Trace through a binary search algorithm step by step',
    ],
    intermediate: [
      'Solve 5 LeetCode medium problems on dynamic programming',
      'Implement a graph BFS and DFS traversal in code',
      'Practice the sliding window technique on string problems',
      'Study and implement merge sort and quicksort algorithms',
    ],
    advanced: [
      'Solve 3 LeetCode hard problems on tree data structures',
      'Implement Dijkstra shortest-path algorithm from scratch',
      'Design and solve a system design DSA challenge',
      'Practice two-pointer and recursion backtracking problems',
    ],
  },

  // ── WEB_DEV: HTML, CSS, React, frontend, UI/UX ──────────────────
  web_dev: {
    beginner: [
      'Build a responsive HTML and CSS landing page layout',
      'Create a custom dark-mode color palette with CSS variables',
      'Learn principles of grid and flexbox spacing in CSS',
      'Build a React component with props and useState hook',
    ],
    intermediate: [
      'Animate a micro-interaction button transition in CSS',
      'Design a high-fidelity checkout form in Figma',
      'Build a 3D component with Spline or Three.js',
      'Implement responsive design with CSS media queries',
    ],
    advanced: [
      'Conduct a user experience audit for checkout flows',
      'Build a complete reusable React component design system',
      'Prototype complex micro-interactions in Framer',
      'Perform a Lighthouse performance audit and fix issues',
    ],
  },

  // ── LEARNING: study, reading, knowledge building ─────────────────
  learning: {
    beginner: [
      'Read 2 chapters of a technical book',
      'Feynman technique review of a basic programming concept',
      'Watch a lecture on basic algorithms and take notes',
    ],
    intermediate: [
      'Summarize key learnings into a structured Markdown file',
      'Watch a system design lecture on load balancing',
      'Take notes on MongoDB aggregation performance patterns',
    ],
    advanced: [
      'Write an in-depth whitepaper on distributed databases',
      'Present a technical workshop to colleagues',
      'Review a peer-written research paper and summarize findings',
    ],
  },

  // ── FITNESS: workout, gym, yoga, running, calories, steps ────────
  // Rule: ONLY real physical activity tasks go here — NEVER tech tasks
  fitness: {
    beginner: [
      'Complete a 20-minute full-body stretching session',
      'Walk 8,000 steps today to hit your daily goal',
      'Do a 15-minute light cardio warm-up routine',
      'Complete 3 sets of 10 bodyweight squats and pushups',  // NEW FITNESS TASK 1
    ],
    intermediate: [
      'Complete a 30-minute HIIT workout session',
      'Perform a 5km jogging session at steady pace',
      'Complete a full bodyweight circuit training routine',
      'Do a 45-minute gym session targeting upper body',         // NEW FITNESS TASK 2
    ],
    advanced: [
      'Execute a core powerlifting strength workout',
      'Design a personal 4-week split training program',
      'Log macronutrient ratios and review fitness plateaus',
      'Complete a 10km run and track your pace and calories',    // NEW FITNESS TASK 3
    ],
  },

  // ── HEALTH: mental wellness, sleep, nutrition, mindfulness ───────
  health: {
    beginner: [
      'Meditate for 10 minutes to reduce stress',
      'Take a screen break every 45 minutes today',
      'Drink 8 glasses of water throughout the day',
    ],
    intermediate: [
      'Prepare a healthy meal prep for the week ahead',
      'Practice deep breathing exercises for 15 minutes',
      'Get 8 hours of sleep tonight with a wind-down routine',
    ],
    advanced: [
      'Establish a structured sleep hygiene routine',
      'Log weekly macronutrient intake in a food journal',
      'Perform a digital detox: no screens after 9 PM',
    ],
  },

  // ── OTHER: miscellaneous productivity ────────────────────────────
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
export const getSmartRecommendations = async (userId: string): Promise<any> => {
  const userTasks = await getUserTasks(userId);
  const completedTasks = userTasks.filter((task) => task.status === 'completed');

  if (completedTasks.length < 2) {
    return {
      hasEnoughData: false,
      topCategory: null,
      recommendedTasks: [],
      recommendations: [],
      explanation: 'AI recommendations will appear after sufficient activity data is collected.',
    };
  }

  // Build sets/maps of user's task history to avoid duplicates
  const completedTitles = new Set(completedTasks.map((t) => t.title.toLowerCase().trim()));
  const activeTitles = new Set(userTasks.filter((t) => t.status === 'pending').map((t) => t.title.toLowerCase().trim()));

  // 1. Calculate Category Preferences
  const categoryCounts: Record<string, number> = {};
  completedTasks.forEach((task) => {
    categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  const topCategory = sortedCategories[0] || 'coding';

  // 2. Determine target difficulty per category based on completions
  const getTargetDifficulty = (cat: string): 'beginner' | 'intermediate' | 'advanced' => {
    const catCompletions = completedTasks.filter((t) => t.category === cat);
    const beginnerCount = catCompletions.filter((t) => t.difficulty === 'beginner' || !t.difficulty).length;
    const intermediateCount = catCompletions.filter((t) => t.difficulty === 'intermediate').length;

    if (beginnerCount >= 3 && intermediateCount < 3) {
      return 'intermediate';
    } else if (beginnerCount >= 3 && intermediateCount >= 3) {
      return 'advanced';
    }
    return 'beginner';
  };

  // 3. Peak productivity category
  let preferredCategory = 'coding';
  if (completedTasks.length > 0) {
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
    Object.keys(categorySpeedCount).forEach((cat) => {
      const avg = categorySpeedSum[cat] / categorySpeedCount[cat];
      if (avg < minAvg) {
        minAvg = avg;
        preferredCategory = cat;
      }
    });
  }

  // 4. Recently active categories (completed in past 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentCategories = new Set(
    completedTasks
      .filter((t) => t.completedAt && new Date(t.completedAt) >= oneWeekAgo)
      .map((t) => t.category)
  );

  // 5. Gather and Score all tasks in the PROGRESSIVE_TASKS pool
  interface ScoredTask {
    task: string;
    category: string;
    score: number;
    reason: string;
    difficulty: string;
  }

  const scoredPool: ScoredTask[] = [];

  Object.entries(PROGRESSIVE_TASKS).forEach(([cat, diffMap]) => {
    Object.entries(diffMap).forEach(([diff, taskList]) => {
      const targetDiff = getTargetDifficulty(cat);

      taskList.forEach((title) => {
        const titleClean = title.toLowerCase().trim();

        // Rule: Avoid duplicate recommendations (already completed or currently pending)
        if (completedTitles.has(titleClean) || activeTitles.has(titleClean)) {
          return;
        }

        let score = 0;
        const reasons: string[] = [];

        // A. Category Preference (Max 30 pts)
        const catRank = sortedCategories.indexOf(cat);
        if (catRank === 0) {
          score += 30;
          reasons.push('Matches your most completed focus area');
        } else if (catRank === 1) {
          score += 20;
          reasons.push('Aligns with your secondary focus area');
        } else if (catRank > 1) {
          score += 10;
          reasons.push('Aligns with a previously completed topic');
        } else {
          score += 5;
        }

        // B. Difficulty Progression (Max 25 pts)
        if (diff === targetDiff) {
          score += 25;
          reasons.push(`Target progression level: ${diff}`);
        } else {
          // If task difficulty is one step away
          const isOneStep = 
            (diff === 'intermediate' && (targetDiff === 'beginner' || targetDiff === 'advanced')) ||
            (diff === 'beginner' && targetDiff === 'intermediate') ||
            (diff === 'advanced' && targetDiff === 'intermediate');
          if (isOneStep) {
            score += 10;
          }
        }

        // C. Completion History (Max 10 pts)
        const completionsInCat = categoryCounts[cat] || 0;
        if (completionsInCat > 0) {
          score += Math.min(10, completionsInCat * 3.5);
          reasons.push('Aligns with your category completion history');
        }

        // C. Productivity Pattern (Max 15 pts)
        if (cat === preferredCategory) {
          score += 15;
          reasons.push('In your fastest-completed category');
        }

          // Safety guard: FITNESS tasks must contain genuine fitness keywords.
          // This uses the full FITNESS_KEYWORDS array (not a shorter subset) to
          // prevent any mis-routed coding/tech task from appearing under fitness.
          // Rule: [API, Node.js, LeetCode, HTML, CSS, function, code] → NEVER FITNESS
          if (cat === 'fitness') {
            const lowerTitle = title.toLowerCase();
            const hasFitnessKeyword = FITNESS_KEYWORDS.some(kw => lowerTitle.includes(kw));
            if (!hasFitnessKeyword) {
              // Reject — task lacks genuine physical-activity vocabulary
              return;
            }
          }

        // D. Recommendation Diversity (Max 15 pts)
        // If the user has fiew completions here but is doing other things, encourage diversity
        const completionsCount = categoryCounts[cat] || 0;
        if (completionsCount === 0 && completedTasks.length > 0) {
          score += 15;
          reasons.push('Introduces a fresh category for skill diversity');
        }

        // E. Recent Activity Weight (Max 15 pts)
        if (recentCategories.has(cat)) {
          score += 15;
          reasons.push('Matches active learning topics this week');
        }

        scoredPool.push({
          task: title,
          category: correctCategory(cat, title),
          score: Math.min(100, score),
          reason: reasons.length > 0 ? reasons.join(', ') : 'Suggested skill enhancement',
          difficulty: diff,
        });
      });
    });
  });

  // Sort pool by score descending
  scoredPool.sort((a, b) => b.score - a.score);

  // Take top 3 recommendations
  const topRecommendations = scoredPool.slice(0, 3);

  const recommendedTitles = topRecommendations.map((r) => r.task);
  let explanation = `Based on your recent completions, you are heavily focusing on "${topCategory}". We generated next-level progressive challenges for you!`;

  if (recommendedTitles.length === 0) {
    explanation = 'No new recommendations are available yet. Complete more varied tasks to unlock the next recommendation set.';
  }

  return {
    hasEnoughData: true,
    topCategory,
    recommendedTasks: recommendedTitles,
    explanation,
    recommendations: topRecommendations,
  };
};

// Heuristic engine: insights scorer
export const getSmartInsights = async (userId: string): Promise<any> => {
  const userTasks = await getUserTasks(userId);
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === 'completed');
  const totalCompleted = completedTasks.length;

  // Real data check: Require at least 3 completed tasks to generate insights
  if (totalCompleted < 3) {
    return {
      hasEnoughData: false,
      productivityScore: 0,
      focusScore: 0,
      consistencyScore: 0,
      learningScore: 0,
      weeklyGrowthScore: 0,
      insights: [],
      predictedWorkingHours: 'N/A',
      message: 'AI Insights will appear after sufficient activity data is collected.',
    };
  }

  // 1. Productivity Score: Completion percentage weighted by priority
  const totalWeights = userTasks.reduce((sum, t) => {
    const w = t.priority === 'high' ? 1.5 : t.priority === 'low' ? 0.75 : 1.0;
    return sum + w;
  }, 0);
  const completedWeights = completedTasks.reduce((sum, t) => {
    const w = t.priority === 'high' ? 1.5 : t.priority === 'low' ? 0.75 : 1.0;
    return sum + w;
  }, 0);
  let productivityScore = Math.round((completedWeights / totalWeights) * 100);
  productivityScore = Math.min(100, Math.max(0, productivityScore));

  // 2. Focus Score: Category concentration
  const counts: Record<string, number> = {};
  completedTasks.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  const maxCompletions = Math.max(...Object.values(counts));
  const focusScore = Math.round((maxCompletions / totalCompleted) * 100);

  // 3. Consistency Score: Streak + frequency
  const dates = completedTasks
    .map((t) => (t.completedAt ? new Date(t.completedAt) : null))
    .filter((d): d is Date => d !== null);

  let streak = 0;
  if (dates.length > 0) {
    dates.sort((a, b) => b.getTime() - a.getTime());
    const uniqueDays = Array.from(new Set(dates.map((d) => d.toLocaleDateString())));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const latest = new Date(uniqueDays[0]);
    latest.setHours(0, 0, 0, 0);

    if (latest.getTime() === today.getTime() || latest.getTime() === yesterday.getTime()) {
      streak = 1;
      let checkDate = latest;
      for (let i = 1; i < uniqueDays.length; i++) {
        const next = new Date(uniqueDays[i]);
        next.setHours(0, 0, 0, 0);
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
  const consistencyScore = Math.min(100, streak * 15 + uniqueDaysCount * 6);

  // 4. Learning Score: Based on completed difficulty weights
  const diffWeights = completedTasks.reduce((sum, t) => {
    const d = t.difficulty === 'advanced' ? 3 : t.difficulty === 'intermediate' ? 2 : 1;
    return sum + d;
  }, 0);
  const learningScore = Math.round((diffWeights / (totalCompleted * 3)) * 100);

  // 5. Weekly Growth Score: Task completion output this week vs last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const completedThisWeek = completedTasks.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= oneWeekAgo
  ).length;
  const completedLastWeek = completedTasks.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= twoWeeksAgo && new Date(t.completedAt) < oneWeekAgo
  ).length;

  let growthPercent = 0;
  if (completedLastWeek > 0) {
    growthPercent = Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);
  } else if (completedThisWeek > 0) {
    growthPercent = 15;
  }
  const weeklyGrowthScore = Math.min(100, Math.max(0, 50 + growthPercent));

  // 6. Time of day analysis
  const hours = completedTasks
    .map((t) => (t.completedAt ? new Date(t.completedAt).getHours() : null))
    .filter((h): h is number => h !== null);

  const hourSlots = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  hours.forEach((h) => {
    if (h >= 6 && h < 12) hourSlots.morning++;
    else if (h >= 12 && h < 17) hourSlots.afternoon++;
    else if (h >= 17 && h < 21) hourSlots.evening++;
    else hourSlots.night++;
  });

  let peakSlot = 'evening';
  let maxHourCompletions = 0;
  Object.entries(hourSlots).forEach(([slot, val]) => {
    if (val > maxHourCompletions) {
      maxHourCompletions = val;
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
    insights.push(`Your productivity decreased by ${Math.abs(growthPercent)}% this week. Consider blocking focus hours.`);
  } else {
    insights.push(`Your productivity remains stable compared to last week.`);
  }

  // Category completion speed analysis
  let categorySpeedText = 'development';
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

  insights.push(`You complete ${categorySpeedText} tasks fastest during your preferred ${peakSlot} hours.`);
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  insights.push(`You maintain a task completion rate of ${completionRate}%.`);
  insights.push(`Your most active productivity window is between ${workingHoursText}.`);

  return {
    hasEnoughData: true,
    productivityScore,
    focusScore,
    consistencyScore,
    learningScore,
    weeklyGrowthScore,
    insights,
    predictedWorkingHours: workingHoursText,
  };
};
