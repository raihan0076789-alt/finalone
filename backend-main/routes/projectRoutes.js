// backend/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProject, updateProject, deleteProject, addCollaborator, getProjectVersions, restoreVersion, updateProjectStatus } = require('../controllers/projectController');
const { saveAIFeedback, getAIFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');
const { validate, projectValidation, idValidation } = require('../middleware/validation');
const { projectLimitGuard } = require('../middleware/planGuard');

router.route('/')
    .get(protect, getProjects)
    .post(protect, projectLimitGuard, projectValidation, validate, createProject);

router.route('/:id')
    .get(protect, idValidation, validate, getProject)
    .put(protect, idValidation, validate, updateProject)
    .delete(protect, idValidation, validate, deleteProject);

router.post('/:id/collaborators', protect, idValidation, validate, addCollaborator);
router.get('/:id/versions', protect, idValidation, validate, getProjectVersions);
router.post('/:id/versions/:versionId/restore', protect, idValidation, validate, restoreVersion);

// Project status workflow — architect advances, client approves
router.put('/:id/status', protect, idValidation, validate, updateProjectStatus);

// AI Design Feedback — additive routes, no conflict with existing ones
router.get( '/:id/ai-feedback', protect, idValidation, validate, getAIFeedback);
router.put( '/:id/ai-feedback', protect, idValidation, validate, saveAIFeedback);

module.exports = router;