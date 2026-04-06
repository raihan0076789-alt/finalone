// backend-main/routes/clientRoutes.js
const express  = require('express');
const router   = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    getDashboard,
    deleteAccount
} = require('../controllers/clientController');
const {
    createTicket,
    getTickets,
    getTicket,
    getUnreadCount,
    replyToTicket
} = require('../controllers/clientSupportController');
const { getArchitectListing, getArchitectDetail } = require('../controllers/architectListingController');
const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    deleteAttachment
} = require('../controllers/clientProjectController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Protected: auth + account ─────────────────────────────────────────────────
router.get('/me',               protect, authorize('client'), getMe);
router.put('/profile',          protect, authorize('client'), updateProfile);
router.get('/dashboard',        protect, authorize('client'), getDashboard);

// ── Protected: client projects ────────────────────────────────────────────────
router.post('/projects',
    protect, authorize('client'),
    upload.array('attachments', 10),
    createProject
);
router.get('/projects',            protect, authorize('client'), getProjects);
router.get('/projects/:id',        protect, authorize('client'), getProject);
router.put('/projects/:id',
    protect, authorize('client'),
    upload.array('attachments', 10),
    updateProject
);
router.delete('/projects/:id',     protect, authorize('client'), deleteProject);
router.delete('/projects/:id/attachments/:filename',
    protect, authorize('client'),
    deleteAttachment
);

// ── Architect Listing (for clients to browse architects) ──────────────────────
router.get('/architects',       protect, authorize('client'), getArchitectListing);
router.get('/architects/:id',   protect, authorize('client'), getArchitectDetail);

// ── Client Support (ticket system) ───────────────────────────────────────────
router.post('/support',            protect, authorize('client'), createTicket);
router.get('/support',             protect, authorize('client'), getTickets);
router.get('/support/unread',      protect, authorize('client'), getUnreadCount);
router.get('/support/:id',         protect, authorize('client'), getTicket);
router.post('/support/:id/reply',  protect, authorize('client'), replyToTicket);

// ── Delete account ────────────────────────────────────────────────────────────
router.delete('/account', protect, authorize('client'), deleteAccount);

module.exports = router;