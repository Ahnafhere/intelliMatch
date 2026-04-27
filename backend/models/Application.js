const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  matchScore: { type: Number, default: 0 },
  recommendationScore: { type: Number, default: 0 },
  cgpaAtApply: { type: Number, default: 0 },
  skillGapReport: {
    matchedSkills: [{ skill: String, weight: Number }],
    missingSkills: [{
      skill: String,
      weight: Number,
      recommendedLearningPaths: [String],
    }],
    totalRequiredWeight: { type: Number, default: 0 },
    matchedWeight: { type: Number, default: 0 },
    completionRatio: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['Pending', 'Shortlisted', 'Rejected', 'Selected'],
    default: 'Pending',
  },
  timeline: [
    {
      stage: { type: String, required: true },
      note: { type: String, default: '' },
      changedAt: { type: Date, default: Date.now },
    },
  ],
  interviewStatus: {
    type: String,
    enum: ['Not Scheduled', 'Scheduled', 'Completed', 'Selected', 'Rejected'],
    default: 'Not Scheduled',
  },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
