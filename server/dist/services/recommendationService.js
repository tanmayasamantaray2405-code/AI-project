"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartInsights = exports.getSmartRecommendations = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const mockDb_1 = require("../utils/mockDb");
// Progressive task pool mapping difficulty paths
const PROGRESSIVE_TASKS = {
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
const getUserTasks = async (userId) => {
    if (process.env.USE_MOCK_DB === 'true') {
        return mockDb_1.MockDB.findTasks({ userId });
    }
    return await Task_1.default.find({ userId });
};
// Heuristic engine: recommendations generator
const getSmartRecommendations = async (userId) => {
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
    const categoryCounts = {};
    completedTasks.forEach((task) => {
        categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    });
    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);
    const topCategory = sortedCategories[0] || 'coding';
    // 2. Determine target difficulty per category based on completions
    const getTargetDifficulty = (cat) => {
        const catCompletions = completedTasks.filter((t) => t.category === cat);
        const beginnerCount = catCompletions.filter((t) => t.difficulty === 'beginner' || !t.difficulty).length;
        const intermediateCount = catCompletions.filter((t) => t.difficulty === 'intermediate').length;
        if (beginnerCount >= 3 && intermediateCount < 3) {
            return 'intermediate';
        }
        else if (beginnerCount >= 3 && intermediateCount >= 3) {
            return 'advanced';
        }
        return 'beginner';
    };
    // 3. Peak productivity category
    let preferredCategory = 'coding';
    if (completedTasks.length > 0) {
        const categorySpeedSum = {};
        const categorySpeedCount = {};
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
    const recentCategories = new Set(completedTasks
        .filter((t) => t.completedAt && new Date(t.completedAt) >= oneWeekAgo)
        .map((t) => t.category));
    const scoredPool = [];
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
                const reasons = [];
                // A. Category Preference (Max 30 pts)
                const catRank = sortedCategories.indexOf(cat);
                if (catRank === 0) {
                    score += 30;
                    reasons.push('Matches your most completed focus area');
                }
                else if (catRank === 1) {
                    score += 20;
                    reasons.push('Aligns with your secondary focus area');
                }
                else if (catRank > 1) {
                    score += 10;
                    reasons.push('Aligns with a previously completed topic');
                }
                else {
                    score += 5;
                }
                // B. Difficulty Progression (Max 25 pts)
                if (diff === targetDiff) {
                    score += 25;
                    reasons.push(`Target progression level: ${diff}`);
                }
                else {
                    // If task difficulty is one step away
                    const isOneStep = (diff === 'intermediate' && (targetDiff === 'beginner' || targetDiff === 'advanced')) ||
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
                    category: cat,
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
exports.getSmartRecommendations = getSmartRecommendations;
// Heuristic engine: insights scorer
const getSmartInsights = async (userId) => {
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
    const counts = {};
    completedTasks.forEach((t) => {
        counts[t.category] = (counts[t.category] || 0) + 1;
    });
    const maxCompletions = Math.max(...Object.values(counts));
    const focusScore = Math.round((maxCompletions / totalCompleted) * 100);
    // 3. Consistency Score: Streak + frequency
    const dates = completedTasks
        .map((t) => (t.completedAt ? new Date(t.completedAt) : null))
        .filter((d) => d !== null);
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
                }
                else {
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
    const completedThisWeek = completedTasks.filter((t) => t.completedAt && new Date(t.completedAt) >= oneWeekAgo).length;
    const completedLastWeek = completedTasks.filter((t) => t.completedAt && new Date(t.completedAt) >= twoWeeksAgo && new Date(t.completedAt) < oneWeekAgo).length;
    let growthPercent = 0;
    if (completedLastWeek > 0) {
        growthPercent = Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100);
    }
    else if (completedThisWeek > 0) {
        growthPercent = 15;
    }
    const weeklyGrowthScore = Math.min(100, Math.max(0, 50 + growthPercent));
    // 6. Time of day analysis
    const hours = completedTasks
        .map((t) => (t.completedAt ? new Date(t.completedAt).getHours() : null))
        .filter((h) => h !== null);
    const hourSlots = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
    };
    hours.forEach((h) => {
        if (h >= 6 && h < 12)
            hourSlots.morning++;
        else if (h >= 12 && h < 17)
            hourSlots.afternoon++;
        else if (h >= 17 && h < 21)
            hourSlots.evening++;
        else
            hourSlots.night++;
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
    if (peakSlot === 'morning')
        workingHoursText = '8 AM and 11 AM';
    else if (peakSlot === 'afternoon')
        workingHoursText = '1 PM and 4 PM';
    else if (peakSlot === 'evening')
        workingHoursText = '6 PM and 8 PM';
    // 7. Dynamic text insights generation
    const insights = [];
    if (growthPercent > 0) {
        insights.push(`Your productivity increased by ${growthPercent}% this week.`);
    }
    else if (growthPercent < 0) {
        insights.push(`Your productivity decreased by ${Math.abs(growthPercent)}% this week. Consider blocking focus hours.`);
    }
    else {
        insights.push(`Your productivity remains stable compared to last week.`);
    }
    // Category completion speed analysis
    let categorySpeedText = 'development';
    const categorySpeedSum = {};
    const categorySpeedCount = {};
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
exports.getSmartInsights = getSmartInsights;
