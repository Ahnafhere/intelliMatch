const Internship = require('../models/Internship');
const InternshipTemplate = require('../models/InternshipTemplate');
const StudentProfile = require('../models/StudentProfile');
const { calculateMatchInsights } = require('../utils/matchingEngine');
const { getRecommendationWeights } = require('../utils/settingsService');

// POST /api/internship
const createInternship = async (req, res) => {
  const { title, description, deadline, minCGPA, department, requiredSkills } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const internship = await Internship.create({
      companyId: req.user._id,
      companyName: req.user.name,
      title,
      description,
      deadline,
      minCGPA: minCGPA || 0,
      department,
      requiredSkills: requiredSkills || [],
    });
    res.status(201).json(internship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/internship/template
const createTemplate = async (req, res) => {
  const {
    templateName,
    title,
    description,
    minCGPA,
    department,
    requiredSkills,
    sourceInternshipId,
  } = req.body;

  if (!templateName || !title) {
    return res.status(400).json({ message: 'templateName and title are required' });
  }

  try {
    const template = await InternshipTemplate.create({
      companyId: req.user._id,
      templateName,
      title,
      description,
      minCGPA: minCGPA || 0,
      department,
      requiredSkills: requiredSkills || [],
      sourceInternshipId,
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/internship/template/company
const getMyTemplates = async (req, res) => {
  try {
    const templates = await InternshipTemplate.find({ companyId: req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/internship/:id/save-template
const saveInternshipAsTemplate = async (req, res) => {
  const { templateName } = req.body;
  if (!templateName) return res.status(400).json({ message: 'templateName is required' });

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });
    if (internship.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const template = await InternshipTemplate.create({
      companyId: req.user._id,
      templateName,
      title: internship.title,
      description: internship.description,
      minCGPA: internship.minCGPA,
      department: internship.department,
      requiredSkills: internship.requiredSkills,
      sourceInternshipId: internship._id,
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/internship/template/:id/create-post
const createPostFromTemplate = async (req, res) => {
  try {
    const template = await InternshipTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    if (template.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const internship = await Internship.create({
      companyId: req.user._id,
      companyName: req.user.name,
      title: req.body.title || template.title,
      description: req.body.description || template.description,
      deadline: req.body.deadline,
      minCGPA: req.body.minCGPA ?? template.minCGPA,
      department: req.body.department || template.department,
      requiredSkills: req.body.requiredSkills || template.requiredSkills,
    });

    res.status(201).json(internship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/internship/:id/duplicate
const duplicateInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });
    if (internship.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const copy = await Internship.create({
      companyId: req.user._id,
      companyName: req.user.name,
      title: req.body.title || `${internship.title} (Copy)`,
      description: req.body.description || internship.description,
      deadline: req.body.deadline,
      minCGPA: req.body.minCGPA ?? internship.minCGPA,
      department: req.body.department || internship.department,
      requiredSkills: req.body.requiredSkills || internship.requiredSkills,
    });

    res.status(201).json(copy);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/internship/:id
const updateInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (internship.companyId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    const updated = await Internship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/internship
const getAllInternships = async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/internship/:id
const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });

    const isOwner = internship.companyId.toString() === req.user._id.toString();
    const isAdmin = ['system_admin', 'university_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Unauthorized' });

    await internship.deleteOne();
    res.json({ message: 'Internship deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/internship/search
const searchInternships = async (req, res) => {
  const { company, skill, department, deadline } = req.query;
  const filter = {};

  if (company) filter.companyName = { $regex: company, $options: 'i' };
  if (department) filter.department = { $regex: department, $options: 'i' };
  if (deadline) filter.deadline = { $gte: new Date(deadline) };
  if (skill) filter['requiredSkills.skill'] = { $regex: skill, $options: 'i' };

  try {
    const results = await Internship.find(filter).sort({ createdAt: -1 }).lean();

    if (req.user.role !== 'student') {
      return res.json(results);
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id }).lean();
    const studentSkills = profile?.skills || [];
    const verifiedSkills = profile?.verifiedSkills || [];
    const studentCgpa = profile?.cgpa || 0;
    const weights = await getRecommendationWeights();

    const withInsights = results
      .map((internship) => {
        const insights = calculateMatchInsights({
          requiredSkills: internship.requiredSkills,
          studentSkills,
          verifiedSkills,
          cgpa: studentCgpa,
          minCGPA: internship.minCGPA,
          weights,
        });

        return {
          ...internship,
          matchInsights: insights,
        };
      })
      .sort((a, b) => b.matchInsights.recommendationScore - a.matchInsights.recommendationScore);

    res.json(withInsights);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/internship/company — list my posts
const getMyInternships = async (req, res) => {
  try {
    const internships = await Internship.find({ companyId: req.user._id }).sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createInternship,
  updateInternship,
  getAllInternships,
  deleteInternship,
  searchInternships,
  getMyInternships,
  createTemplate,
  getMyTemplates,
  saveInternshipAsTemplate,
  createPostFromTemplate,
  duplicateInternship,
};
