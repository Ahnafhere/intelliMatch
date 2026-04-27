const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 45 },
  mode: {
    type: String,
    enum: ['Online', 'Onsite', 'Phone'],
    default: 'Online',
  },
  meetingLink: { type: String, default: '' },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  studentConfirmation: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Declined'],
    default: 'Pending',
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Selected', 'Rejected'],
    default: 'Scheduled',
  },
  history: [
    {
      status: { type: String, required: true },
      note: { type: String, default: '' },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
