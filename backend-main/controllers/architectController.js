// backend-main/controllers/architectController.js
// Handles GET/PUT /api/architect/profile — architect professional profile.
// All basic auth (login/register/password) stays unchanged in authController.js.

const User    = require('../models/User');
const Project = require('../models/Project');
const Joi     = require('joi');

// ── Validation schema (Joi) ───────────────────────────────────────────────────
const portfolioUrlSchema = Joi.string().uri({ scheme: ['http', 'https'] }).max(500);

const profileUpdateSchema = Joi.object({
    // Basic info (already existed — kept for completeness)
    name:    Joi.string().trim().min(1).max(50),
    phone:   Joi.string().trim().max(20).allow('', null),
    company: Joi.string().trim().max(100).allow('', null),
    avatar:  Joi.string().max(2000000).allow('', null),  // base64 dataURL or URL

    // New architect fields
    bio:            Joi.string().trim().max(500).allow('', null),
    location:       Joi.string().trim().max(100).allow('', null),
    specialization: Joi.string().trim().max(100).allow('', null),
    experience:     Joi.number().integer().min(0).max(60).allow(null),
    portfolio:      Joi.array().items(portfolioUrlSchema).max(10),

    // Preferences sub-object
    preferences: Joi.object({
        theme:       Joi.string().valid('light', 'dark'),
        defaultUnit: Joi.string().valid('meters', 'feet'),
        autoSave:    Joi.boolean()
    })
}).options({ allowUnknown: false, stripUnknown: true });

// ── GET /api/architect/profile ────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Architect not found' });
        }

        // Hydrate totalProjects live from the Project collection
        const projectCount = await Project.countDocuments({ owner: user._id });

        const profile = {
            id:             user._id,
            name:           user.name,
            email:          user.email,
            role:           user.role,
            phone:          user.phone          || '',
            company:        user.company        || '',
            avatar:         user.avatar         || '',
            bio:            user.bio            || '',
            location:       user.location       || '',
            specialization: user.specialization || '',
            experience:     user.experience     || 0,
            portfolio:      user.portfolio      || [],
            rating:         user.rating         || 0,
            totalProjects:  projectCount,
            plan:           user.plan,
            planExpiresAt:  user.planExpiresAt,
            preferences:    user.preferences,
            emailVerified:  user.emailVerified,
            createdAt:      user.createdAt
        };

        res.json({ success: true, user: profile });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── PUT /api/architect/profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        // Validate incoming body
        const { error, value } = profileUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
                field:   error.details[0].path[0]
            });
        }

        // Fields that must NOT be changed here: email, password, role, plan, rating,
        // totalProjects, emailVerified, suspended — all silently dropped by stripUnknown above.
        const updateData = { ...value };

        // If portfolio URLs were provided, sanitise them (already validated by Joi,
        // but we also trim whitespace and deduplicate)
        if (Array.isArray(updateData.portfolio)) {
            updateData.portfolio = [...new Set(
                updateData.portfolio.map(u => u.trim()).filter(Boolean)
            )];
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Architect not found' });
        }

        // Hydrate live project count
        const projectCount = await Project.countDocuments({ owner: user._id });

        const profile = {
            id:             user._id,
            name:           user.name,
            email:          user.email,
            role:           user.role,
            phone:          user.phone          || '',
            company:        user.company        || '',
            avatar:         user.avatar         || '',
            bio:            user.bio            || '',
            location:       user.location       || '',
            specialization: user.specialization || '',
            experience:     user.experience     || 0,
            portfolio:      user.portfolio      || [],
            rating:         user.rating         || 0,
            totalProjects:  projectCount,
            plan:           user.plan,
            planExpiresAt:  user.planExpiresAt,
            preferences:    user.preferences,
            emailVerified:  user.emailVerified,
            createdAt:      user.createdAt
        };

        res.json({ success: true, user: profile, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('updateProfile error:', error);
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ success: false, message: msg });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};