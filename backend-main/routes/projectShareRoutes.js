// backend-main/routes/projectShareRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    shareProject,
    getProjectShares,
    revokeShare,
    getMySharedProjects,
    getShareByToken,
    getConnectedClients
} = require('../controllers/projectShareController');
const {
    submitRating,
    getMyRating
} = require('../controllers/architectRatingController');

// ── Architect routes ──────────────────────────────────────────────────────────
// Share a project (connection or link mode)
router.post('/projects/:id/share',          protect, authorize('architect', 'user'), shareProject);
// List all shares for a project
router.get('/projects/:id/shares',          protect, authorize('architect', 'user'), getProjectShares);
// Revoke a specific share
router.delete('/projects/:id/shares/:shareId', protect, authorize('architect', 'user'), revokeShare);
// Get connected clients list (for share modal dropdown)
router.get('/shares/connected-clients',     protect, authorize('architect', 'user'), getConnectedClients);

// ── Client routes ─────────────────────────────────────────────────────────────
// Get all projects shared with the logged-in client
router.get('/shares/my',                    protect, authorize('client'), getMySharedProjects);

// ── Public route (token access) ───────────────────────────────────────────────
// No auth middleware here — controller handles auth conditionally per mode
router.get('/shares/token/:token',          getShareByToken);

// ── Rating routes (client only) ───────────────────────────────────────────────
// Submit or update a rating for the architect of a specific shared project
router.post('/shares/:shareId/rate',        protect, authorize('client'), submitRating);
// Check if current client has already rated for this share
router.get('/shares/:shareId/rating',       protect, authorize('client'), getMyRating);

module.exports = router;