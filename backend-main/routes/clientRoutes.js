// backend-main/routes/clientRoutes.js
const express  = require('express');
const router   = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    getDashboard
} = require('../controllers/clientController');
const { getArchitectListing, getArchitectDetail } = require('../controllers/architectListingController');
const { protect, authorize } = require('../middleware/auth');

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Protected routes (client must be authenticated) ───────────────────────────
router.get('/me',               protect, authorize('client'), getMe);
router.put('/profile',          protect, authorize('client'), updateProfile);
router.get('/dashboard',        protect, authorize('client'), getDashboard);

// ── Architect Listing (for clients to browse architects) ──────────────────────
router.get('/architects',        protect, authorize('client'), getArchitectListing);
router.get('/architects/:id',    protect, authorize('client'), getArchitectDetail);

module.exports = router;