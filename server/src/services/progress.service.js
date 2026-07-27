const Progress = require("../models/Progress");
const LearningEvent = require("../models/LearningEvent");
const User = require("../models/User");

async function upsertProgress({ userId, problemId, status, timeSpentMinutes, hintsUsed, attempts }) {
  const updateData = {
    status,
    timeSpentMinutes,
    updatedAt: new Date(),
  };

  if (status === "solved") {
    updateData.solvedAt = new Date();
  }

  const progress = await Progress.findOneAndUpdate(
    { userId, problemId },
    { $set: updateData },
    {
      upsert: true,
      new: true,
    }
  );

  try {
    const Problem = require("../models/Problem");
    const problem = await Problem.findById(problemId).select("topics pattern").lean();
    await LearningEvent.create({
      userId,
      problemId,
      topic: problem?.topics?.[0],
      pattern: problem?.pattern,
      status,
      hintsUsed: hintsUsed || 0,
      attempts: attempts || 1,
      timeSpentMinutes: timeSpentMinutes || 0,
    });
  } catch {
    // non-blocking; learning event is auxiliary
  }

  let isDailyComplete = false;

  if (status === "solved") {
    await updateStreak(userId);
    try {
      const Problem = require("../models/Problem");
      const problem = await Problem.findById(problemId).select("slug").lean();
      const user = await User.findById(userId).select("dailyProblem").lean();
      if (problem && user?.dailyProblem?.problemSlug === problem.slug) {
        isDailyComplete = true;
        await updateDailyStreak(userId);
      }
    } catch {
      // non-blocking
    }
  }

  return { progress, isDailyComplete };
}

async function updateStreak(userId) {
  const user = await User.findById(userId);

  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastSolved = user.streak.lastSolvedDate;

  let current = 1;

  if (lastSolved) {
    const lastStart = new Date(lastSolved);
    lastStart.setHours(0, 0, 0, 0);

    if (lastStart.getTime() === today.getTime()) {
      current = user.streak.current;
    } else if (lastStart.getTime() === yesterday.getTime()) {
      current = user.streak.current + 1;
    }
  }

  const longest = Math.max(current, user.streak.longest || 0);

  await User.findByIdAndUpdate(userId, {
    "streak.current": current,
    "streak.longest": longest,
    "streak.lastSolvedDate": today,
  });
}

async function updateDailyStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastSolved = user.dailyStreak.lastSolvedDate;

  let current = 1;

  if (lastSolved) {
    const lastStart = new Date(lastSolved);
    lastStart.setHours(0, 0, 0, 0);

    if (lastStart.getTime() === today.getTime()) {
      current = user.dailyStreak.current;
    } else if (lastStart.getTime() === yesterday.getTime()) {
      current = user.dailyStreak.current + 1;
    }
  }

  const longest = Math.max(current, user.dailyStreak.longest || 0);

  await User.findByIdAndUpdate(userId, {
    "dailyStreak.current": current,
    "dailyStreak.longest": longest,
    "dailyStreak.lastSolvedDate": today,
  });
}

async function getUserProgress(userId) {
  return Progress.find({ userId })
    .populate("problemId", "title slug difficulty topics")
    .sort({ updatedAt: -1 });
}

async function getProgressForProblem(userId, problemId) {
  return Progress.findOne({ userId, problemId }).populate(
    "problemId",
    "title slug difficulty topics",
  );
}

async function getAnalyticsSummary(userId) {
  const solvedProgress = await Progress.find({ userId, status: "solved" })
    .populate("problemId", "topics")
    .lean();

  const solvedPerTopic = {};
  let totalSolved = 0;

  for (const p of solvedProgress) {
    if (!p.problemId || !p.problemId.topics) continue;
    totalSolved++;
    for (const topic of p.problemId.topics) {
      solvedPerTopic[topic] = (solvedPerTopic[topic] || 0) + 1;
    }
  }

  return { solvedPerTopic, totalSolved };
}

function computeStreak(streak) {
  if (!streak?.lastSolvedDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = new Date(streak.lastSolvedDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return streak.current;
  return 0;
}

module.exports = {
  upsertProgress,
  updateStreak,
  updateDailyStreak,
  getUserProgress,
  getProgressForProblem,
  getAnalyticsSummary,
  computeStreak,
};
