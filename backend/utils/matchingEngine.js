const LEARNING_PATHS = {
  javascript: ['JavaScript Algorithms and Data Structures (freeCodeCamp)', 'Meta Front-End Developer Certificate'],
  react: ['React - The Complete Guide (Udemy)', 'Frontend Developer (React) by HackerRank'],
  nodejs: ['Node.js, Express, MongoDB Bootcamp', 'Backend Development and APIs (freeCodeCamp)'],
  express: ['Node.js API Masterclass (Express)', 'REST API Design Best Practices Course'],
  mongodb: ['MongoDB University M001', 'MongoDB Node.js Developer Path'],
  sql: ['SQL for Data Science (Coursera)', 'Databases and SQL for Data Science with Python'],
  python: ['Python for Everybody', 'PCAP: Certified Associate in Python Programming'],
  java: ['Java Programming Masterclass', 'Oracle Certified Professional Java SE'],
  docker: ['Docker Essentials by IBM', 'Docker and Kubernetes: The Complete Guide'],
  aws: ['AWS Cloud Practitioner Essentials', 'AWS Certified Developer - Associate'],
  git: ['Version Control with Git (Atlassian)', 'Git and GitHub Crash Course'],
  html: ['Responsive Web Design (freeCodeCamp)', 'HTML, CSS and Javascript for Web Developers'],
  css: ['Advanced CSS and Sass', 'Responsive Web Design Certification'],
  communication: ['Business Communication Skills Specialization', 'Effective Communication by University of Colorado'],
  teamwork: ['Teamwork Skills: Communicating Effectively in Groups', 'Agile with Atlassian Jira'],
};

const { getBadgeWeight } = require('./skillBadgeService');

const normalize = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const uniqueSkills = (skills = []) => {
  const seen = new Set();
  const result = [];

  for (const skill of skills) {
    const normalized = normalize(skill);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(skill.toString().trim());
  }

  return result;
};

const recommendationForSkill = (skill) => {
  const key = normalize(skill).replace(/[^a-z0-9 ]/g, '');
  const direct = LEARNING_PATHS[key];
  if (direct) return direct;

  const partial = Object.keys(LEARNING_PATHS).find((k) => key.includes(k) || k.includes(key));
  if (partial) return LEARNING_PATHS[partial];

  return [
    `Take a project-based course on ${skill}`,
    `Complete an industry certification related to ${skill}`,
  ];
};

const calculateMatchInsights = ({
  requiredSkills = [],
  studentSkills = [],
  verifiedSkills = [],
  cgpa = 0,
  minCGPA = 0,
  weights = { skillWeight: 0.75, cgpaWeight: 0.25 },
}) => {
  const normalizedStudentSkillSet = new Set(uniqueSkills(studentSkills).map(normalize));

  // Supports legacy array format: ['React', 'Node'] and rich format: [{ skill: 'React', badgeLevel: 'gold' }]
  const normalizedVerifiedSkillMap = new Map();
  (verifiedSkills || []).forEach((entry) => {
    if (!entry) return;

    const skillName = typeof entry === 'string' ? entry : entry.skill;
    const normalizedSkill = normalize(skillName);
    if (!normalizedSkill) return;

    const weight = typeof entry === 'string' ? getBadgeWeight('bronze') : getBadgeWeight(entry.badgeLevel);
    const existingWeight = normalizedVerifiedSkillMap.get(normalizedSkill) || 0;
    if (weight > existingWeight) {
      normalizedVerifiedSkillMap.set(normalizedSkill, weight);
    }
  });

  const normalizedRequired = (requiredSkills || [])
    .filter((entry) => entry && entry.skill)
    .map((entry) => ({
      skill: entry.skill.toString().trim(),
      weight: Number(entry.weight) > 0 ? Number(entry.weight) : 1,
    }));

  const totalRequiredWeight = normalizedRequired.reduce((sum, item) => sum + item.weight, 0);

  let matchedWeight = 0;
  const matchedSkills = [];
  const missingSkills = [];

  normalizedRequired.forEach((reqSkill) => {
    if (normalizedStudentSkillSet.has(normalize(reqSkill.skill))) {
      matchedWeight += reqSkill.weight;
      matchedSkills.push(reqSkill);
      return;
    }

    missingSkills.push({
      ...reqSkill,
      recommendedLearningPaths: recommendationForSkill(reqSkill.skill),
    });
  });

  const matchScore = totalRequiredWeight
    ? Number(((matchedWeight / totalRequiredWeight) * 100).toFixed(2))
    : 0;

  const cgpaNum = Number(cgpa) || 0;
  const minCgpaNum = Number(minCGPA) || 0;
  const cgpaScore = minCgpaNum <= 0 ? 100 : Math.max(0, Math.min(100, (cgpaNum / minCgpaNum) * 100));

  const verifiedMatchedCount = matchedSkills.filter((item) =>
    normalizedVerifiedSkillMap.has(normalize(item.skill))
  ).length;

  const verifiedBonus = Math.min(
    8,
    matchedSkills.reduce((sum, item) => {
      const badgeWeight = normalizedVerifiedSkillMap.get(normalize(item.skill));
      if (!badgeWeight) return sum;
      return sum + badgeWeight;
    }, 0)
  );

  const skillWeight = Number(weights?.skillWeight);
  const cgpaWeight = Number(weights?.cgpaWeight);
  const totalWeight = skillWeight + cgpaWeight;
  const normalizedSkillWeight = totalWeight > 0 ? skillWeight / totalWeight : 0.75;
  const normalizedCgpaWeight = totalWeight > 0 ? cgpaWeight / totalWeight : 0.25;

  // Balanced recommendation: skill fit is primary signal, CGPA is secondary tie-breaker.
  const recommendationScore = Number(
    Math.min(100, matchScore * normalizedSkillWeight + cgpaScore * normalizedCgpaWeight + verifiedBonus).toFixed(2)
  );

  return {
    matchScore,
    recommendationScore,
    skillGapReport: {
      matchedSkills,
      missingSkills,
      totalRequiredWeight,
      matchedWeight,
      completionRatio: totalRequiredWeight ? Number((matchedWeight / totalRequiredWeight).toFixed(4)) : 0,
      verifiedMatchedCount,
      verifiedCredibilityBonus: Number(verifiedBonus.toFixed(2)),
    },
  };
};

module.exports = {
  calculateMatchInsights,
  recommendationForSkill,
};
