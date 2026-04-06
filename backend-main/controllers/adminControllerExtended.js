// backend-main/controllers/adminControllerExtended.js
// New admin endpoints for the restructured Architect + Client dashboard.
// Works alongside the existing adminController.js — zero breaking changes.

const User          = require('../models/User');
const Project       = require('../models/Project');
const ClientProject = require('../models/ClientProject');

/* ── Patch getAllUsers to accept ?role= filter & return roleStats ────────────
   This wraps the original getAllUsers; we re-export the enhanced version.    */

const originalAdminController = require('./adminController');

exports.getAllUsers = async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 15;
        const search = req.query.search || '';
        const sort   = req.query.sort   || '-createdAt';
        const role   = req.query.role   || null;   // 'architect' | 'client' | null
        const plan   = req.query.plan   || null;
        const verified = req.query.verified;       // 'true' | 'false' | null

        const query = { role: { $ne: 'admin' } };

        if (role) {
            // treat 'user' and 'architect' as the same bucket (backwards-compat)
            if (role === 'architect') query.role = { $in: ['architect', 'user'] };
            else                     query.role = role;
        }

        if (plan) query.plan = plan;

        if (verified === 'true')  query.isVerified = true;
        if (verified === 'false') query.isVerified = { $ne: true };

        if (search) {
            query.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, data] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
        ]);

        // Attach project count per user
        const ids      = data.map(u => u._id);
        const counts   = await Project.aggregate([
            { $match: { owner: { $in: ids } } },
            { $group: { _id: '$owner', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        counts.forEach(c => { countMap[String(c._id)] = c.count; });
        data.forEach(u => { u.projectCount = countMap[String(u._id)] || 0; });

        // Attach request count for clients
        if (!role || role === 'client') {
            const reqCounts = await ClientProject.aggregate([
                { $group: { _id: '$client', count: { $sum: 1 } } }
            ]);
            const reqMap = {};
            reqCounts.forEach(c => { reqMap[String(c._id)] = c.count; });
            data.forEach(u => { u.requestCount = reqMap[String(u._id)] || 0; });
        }

        // Role-specific stats
        let roleStats = {};
        if (role === 'architect' || !role) {
            const archQuery = { role: { $in: ['architect','user'] } };
            const [verified_, unverified_, suspended_] = await Promise.all([
                User.countDocuments({ ...archQuery, isVerified: true }),
                User.countDocuments({ ...archQuery, isVerified: { $ne: true }, suspended: { $ne: true } }),
                User.countDocuments({ ...archQuery, suspended: true }),
            ]);
            roleStats = { verified: verified_, unverified: unverified_, suspended: suspended_ };
        }
        if (role === 'client') {
            const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
            const clientQuery = { role: 'client' };
            const [active_, withRequests_, newThisWeek_] = await Promise.all([
                User.countDocuments({ ...clientQuery, suspended: { $ne: true } }),
                ClientProject.distinct('client').then(ids => ids.length),
                User.countDocuments({ ...clientQuery, createdAt: { $gte: weekAgo } }),
            ]);
            roleStats = { active: active_, withRequests: withRequests_, newThisWeek: newThisWeek_ };
        }

        // thisWeek count for dashboard extras
        const weekAgo   = new Date(Date.now() - 7*24*60*60*1000);
        const thisWeek  = await User.countDocuments({ ...query, createdAt: { $gte: weekAgo } });

        res.json({
            success: true,
            data,
            pagination: { total, page, pages: Math.ceil(total / limit), limit, thisWeek },
            roleStats
        });
    } catch(error) {
        console.error('getAllUsers (extended) error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/* ── Verify / un-verify an architect ─────────────────────────────────────── */
exports.verifyUser = async (req, res) => {
    try {
        const { isVerified } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isVerified: Boolean(isVerified) },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch(error) {
        console.error('verifyUser error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/* ── Client Projects (admin list) ────────────────────────────────────────── */
exports.getClientProjects = async (req, res) => {
    try {
        const page        = parseInt(req.query.page)  || 1;
        const limit       = parseInt(req.query.limit) || 15;
        const search      = req.query.search      || '';
        const status      = req.query.status      || '';
        const projectType = req.query.projectType || '';

        const query = {};
        if (status)      query.status      = status;
        if (projectType) query.projectType = projectType;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, data] = await Promise.all([
            ClientProject.countDocuments(query),
            ClientProject.find(query)
                .sort('-createdAt')
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('client', 'name email')
                .lean()
        ]);

        // Status stats
        const [pending_, accepted_, rejected_] = await Promise.all([
            ClientProject.countDocuments({ status: 'pending' }),
            ClientProject.countDocuments({ status: 'accepted' }),
            ClientProject.countDocuments({ status: 'rejected' }),
        ]);

        res.json({
            success: true,
            data,
            pagination: { total, page, pages: Math.ceil(total / limit), limit },
            stats: { pending: pending_, accepted: accepted_, rejected: rejected_ }
        });
    } catch(error) {
        console.error('getClientProjects error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/* ── Client Project detail ───────────────────────────────────────────────── */
exports.getClientProjectById = async (req, res) => {
    try {
        const project = await ClientProject.findById(req.params.id)
            .populate('client', 'name email phone company')
            .lean();
        if (!project) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, data: project });
    } catch(error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/* ── Client analytics ────────────────────────────────────────────────────── */
exports.getClientProjectAnalytics = async (req, res) => {
    try {
        const monthAgo = new Date(Date.now() - 30*24*60*60*1000);
        const weekAgo  = new Date(Date.now() -  7*24*60*60*1000);

        const [total_, accepted_, byType_, byStatus_, clientGrowthRaw_] = await Promise.all([
            ClientProject.countDocuments(),
            ClientProject.countDocuments({ status: 'accepted' }),
            ClientProject.aggregate([{ $group: { _id: '$projectType', count: { $sum: 1 } } }]),
            ClientProject.aggregate([{ $group: { _id: '$status',      count: { $sum: 1 } } }]),
            User.aggregate([
                { $match: { role: 'client', createdAt: { $gte: monthAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                total    : total_,
                accepted : accepted_,
                byType   : byType_,
                byStatus : byStatus_,
                clientGrowth: clientGrowthRaw_
            }
        });
    } catch(error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
