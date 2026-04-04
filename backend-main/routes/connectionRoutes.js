// backend-main/routes/connectionRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    sendRequest,
    getStatusWithArchitect,
    getMyConnections,
    respondToRequest,
    getMessages,
    sendMessage
} = require('../controllers/connectionController');

// ── Client routes ──────────────────────────────────────────────────────────────
// Send a new connection request (client only)
router.post('/request', protect, authorize('client'), sendRequest);

// Check connection status with a specific architect (client only)
router.get('/status/:architectId', protect, authorize('client'), getStatusWithArchitect);

// ── Shared routes (client + architect) ────────────────────────────────────────
// List all my connections
router.get('/my', protect, authorize('client', 'architect'), getMyConnections);

// Architect accepts or rejects
router.put('/:id/respond', protect, authorize('architect'), respondToRequest);

// Chat
router.get('/:id/messages',  protect, authorize('client', 'architect'), getMessages);
router.post('/:id/messages', protect, authorize('client', 'architect'), sendMessage);

module.exports = router;