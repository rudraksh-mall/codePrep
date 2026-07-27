const mongoose = require("mongoose");
const Progress = require("../models/Progress");
const Problem = require("../models/Problem");
const User = require("../models/User");
const { computeStreak } = require("./progress.service");

async function getSummary(userId) {
  const [solved, attempted] = await Promise.all([
    Progress.countDocuments({ userId, status: "solved" }),
    Progress.countDocuments({ userId, status: "attempted" }),
  ]);

  const user = await User.findById(userId).select("streak dailyStreak");

  return {
    totalSolved: solved,
    totalAttempted: attempted,
    currentStreak: user ? computeStreak(user.streak) : 0,
    longestStreak: user?.streak?.longest || 0,
    currentDailyStreak: user ? computeStreak(user.dailyStreak) : 0,
    longestDailyStreak: user?.dailyStreak?.longest || 0,
  };
}

async function getByTopic(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const [topicTotals, userProgress] = await Promise.all([
    Problem.aggregate([
      { $unwind: "$topics" },
      { $group: { _id: "$topics", total: { $sum: 1 } } },
    ]),
    Progress.aggregate([
      { $match: { userId: objectId } },
      {
        $lookup: {
          from: "problems",
          localField: "problemId",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: "$problem" },
      { $unwind: "$problem.topics" },
      {
        $group: {
          _id: "$problem.topics",
          solved: { $sum: { $cond: [{ $eq: ["$status", "solved"] }, 1, 0] } },
          attempted: {
            $sum: { $cond: [{ $eq: ["$status", "attempted"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const progressMap = {};
  for (const p of userProgress) {
    progressMap[p._id] = { solved: p.solved, attempted: p.attempted };
  }

  const results = topicTotals
    .map((t) => ({
      topic: t._id,
      solved: progressMap[t._id]?.solved || 0,
      attempted: progressMap[t._id]?.attempted || 0,
      total: t.total,
    }))
    .sort((a, b) => b.total - a.total);

  return results;
}

async function getByDifficulty(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const results = await Progress.aggregate([
    { $match: { userId: objectId } },
    {
      $lookup: {
        from: "problems",
        localField: "problemId",
        foreignField: "_id",
        as: "problem",
      },
    },
    { $unwind: "$problem" },
    {
      $group: {
        _id: "$problem.difficulty",
        solved: { $sum: { $cond: [{ $eq: ["$status", "solved"] }, 1, 0] } },
        attempted: {
          $sum: { $cond: [{ $eq: ["$status", "attempted"] }, 1, 0] },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        difficulty: "$_id",
        solved: 1,
        attempted: 1,
        total: 1,
      },
    },
  ]);

  return results;
}

async function getOverTime(userId, days = 365) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const results = await Progress.aggregate([
  {
    $match: {
      userId: objectId,
      status: "solved",
      solvedAt: { $gte: cutoff },
    },
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$solvedAt",
          timezone: "Asia/Kolkata",
        },
      },
      count: { $sum: 1 },
    },
  },
  {
    $sort: { _id: 1 },
  },
  {
    $project: {
      _id: 0,
      date: "$_id",
      count: 1,
    },
  },
]);

return results;
}

// ─── Category mapping for interview readiness breakdown ───
const CATEGORY_TOPICS = {
  'DSA': [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs',
    'Dynamic Programming', 'Recursion', 'Sorting', 'Two Pointers', 'Sliding Window',
    'Greedy', 'Divide and Conquer', 'Backtracking', 'Binary Search', 'Heap',
    'Quickselect', 'Topological Sort', 'BFS', 'DFS', 'BST', 'Trie', 'Union Find',
    'Segment Tree', 'Binary Indexed Tree', 'Bit Manipulation', 'Matrix',
    'Hash Table', 'Hash Map', 'Traversal', 'Merging', 'Floyd\'s Cycle Detection',
    'Prefix/Suffix', 'Voting Algorithm', 'Expand Around Center', 'Math',
    'Binary Search Tree',
  ],
  'System Design': ['Design', 'System Design', 'Architecture', 'Microservices',
    'Distributed Systems', 'Scalability', 'API Design', 'Database Design',
    'Object Oriented', 'OOP',
  ],
  'CS Fundamentals': ['Operating Systems', 'OS', 'Networking', 'Computer Networks',
    'DBMS', 'Databases', 'SQL', 'Compiler Design',
  ],
  'Behavioral': ['Behavioral', 'Leadership', 'Communication', 'Teamwork',
    'Conflict Resolution',
  ],
};

function categorizeTopic(topic) {
  for (const [category, keywords] of Object.entries(CATEGORY_TOPICS)) {
    if (keywords.some((kw) => topic.toLowerCase() === kw.toLowerCase())) {
      return category;
    }
  }
  return 'Other';
}

async function getConsistency(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userId).select('streak dailyStreak');
  const totalSolved = await Progress.countDocuments({ userId: objectId, status: 'solved' });

  const firstSolve = await Progress.findOne({ userId: objectId, status: 'solved', solvedAt: { $ne: null } })
    .sort({ solvedAt: 1 })
    .select('solvedAt')
    .lean();

  let avgPerDay = 0;
  let avgPerWeek = 0;
  if (firstSolve?.solvedAt && totalSolved > 0) {
    const daysSince = Math.max(1, Math.ceil((Date.now() - new Date(firstSolve.solvedAt).getTime()) / (1000 * 60 * 60 * 24)));
    const weeksSince = Math.max(1, Math.ceil(daysSince / 7));
    avgPerDay = parseFloat((totalSolved / daysSince).toFixed(2));
    avgPerWeek = parseFloat((totalSolved / weeksSince).toFixed(2));
  }

  // Best solving day
  const bestDay = await Progress.aggregate([
    { $match: { userId: objectId, status: 'solved', solvedAt: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$solvedAt', timezone: 'Asia/Kolkata' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 1 },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ]);

  // Best solving week
  const bestWeek = await Progress.aggregate([
    { $match: { userId: objectId, status: 'solved', solvedAt: { $ne: null } } },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: { date: '$solvedAt', timezone: 'Asia/Kolkata' } },
          week: { $isoWeek: { date: '$solvedAt', timezone: 'Asia/Kolkata' } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        week: '$_id.week',
        count: 1,
      },
    },
  ]);

  return {
    longestStreak: user?.streak?.longest || 0,
    longestDailyStreak: user?.dailyStreak?.longest || 0,
    currentDailyStreak: user ? computeStreak(user.dailyStreak) : 0,
    bestSolvingDay: bestDay.length > 0 ? bestDay[0] : null,
    bestSolvingWeek: bestWeek.length > 0 ? bestWeek[0] : null,
    averageSolvesPerDay: avgPerDay,
    averageSolvesPerWeek: avgPerWeek,
  };
}

async function getMonthlyTrends(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const results = await Progress.aggregate([
    { $match: { userId: objectId, status: 'solved', solvedAt: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$solvedAt', timezone: 'Asia/Kolkata' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', count: 1 } },
  ]);

  return results;
}

async function getTopicGrowth(userId, days = 30) {
  const objectId = new mongoose.Types.ObjectId(userId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const results = await Progress.aggregate([
    { $match: { userId: objectId, status: 'solved', solvedAt: { $gte: cutoff } } },
    { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
    { $unwind: '$problem' },
    { $unwind: '$problem.topics' },
    { $group: { _id: '$problem.topics', solved: { $sum: 1 } } },
    { $sort: { solved: -1 } },
    { $project: { _id: 0, topic: '$_id', solved: 1 } },
  ]);

  // Merge with all-time topic data to show current total alongside growth
  const allTimeTopics = await getByTopic(userId);
  const allTimeMap = {};
  for (const t of allTimeTopics) {
    allTimeMap[t.topic] = { solved: t.solved, total: t.total };
  }

  for (const r of results) {
    if (allTimeMap[r.topic]) {
      r.total = allTimeMap[r.topic].total;
      r.allTimeSolved = allTimeMap[r.topic].solved;
    }
  }

  return results;
}

async function getTimeInvestment(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const totals = await Progress.aggregate([
    { $match: { userId: objectId, timeSpentMinutes: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$timeSpentMinutes' },
        avgMinutes: { $avg: '$timeSpentMinutes' },
        maxMinutes: { $max: '$timeSpentMinutes' },
        sessionCount: { $sum: 1 },
      },
    },
  ]);

  if (totals.length === 0) return null;

  const r = totals[0];

  // Time by topic
  const byTopicResult = await Progress.aggregate([
    { $match: { userId: objectId, timeSpentMinutes: { $gt: 0 } } },
    { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
    { $unwind: '$problem' },
    { $unwind: '$problem.topics' },
    {
      $group: {
        _id: '$problem.topics',
        minutes: { $sum: '$timeSpentMinutes' },
      },
    },
    { $sort: { minutes: -1 } },
    { $project: { _id: 0, topic: '$_id', minutes: 1 } },
  ]);

  return {
    totalMinutes: r.totalMinutes,
    averageSessionMinutes: Math.round(r.avgMinutes),
    longestSessionMinutes: r.maxMinutes,
    sessionCount: r.sessionCount,
    byTopic: byTopicResult,
  };
}

async function getReadinessBreakdown(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const categoryData = {};
  for (const cat of Object.keys(CATEGORY_TOPICS)) {
    categoryData[cat] = { total: 0, solved: 0 };
  }
  categoryData['Other'] = { total: 0, solved: 0 };

  // Get total problems per topic
  const topicTotals = await Problem.aggregate([
    { $unwind: '$topics' },
    { $group: { _id: '$topics', total: { $sum: 1 } } },
  ]);

  for (const t of topicTotals) {
    const cat = categorizeTopic(t._id);
    categoryData[cat].total += t.total;
  }

  // Get solved problems per topic
  const solvedByTopic = await Progress.aggregate([
    { $match: { userId: objectId, status: 'solved' } },
    { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
    { $unwind: '$problem' },
    { $unwind: '$problem.topics' },
    { $group: { _id: '$problem.topics', solved: { $sum: 1 } } },
  ]);

  for (const s of solvedByTopic) {
    const cat = categorizeTopic(s._id);
    categoryData[cat].solved += s.solved;
  }

  const breakdown = Object.entries(categoryData)
    .filter(([, v]) => v.total > 0)
    .map(([category, data]) => ({
      category,
      solved: data.solved,
      total: data.total,
      mastery: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.mastery - a.mastery);

  return breakdown;
}

async function getTopicMastery(userId) {
  const topicData = await getByTopic(userId);
  return topicData
    .map((t) => ({
      topic: t.topic,
      solved: t.solved,
      total: t.total,
      mastery: t.total > 0 ? Math.round((t.solved / t.total) * 100) : 0,
    }))
    .sort((a, b) => b.mastery - a.mastery);
}

async function getWeakTopics(userId) {
  const topicData = await getByTopic(userId);

  const weak = topicData
    .filter((t) => t.solved + t.attempted > 0)
    .map((t) => {
      const attempted = t.solved + t.attempted;
      const weaknessPct = Math.round((1 - t.solved / attempted) * 100);
      return {
        topic: t.topic,
        solved: t.solved,
        attempted,
        total: t.total,
        weaknessPct,
      };
    })
    .sort((a, b) => b.weaknessPct - a.weaknessPct);

  return weak.filter((t) => t.weaknessPct > 0);
}

module.exports = {
  getSummary,
  getByTopic,
  getByDifficulty,
  getOverTime,
  getConsistency,
  getMonthlyTrends,
  getTopicGrowth,
  getTimeInvestment,
  getReadinessBreakdown,
  getTopicMastery,
  getWeakTopics,
};
