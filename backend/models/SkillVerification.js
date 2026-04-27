const mongoose = require('mongoose');

const skillVerificationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
  internshipTitle: { type: String, default: '' },
  skill: { type: String, required: true },
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
  verificationMode: {
    type: String,
    enum: ['cgpa_only', 'cgpa_and_skill'],
    default: 'cgpa_only',
  },
  requiredSkills: [{ type: String }],
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  cgpa: { type: Number, default: 0 },
  skillMatch: { type: Number, default: 0 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifierRole: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SkillVerification', skillVerificationSchema);
