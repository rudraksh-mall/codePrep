const mongoose = require("mongoose");

const conversationSubSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["interviewer", "candidate"], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const answerSubSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    question: { type: String, required: true },
    questionType: { type: String, enum: ["technical", "behavioral", "system design", "resume"], required: true },
    topic: { type: String },
    answer: { type: String, default: "" },
    score: { type: Number, default: null },
    strengths: [String],
    improvements: [String],
  },
  { _id: false },
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    interviewType: {
      type: String,
      enum: ["DSA", "Resume-Based", "Behavioral", "Mixed"],
      required: true,
    },
    duration: { type: Number, required: true, min: 5, max: 45 },
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
    questions: [answerSubSchema],
    conversation: [conversationSubSchema],
    currentQuestionNumber: { type: Number, default: 1 },
    totalQuestions: { type: Number, required: true },
    finalReport: {
      overallScore: { type: Number },
      technicalAccuracy: { type: Number },
      communication: { type: Number },
      problemSolving: { type: Number },
      confidence: { type: Number },
      strengths: [String],
      improvements: [String],
      recommendedTopics: [String],
    },
  },
  { timestamps: true },
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
