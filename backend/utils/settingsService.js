const SystemSetting = require('../models/SystemSetting');

const DEFAULT_WEIGHTS = { skillWeight: 0.75, cgpaWeight: 0.25 };

const normalizeWeights = ({ skillWeight, cgpaWeight }) => {
  const skill = Number(skillWeight);
  const cgpa = Number(cgpaWeight);

  if (Number.isNaN(skill) || Number.isNaN(cgpa) || skill < 0 || cgpa < 0 || skill + cgpa <= 0) {
    return DEFAULT_WEIGHTS;
  }

  const total = skill + cgpa;
  return {
    skillWeight: Number((skill / total).toFixed(4)),
    cgpaWeight: Number((cgpa / total).toFixed(4)),
  };
};

const getRecommendationWeights = async () => {
  const setting = await SystemSetting.findOne().lean();
  if (!setting?.recommendationWeights) return DEFAULT_WEIGHTS;
  return normalizeWeights(setting.recommendationWeights);
};

module.exports = {
  DEFAULT_WEIGHTS,
  normalizeWeights,
  getRecommendationWeights,
};
