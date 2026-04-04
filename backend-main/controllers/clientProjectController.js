// backend-main/controllers/clientProjectController.js
const path          = require('path');
const fs            = require('fs');
const ClientProject = require('../models/ClientProject');

// ── POST /api/client/projects ─────────────────────────────────────────────────
// Creates a new client project. Accepts multipart/form-data.
// Fields come in as stringified JSON + uploaded files.
exports.createProject = async (req, res) => {
    try {
        const clientId = req.user._id;

        // Parse JSON fields sent as form-data strings
        const title       = (req.body.title       || '').trim();
        const projectType = (req.body.projectType || '').trim();

        if (!title)       return res.status(400).json({ success: false, message: 'Title is required.' });
        if (!projectType) return res.status(400).json({ success: false, message: 'Project type is required.' });

        // Budget
        let budget = { min: null, max: null, currency: 'INR' };
        try { budget = { ...budget, ...JSON.parse(req.body.budget || '{}') }; } catch(e) {}

        // Land size
        let landSize = { value: null, unit: 'sqft' };
        try { landSize = { ...landSize, ...JSON.parse(req.body.landSize || '{}') }; } catch(e) {}

        // Requirements
        let requirements = {};
        try { requirements = JSON.parse(req.body.requirements || '{}'); } catch(e) {}

        const style       = req.body.style       || '';
        const description = (req.body.description || '').trim();
        const timeline    = req.body.timeline    || 'flexible';
        const status      = req.body.status      || 'active';

        // Build attachments from uploaded files
        const attachments = (req.files || []).map(file => ({
            originalName: file.originalname,
            filename:     file.filename,
            mimetype:     file.mimetype,
            size:         file.size,
            url:          `/uploads/client-projects/${file.filename}`
        }));

        const project = await ClientProject.create({
            client: clientId,
            title,
            projectType,
            budget,
            landSize,
            style,
            description,
            requirements,
            timeline,
            status,
            attachments
        });

        res.status(201).json({ success: true, data: project, message: 'Project created successfully!' });
    } catch (err) {
        console.error('createProject error:', err);
        // Clean up uploaded files if DB save failed
        (req.files || []).forEach(f => {
            try { fs.unlinkSync(f.path); } catch(e) {}
        });
        res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
};

// ── GET /api/client/projects ──────────────────────────────────────────────────
// List all projects for the authenticated client.
exports.getProjects = async (req, res) => {
    try {
        const { status, sort = '-createdAt', page = 1, limit = 20 } = req.query;

        const filter = { client: req.user._id };
        if (status) filter.status = status;

        const projects = await ClientProject
            .find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-attachments.filename'); // don't expose disk filename to client

        const total = await ClientProject.countDocuments(filter);

        res.json({
            success: true,
            data:    projects,
            pagination: {
                total,
                page:  parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('getProjects error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/client/projects/:id ──────────────────────────────────────────────
// Get a single project (owner only).
exports.getProject = async (req, res) => {
    try {
        const project = await ClientProject
            .findOne({ _id: req.params.id, client: req.user._id });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        res.json({ success: true, data: project });
    } catch (err) {
        console.error('getProject error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/client/projects/:id ──────────────────────────────────────────────
// Update a project (owner only). Handles new file uploads + removal of old ones.
exports.updateProject = async (req, res) => {
    try {
        const project = await ClientProject.findOne({ _id: req.params.id, client: req.user._id });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        // Scalar field updates
        const fields = ['title', 'projectType', 'style', 'description', 'timeline', 'status'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) project[f] = req.body[f];
        });

        try { if (req.body.budget)       project.budget       = { ...project.budget,       ...JSON.parse(req.body.budget) }; }       catch(e) {}
        try { if (req.body.landSize)     project.landSize     = { ...project.landSize,     ...JSON.parse(req.body.landSize) }; }     catch(e) {}
        try { if (req.body.requirements) project.requirements = { ...project.requirements, ...JSON.parse(req.body.requirements) }; } catch(e) {}

        // Append new attachments (up to 10 total)
        const newFiles = (req.files || []).map(file => ({
            originalName: file.originalname,
            filename:     file.filename,
            mimetype:     file.mimetype,
            size:         file.size,
            url:          `/uploads/client-projects/${file.filename}`
        }));
        project.attachments = [...project.attachments, ...newFiles].slice(0, 10);

        await project.save();
        res.json({ success: true, data: project, message: 'Project updated.' });
    } catch (err) {
        console.error('updateProject error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/client/projects/:id ──────────────────────────────────────────
// Delete a project and all its uploaded files.
exports.deleteProject = async (req, res) => {
    try {
        const project = await ClientProject.findOne({ _id: req.params.id, client: req.user._id });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        // Delete files from disk
        const uploadDir = path.join(__dirname, '..', 'uploads', 'client-projects');
        project.attachments.forEach(att => {
            try { fs.unlinkSync(path.join(uploadDir, att.filename)); } catch(e) {}
        });

        await project.deleteOne();
        res.json({ success: true, message: 'Project deleted.' });
    } catch (err) {
        console.error('deleteProject error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/client/projects/:id/attachments/:filename ────────────────────
// Remove a single attachment from a project.
exports.deleteAttachment = async (req, res) => {
    try {
        const project = await ClientProject.findOne({ _id: req.params.id, client: req.user._id });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        const { filename } = req.params;
        const att = project.attachments.find(a => a.url.endsWith(filename));
        if (!att) return res.status(404).json({ success: false, message: 'Attachment not found.' });

        // Remove from disk
        const filePath = path.join(__dirname, '..', 'uploads', 'client-projects', att.filename || filename);
        try { fs.unlinkSync(filePath); } catch(e) {}

        project.attachments = project.attachments.filter(a => !a.url.endsWith(filename));
        await project.save();

        res.json({ success: true, message: 'Attachment removed.' });
    } catch (err) {
        console.error('deleteAttachment error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};