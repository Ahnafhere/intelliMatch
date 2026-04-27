const SOURCE_TO_BADGE = {
  certification: 'gold',
  project_review: 'silver',
  internship_performance: 'bronze',
  manual: 'bronze',
};

const BADGE_META = {
  gold: { label: 'Gold' },
  silver: { label: 'Silver' },
  bronze: { label: 'Bronze' },
};

const BADGE_PRIORITY = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

const BADGE_WEIGHT = {
  bronze: 0.6,
  silver: 1.0,
  gold: 1.4,
};

const normalizeBadgeLevel = (badgeLevel) => {
  const value = (badgeLevel || '').toString().trim().toLowerCase();
  return BADGE_PRIORITY[value] ? value : null;
};

const getBadgeForSource = (source) => {
  const normalizedSource = (source || '').toString().trim().toLowerCase();
  return SOURCE_TO_BADGE[normalizedSource] || 'bronze';
};

const getBadgeWeight = (badgeLevel) => BADGE_WEIGHT[normalizeBadgeLevel(badgeLevel) || 'bronze'];

const tokenize = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

const calculateSkillMatch = (skill, skillPool = []) => {
  const normalizedSkill = (skill || '').toString().trim().toLowerCase();
  if (!normalizedSkill) return 0;

  const normalizedPool = [...new Set((skillPool || [])
    .map((entry) => (entry || '').toString().trim().toLowerCase())
    .filter(Boolean))];

  if (normalizedPool.includes(normalizedSkill)) return 100;

  const targetTokens = tokenize(normalizedSkill);
  if (targetTokens.length === 0) return 0;

  let bestScore = 0;

  normalizedPool.forEach((entry) => {
    const poolTokens = tokenize(entry);
    if (poolTokens.length === 0) return;

    const targetSet = new Set(targetTokens);
    const poolSet = new Set(poolTokens);
    const intersectionSize = [...targetSet].filter((token) => poolSet.has(token)).length;
    if (!intersectionSize) return;

    const unionSize = new Set([...targetTokens, ...poolTokens]).size;
    const jaccardScore = unionSize > 0 ? (intersectionSize / unionSize) * 100 : 0;
    const containmentScore = Math.max(
      (intersectionSize / targetTokens.length) * 100,
      (intersectionSize / poolTokens.length) * 100
    );

    bestScore = Math.max(bestScore, jaccardScore, containmentScore);
  });

  return Number(bestScore.toFixed(2));
};

const getEndorsementBadgeLevel = ({ cgpa = 0, skillMatch = 0 } = {}) => {
  const cgpaNum = Number(cgpa) || 0;

  if (cgpaNum >= 3.7 && cgpaNum <= 4) return 'gold';
  if (cgpaNum >= 3.4 && cgpaNum < 3.7) return 'silver';
  if (cgpaNum >= 3.0 && cgpaNum < 3.4) return 'bronze';
  return 'bronze';
};

const getEndorsementBadgeMeta = (badgeLevel) => {
  const level = normalizeBadgeLevel(badgeLevel) || 'bronze';
  return BADGE_META[level] || BADGE_META.bronze;
};

const getBadgeDisplayLabel = (badgeLevel) => getEndorsementBadgeMeta(badgeLevel).label;

const pickHigherBadgeLevel = (currentBadge, nextBadge) => {
  const current = normalizeBadgeLevel(currentBadge) || 'bronze';
  const next = normalizeBadgeLevel(nextBadge) || 'bronze';
  return BADGE_PRIORITY[next] > BADGE_PRIORITY[current] ? next : current;
};

module.exports = {
  normalizeBadgeLevel,
  getBadgeForSource,
  getBadgeWeight,
  calculateSkillMatch,
  getEndorsementBadgeLevel,
  getEndorsementBadgeMeta,
  getBadgeDisplayLabel,
  pickHigherBadgeLevel,
};