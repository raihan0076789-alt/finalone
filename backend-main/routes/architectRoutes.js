// backend-main/routes/architectRoutes.js
// Mounts at /api/architect
// All routes require a valid JWT (protect middleware).

const express = require('express');
const router  = express.Router();
const { protect }          = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/architectController');

// GET  /api/architect/profile  — fetch full architect profile
// PUT  /api/architect/profile  — update professional fields (post-login, dashboard only)
router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);

// ── Backward-compat alias: /api/architect/me → same as /api/auth/me ───────────
// Lets any future clients that hit /api/architect/me still get a valid response
// without touching the auth routes.
router.get('/me', protect, getProfile);

module.exports = router;