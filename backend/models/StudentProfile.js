const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  cgpa: { type: Number, min: 0, max: 4 },
  department: { type: String },
  graduationYear: { type: Number },
  certifications: [{ type: String }],
  projects: [{ type: String }],
  skills: [
    {
      name: { type: String, required: true },
      proficiency: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Intermediate'
      },
      endorsements: { type: Number, default: 0 },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  githubProfile: {
    username: { type: String },
    profileUrl: { type: String },
    repoCount: { type: Number },
    lastImported: { type: Date }
  },
  verifiedSkills: [
    {
      skill: { type: String, required: true },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifierRole: { type: String },
      source: {
        type: String,
        enum: ['certification', 'project_review', 'internship_performance', 'manual'],
        default: 'manual',
      },
      note: { type: String, default: '' },
      badgeLevel: {
        type: String,
        enum: ['gold', 'silver', 'bronze'],
        default: 'bronze',
      },
      cgpa: { type: Number, default: 0 },
      skillMatch: { type: Number, default: 0 },
      verifiedAt: { type: Date, default: Date.now },
    },
  ],
  cvUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
