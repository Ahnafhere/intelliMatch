const mongoose = require('mongoose');

const internshipFeedbackSchema = new mongoose.Schema({
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: {
    type: String,
    enum: ['company_to_student', 'student_to_company'],
    required: true,
  },
  technicalSkills: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  teamwork: { type: Number, min: 1, max: 5 },
  overallRating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('InternshipFeedback', internshipFeedbackSchema);
