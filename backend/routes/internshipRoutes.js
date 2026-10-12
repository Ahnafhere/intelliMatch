const express = require('express');
const router = express.Router();
const {
  createInternship, updateInternship, getAllInternships,
  deleteInternship, searchInternships, getPublicInternships, getMyInternships,
  createTemplate, getMyTemplates, saveInternshipAsTemplate,
  createPostFromTemplate, duplicateInternship
} = require('../controllers/internshipController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Note: /search must be before /:id to avoid route conflict
router.get('/public', getPublicInternships);
router.get('/search', protect, searchInternships);
router.get('/template/company', protect, authorizeRoles('company'), getMyTemplates);
router.post('/template', protect, authorizeRoles('company'), createTemplate);
router.post('/template/:id/create-post', protect, authorizeRoles('company'), createPostFromTemplate);
router.get('/company', protect, authorizeRoles('company'), getMyInternships);
router.get('/', protect, getAllInternships);
router.post('/', protect, authorizeRoles('company'), createInternship);
router.post('/:id/save-template', protect, authorizeRoles('company'), saveInternshipAsTemplate);
router.post('/:id/duplicate', protect, authorizeRoles('company'), duplicateInternship);
router.put('/:id', protect, authorizeRoles('company'), updateInternship);
router.delete('/:id', protect, authorizeRoles('company', 'system_admin', 'university_admin'), deleteInternship);

module.exports = router;
