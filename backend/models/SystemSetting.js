const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  recommendationWeights: {
    skillWeight: { type: Number, default: 0.75 },
    cgpaWeight: { type: Number, default: 0.25 },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
