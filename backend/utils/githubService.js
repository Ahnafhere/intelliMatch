const https = require('https');

/**
 * Fetch skills from GitHub profile by analyzing repositories and languages
 * @param {string} githubUsername - GitHub username
 * @returns {Promise<Object>} Skills and metadata
 */
const fetchGitHubSkills = async (githubUsername) => {
  return new Promise((resolve, reject) => {
    if (!process.env.GITHUB_API_TOKEN) {
      console.warn('[githubService] GitHub API token not configured');
      return reject(new Error('GitHub API token not configured'));
    }

    if (!githubUsername || typeof githubUsername !== 'string') {
      return reject(new Error('Invalid GitHub username'));
    }

    // Fetch user repos
    const options = {
      hostname: 'api.github.com',
      path: `/users/${githubUsername}/repos?per_page=100&sort=updated`,
      method: 'GET',
      headers: {
        'Authorization': `token ${process.env.GITHUB_API_TOKEN}`,
        'User-Agent': 'IntelliMatch',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            return reject(new Error('GitHub user not found'));
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`GitHub API error: ${res.statusCode}`));
          }

          const repos = JSON.parse(data);
          if (!Array.isArray(repos)) {
            return reject(new Error('Invalid GitHub response'));
          }

          // Extract language skills from repositories
          const languageMap = {};
          const topicsSet = new Set();
          let totalRepos = 0;

          repos.forEach((repo) => {
            if (repo.language) {
              languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
              totalRepos++;
            }

            // Extract topics as skills
            if (Array.isArray(repo.topics)) {
              repo.topics.forEach((topic) => {
                topicsSet.add(topic);
              });
            }
          });

          // Sort languages by frequency
          const languages = Object.entries(languageMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([lang, count]) => ({
              name: lang,
              proficiency: calculateProficiency(count, totalRepos),
              frequency: count,
            }));

          const topics = Array.from(topicsSet).slice(0, 15);

          console.log(`[githubService] Fetched skills for ${githubUsername}: ${languages.length} languages, ${topics.length} topics`);

          resolve({
            username: githubUsername,
            languages,
            topics,
            repoCount: repos.length,
            profileUrl: `https://github.com/${githubUsername}`,
            lastUpdated: new Date(),
          });
        } catch (error) {
          reject(new Error(`Failed to parse GitHub response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      console.error('[githubService] Request error:', error.message);
      reject(error);
    }).end();
  });
};

/**
 * Calculate proficiency level based on frequency
 * @param {number} count - How many repos use this language
 * @param {number} total - Total repos
 * @returns {string} Proficiency level
 */
const calculateProficiency = (count, total) => {
  const percentage = (count / total) * 100;
  if (percentage >= 50) return 'Expert';
  if (percentage >= 30) return 'Advanced';
  if (percentage >= 15) return 'Intermediate';
  return 'Beginner';
};

/**
 * Fetch GitHub user profile info
 * @param {string} githubUsername - GitHub username
 * @returns {Promise<Object>} User profile info
 */
const fetchGitHubProfile = async (githubUsername) => {
  return new Promise((resolve, reject) => {
    if (!process.env.GITHUB_API_TOKEN) {
      return reject(new Error('GitHub API token not configured'));
    }

    const options = {
      hostname: 'api.github.com',
      path: `/users/${githubUsername}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${process.env.GITHUB_API_TOKEN}`,
        'User-Agent': 'IntelliMatch',
      },
    };

    https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            return reject(new Error('GitHub user not found'));
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`GitHub API error: ${res.statusCode}`));
          }

          const profile = JSON.parse(data);

          resolve({
            username: profile.login,
            name: profile.name,
            bio: profile.bio,
            company: profile.company,
            location: profile.location,
            publicRepos: profile.public_repos,
            followers: profile.followers,
            following: profile.following,
            profileUrl: profile.html_url,
            avatarUrl: profile.avatar_url,
          });
        } catch (error) {
          reject(new Error(`Failed to parse GitHub profile: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      console.error('[githubService] Request error:', error.message);
      reject(error);
    }).end();
  });
};

module.exports = {
  fetchGitHubSkills,
  fetchGitHubProfile,
};
