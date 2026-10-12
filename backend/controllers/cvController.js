const StudentProfile = require('../models/StudentProfile');
const path = require('path');
const fs = require('fs');
const { isServerless } = require('../utils/upload');

// POST /api/student/upload-cv
const uploadCV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

  try {
    const uploadedPath = req.file.path;
    const cvUrl = `/uploads/${req.file.filename}`;

    if (!process.env.AFFINDA_API_KEY) {
      return res.status(500).json({ message: 'AFFINDA_API_KEY is missing in your .env file.' });
    }

    const { AffindaAPI, AffindaCredential } = require('@affinda/affinda');
    const credential = new AffindaCredential(process.env.AFFINDA_API_KEY);
    const client = new AffindaAPI(credential);
    
    const docStream = fs.createReadStream(uploadedPath);
    let extractedSkills = [];
    
    try {
      const options = { file: docStream };
      if (process.env.AFFINDA_WORKSPACE_ID) {
         options.workspace = process.env.AFFINDA_WORKSPACE_ID;
      }
      
      const result = await client.createDocument(options);
      const rawSkills = result?.data?.skills || result?.skills || [];
      extractedSkills = rawSkills.map(s => s.name || s.parsed || (typeof s === 'string' ? s : '')).filter(Boolean);
    } catch (apiError) {
      console.error("Affinda API Error:", apiError);
      return res.status(500).json({ message: "Failed to parse CV with Affinda. Check your API key or credits.", error: apiError.message });
    }

    // Optional: Datamuse API for related skill suggestions (public API)
    let relatedSkills = [];
    try {
      const searchSkill = extractedSkills.length > 0 ? extractedSkills[0] : 'technology';
      const response = await fetch(`https://api.datamuse.com/words?ml=${searchSkill}&max=5`);
      const data = await response.json();
      relatedSkills = data.map(d => d.word);
    } catch (_) {
      // If Datamuse fails, continue without related skills
    }

    // Save cvUrl to profile
    await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { cvUrl },
      { upsert: true, new: true }
    );

    // Temp storage on serverless is ephemeral; clean up once parsed
    if (isServerless) fs.unlink(uploadedPath, () => {});

    res.json({
      message: 'CV uploaded and parsed successfully',
      cvUrl,
      extractedSkills,
      relatedSkills,
    });
  } catch (err) {
    res.status(500).json({ message: 'CV processing error', error: err.message });
  }
};

// POST /api/student/confirm-skills
const confirmSkills = async (req, res) => {
  const { skills } = req.body;
  if (!skills || !Array.isArray(skills))
    return res.status(400).json({ message: 'Skills array is required' });

  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { skills: { $each: skills } } },
      { new: true, upsert: true }
    );
    res.json({ message: 'Skills saved to profile', skills: profile.skills });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadCV, confirmSkills };
