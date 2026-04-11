// backend/controllers/projectController.js
const Project = require('../models/Project');
const ModelVersion = require('../models/ModelVersion');

exports.createProject = async (req, res) => {
    try {
        req.body.owner = req.user.id;
        req.body.lastModifiedBy = req.user.id;

        const project = await Project.create(req.body);

        await ModelVersion.create({
            project: project._id,
            version: 1,
            data: project.toObject(),
            createdBy: req.user.id,
            changeLog: 'Initial project creation'
        });

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, type, sort = '-updatedAt' } = req.query;

        const query = {
            $or: [
                { owner: req.user.id },
                { 'collaborators.user': req.user.id }
            ]
        };

        if (status) query.status = status;
        if (type) query.type = type;

        const projects = await Project.find(query)
            .populate('owner', 'name email')
            .populate('collaborators.user', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Project.countDocuments(query);

        res.json({
            success: true,
            data: projects,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('collaborators.user', 'name email')
            .populate('lastModifiedBy', 'name email');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const hasAccess = project.owner._id.equals(req.user.id) ||
            project.collaborators.some(c => c.user._id.equals(req.user.id)) ||
            project.isPublic;

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this project' });
        }

        res.json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const isOwner = project.owner.equals(req.user.id);
        const isEditor = project.collaborators.some(
            c => c.user.equals(req.user.id) && ['editor', 'admin'].includes(c.role)
        );

        if (!isOwner && !isEditor) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
        }

        req.body.lastModifiedBy = req.user.id;
        req.body.version = project.version + 1;

        // Recalculate metadata here because findByIdAndUpdate bypasses the pre('save') hook.
        // Without this, totalRooms (and other metadata) would never update when floors/rooms change.
        if (req.body.floors !== undefined) {
            const floors = req.body.floors;
            const totalWidth = req.body.totalWidth !== undefined ? req.body.totalWidth : project.totalWidth;
            const totalDepth = req.body.totalDepth !== undefined ? req.body.totalDepth : project.totalDepth;
            const totalArea = totalWidth * totalDepth;
            const totalRooms = floors.reduce((sum, floor) => sum + (Array.isArray(floor.rooms) ? floor.rooms.length : 0), 0);
            const totalFloors = floors.length;
            req.body.metadata = {
                totalArea,
                totalRooms,
                totalFloors,
                estimatedCost: totalArea * 1500,
                constructionTime: totalFloors * 4
            };
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        await ModelVersion.create({
            project: project._id,
            version: project.version,
            data: project.toObject(),
            createdBy: req.user.id,
            changeLog: req.body.changeLog || 'Project updated'
        });

        res.json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (!project.owner.equals(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();
        await ModelVersion.deleteMany({ project: req.params.id });

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addCollaborator = async (req, res) => {
    try {
        const { email, role } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (!project.owner.equals(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Only owner can add collaborators' });
        }

        const User = require('../models/User');
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const alreadyCollaborator = project.collaborators.some(c => c.user.equals(userToAdd._id));
        if (alreadyCollaborator) {
            return res.status(400).json({ success: false, message: 'User is already a collaborator' });
        }

        project.collaborators.push({ user: userToAdd._id, role: role || 'viewer' });
        await project.save();
        res.json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getProjectVersions = async (req, res) => {
    try {
        const versions = await ModelVersion.find({ project: req.params.id })
            .populate('createdBy', 'name email')
            .sort('-version');
        res.json({ success: true, data: versions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.restoreVersion = async (req, res) => {
    try {
        const version = await ModelVersion.findById(req.params.versionId);
        if (!version) {
            return res.status(404).json({ success: false, message: 'Version not found' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        project.set(version.data);
        project.version += 1;
        project.lastModifiedBy = req.user.id;
        await project.save();

        await ModelVersion.create({
            project: project._id,
            version: project.version,
            data: project.toObject(),
            createdBy: req.user.id,
            changeLog: `Restored from version ${version.version}`
        });

        res.json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── PUT /api/projects/:id/status ─────────────────────────────────────────────
// Architect advances project status through the workflow.
// Flow: draft → in_progress → review → approved (complete)
// Client can approve (review → approved) via this same endpoint.
// On status change, increments unreadByClient on the linked connection so the
// client gets a notification badge — no extra notification model needed.
exports.updateProjectStatus = async (req, res) => {
    try {
        const { status, clientFeedback } = req.body;

        const VALID_STATUSES = ['draft', 'in_progress', 'review', 'approved'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        // ── Access control ────────────────────────────────────────────────────
        const isOwner  = project.owner.equals(req.user._id);
        const isClient = req.user.role === 'client';

        // Clients may only approve (review → approved)
        if (isClient) {
            if (project.status !== 'review' || status !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: 'Clients can only approve a project that is in review.'
                });
            }
            // Verify the client is connected to this project's architect
            const Connection = require('../models/Connection');
            const conn = await Connection.findOne({
                architect: project.owner,
                client:    req.user._id,
                status:    'accepted'
            });
            if (!conn) {
                return res.status(403).json({ success: false, message: 'Not authorized.' });
            }
        } else if (!isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to change project status.' });
        }

        // ── Architect: enforce forward-only transitions ────────────────────────
        const ORDER = ['draft', 'in_progress', 'review', 'approved'];
        if (!isClient) {
            const currentIdx = ORDER.indexOf(project.status);
            const newIdx     = ORDER.indexOf(status);
            // Allow moving forward only (no backwards except to draft from in_progress)
            const allowedBacktrack = project.status === 'in_progress' && status === 'draft';
            if (!allowedBacktrack && newIdx <= currentIdx) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot move project from "${project.status}" to "${status}".`
                });
            }
        }

        const oldStatus = project.status;
        project.status  = status;
        if (clientFeedback) {
            // Store optional client feedback note on the project description (appended)
            project.description = (project.description || '') +
                (project.description ? '\n\n' : '') +
                '[Client note] ' + clientFeedback.slice(0, 300);
        }
        project.lastModifiedBy = req.user._id;

        // ── Record status change in history ────────────────────────────────────
        if (!project.statusHistory) project.statusHistory = [];
        project.statusHistory.push({ status, changedAt: new Date(), changedBy: req.user._id });

        await project.save();

        // ── Auto-share project with connected client when moved to 'review' ────
        if (status === 'review' && !isClient) {
            try {
                const Connection   = require('../models/Connection');
                const ProjectShare = require('../models/ProjectShare');

                // Find all accepted connections for this architect
                const conns = await Connection.find({ architect: req.user._id, status: 'accepted' });
                for (const conn of conns) {
                    // Check if there's already a non-revoked share for this client
                    const existing = await ProjectShare.findOne({
                        project:    project._id,
                        sharedWith: conn.client,
                        isRevoked:  false
                    });
                    if (!existing) {
                        await ProjectShare.create({
                            project:    project._id,
                            sharedBy:   req.user._id,
                            sharedWith: conn.client,
                            connection: conn._id,
                            mode:       'connection',
                            message:    'Your architect has moved this project to Review. Please take a look!'
                        });
                        conn.unreadByClient += 1;
                        await conn.save();
                    }
                }
            } catch (shareErr) {
                console.warn('Auto-share on review failed:', shareErr.message);
            }
        }

        // ── Notify the other party via connection unread count ─────────────────
        try {
            const Connection = require('../models/Connection');
            if (isClient) {
                // Client approved — notify architect
                await Connection.updateOne(
                    { architect: project.owner, client: req.user._id, status: 'accepted' },
                    { $inc: { unreadByArchitect: 1 } }
                );
            } else {
                // Architect advanced — notify client if moved to in_progress, review, or approved
                if (['in_progress', 'review', 'approved'].includes(status)) {
                    // Find connection where architect owns this project and any accepted client
                    const conns = await Connection.find({
                        architect: req.user._id,
                        status:    'accepted'
                    });
                    // Bump unread for all connected clients of this architect
                    // (project is the architect's own design — all accepted clients can see shared version)
                    for (const c of conns) {
                        c.unreadByClient += 1;
                        await c.save();
                    }
                }
            }
        } catch (notifErr) {
            // Notification failure should not block the status update response
            console.warn('Status notification update failed:', notifErr.message);
        }

        res.json({
            success: true,
            data:    project,
            message: `Project status updated to "${status}".`,
            oldStatus,
            newStatus: status
        });
    } catch (error) {
        console.error('updateProjectStatus error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};