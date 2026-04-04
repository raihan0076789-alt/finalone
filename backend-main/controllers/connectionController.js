// backend-main/controllers/connectionController.js
const Connection = require('../models/Connection');
const User       = require('../models/User');
const Project    = require('../models/Project');

// ─── POST /api/connections/request ───────────────────────────────────────────
// Client sends a connect request to an architect (optionally with a project).
exports.sendRequest = async (req, res) => {
    try {
        const { architectId, projectId, introMessage } = req.body;
        const clientId = req.user._id;

        // Validate architect exists
        const architect = await User.findById(architectId);
        if (!architect || !['architect', 'user'].includes(architect.role)) {
            return res.status(404).json({ success: false, message: 'Architect not found.' });
        }

        // Prevent duplicate — upsert-style: if rejected before, allow re-request
        const existing = await Connection.findOne({ client: clientId, architect: architectId });
        if (existing) {
            if (existing.status === 'pending') {
                return res.status(400).json({ success: false, message: 'You already have a pending request with this architect.' });
            }
            if (existing.status === 'accepted') {
                return res.status(400).json({ success: false, message: 'You are already connected with this architect.' });
            }
            // was rejected — delete old and allow fresh request
            await Connection.deleteOne({ _id: existing._id });
        }

        // Optional project context — check both architect Project and ClientProject models
        let projectName = '';
        if (projectId) {
            // First try ClientProject (client's own brief)
            const ClientProject = require('../models/ClientProject');
            const clientProj = await ClientProject.findOne({ _id: projectId, client: clientId });
            if (clientProj) {
                projectName = clientProj.title;
            } else {
                // Fall back to architect Project model (legacy)
                const proj = await Project.findOne({ _id: projectId, owner: clientId });
                if (proj) projectName = proj.name;
            }
        }

        const conn = await Connection.create({
            client:       clientId,
            architect:    architectId,
            project:      projectId || null,
            projectName,
            introMessage: introMessage || '',
            unreadByArchitect: 1   // the intro message counts as 1 unread for architect
        });

        res.status(201).json({ success: true, data: conn, message: 'Connection request sent!' });
    } catch (err) {
        console.error('sendRequest error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/connections/status/:architectId ─────────────────────────────────
// Client checks their connection status with a specific architect.
exports.getStatusWithArchitect = async (req, res) => {
    try {
        const conn = await Connection.findOne({
            client:    req.user._id,
            architect: req.params.architectId
        }).select('status _id unreadByClient');

        if (!conn) return res.json({ success: true, status: 'none' });
        res.json({ success: true, status: conn.status, connectionId: conn._id, unreadByClient: conn.unreadByClient });
    } catch (err) {
        console.error('getStatusWithArchitect error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/connections/my ──────────────────────────────────────────────────
// Returns all connections for the current user (client or architect).
exports.getMyConnections = async (req, res) => {
    try {
        const role   = req.user.role;
        const filter = role === 'client'
            ? { client: req.user._id }
            : { architect: req.user._id };

        const conns = await Connection.find(filter)
            .populate('client',    'name email avatar company')
            .populate('architect', 'name email avatar specialization')
            .populate('project',   'name type status')
            .sort('-updatedAt')
            .select('-messages');   // don't send full message history in list

        res.json({ success: true, data: conns });
    } catch (err) {
        console.error('getMyConnections error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── PUT /api/connections/:id/respond ────────────────────────────────────────
// Architect accepts or rejects a connection request.
exports.respondToRequest = async (req, res) => {
    try {
        const { action } = req.body;   // 'accept' | 'reject'
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be accept or reject.' });
        }

        const conn = await Connection.findOne({ _id: req.params.id, architect: req.user._id });
        if (!conn) return res.status(404).json({ success: false, message: 'Connection request not found.' });
        if (conn.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request has already been responded to.' });
        }

        conn.status = action === 'accept' ? 'accepted' : 'rejected';
        if (action === 'accept') conn.unreadByClient += 1;  // notify client
        await conn.save();

        res.json({ success: true, data: conn, message: action === 'accept' ? 'Connection accepted!' : 'Request rejected.' });
    } catch (err) {
        console.error('respondToRequest error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/connections/:id/messages ───────────────────────────────────────
// Fetch full message history for an accepted connection.
exports.getMessages = async (req, res) => {
    try {
        const conn = await Connection.findById(req.params.id)
            .populate('client',    'name avatar')
            .populate('architect', 'name avatar');

        if (!conn) return res.status(404).json({ success: false, message: 'Connection not found.' });

        // Only parties involved can read messages
        const uid = String(req.user._id);
        if (String(conn.client._id) !== uid && String(conn.architect._id) !== uid) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        if (conn.status !== 'accepted') {
            return res.status(403).json({ success: false, message: 'Chat is only available for accepted connections.' });
        }

        // Mark messages as read for this user
        if (req.user.role === 'client') conn.unreadByClient = 0;
        else                            conn.unreadByArchitect = 0;
        await conn.save();

        res.json({ success: true, data: { connection: conn, messages: conn.messages } });
    } catch (err) {
        console.error('getMessages error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/connections/:id/messages ──────────────────────────────────────
// Send a message in an accepted connection.
exports.sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Message text is required.' });
        }

        const conn = await Connection.findById(req.params.id);
        if (!conn) return res.status(404).json({ success: false, message: 'Connection not found.' });

        const uid = String(req.user._id);
        const isClient    = String(conn.client)    === uid;
        const isArchitect = String(conn.architect) === uid;

        if (!isClient && !isArchitect) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (conn.status !== 'accepted') {
            return res.status(403).json({ success: false, message: 'Chat is only available for accepted connections.' });
        }

        const role = isClient ? 'client' : 'architect';

        const msg = {
            sender:     req.user._id,
            senderRole: role,
            text:       text.trim()
        };

        conn.messages.push(msg);

        // Increment unread for the OTHER party
        if (isClient) conn.unreadByArchitect += 1;
        else          conn.unreadByClient    += 1;

        await conn.save();

        const newMsg = conn.messages[conn.messages.length - 1];
        res.status(201).json({ success: true, data: newMsg });
    } catch (err) {
        console.error('sendMessage error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};