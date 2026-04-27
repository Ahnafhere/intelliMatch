export const badgeMeta = {
  gold: {
    label: 'Gold',
    style: { background: 'rgba(234,179,8,0.18)', borderColor: 'rgba(234,179,8,0.45)', color: '#fde68a' },
  },
  silver: {
    label: 'Silver',
    style: { background: 'rgba(148,163,184,0.2)', borderColor: 'rgba(148,163,184,0.45)', color: '#e2e8f0' },
  },
  bronze: {
    label: 'Bronze',
    style: { background: 'rgba(180,83,9,0.2)', borderColor: 'rgba(180,83,9,0.45)', color: '#fdba74' },
  },
};

const tokenize = (value = '') => value
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .split(' ')
  .map((part) => part.trim())
  .filter(Boolean);

export const calculateSkillMatch = (skill, skillPool = []) => {
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

export const getEndorsementBadgeLevel = ({ cgpa = 0, skillMatch = 0 } = {}) => {
  const cgpaNum = Number(cgpa) || 0;

  if (cgpaNum >= 3.7 && cgpaNum <= 4) return 'gold';
  if (cgpaNum >= 3.4 && cgpaNum < 3.7) return 'silver';
  if (cgpaNum >= 3.0 && cgpaNum < 3.4) return 'bronze';
  return 'bronze';
};

export const getBadgeMeta = (badgeLevel) => badgeMeta[badgeLevel] || badgeMeta.bronze;