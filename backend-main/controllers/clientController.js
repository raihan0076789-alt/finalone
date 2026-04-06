// backend-main/controllers/clientController.js
const User    = require('../models/User');
const Project = require('../models/Project');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const sendEmail          = require('../utils/sendEmail');
const verifyEmailTemplate = require('../utils/verifyEmail');
const welcomeEmailTemplate = require('../utils/welcomeEmail');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

// ─── POST /api/client/register ────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password, company, phone } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Create user with role 'client'
        const user = await User.create({ name, email, password, company, phone, role: 'client' });

        const otp = user.getEmailOtp();
        await user.save({ validateBeforeSave: false });

        try {
            await sendEmail({
                to: user.email,
                subject: 'SmartArch — Your verification code',
                html: verifyEmailTemplate(user.name, otp)
            });
        } catch (emailErr) {
            console.error('OTP email failed:', emailErr.message);
        }

        res.status(201).json({
            success: true,
            requiresVerification: true,
            email: user.email,
            message: 'Account created! Enter the 6-digit code sent to your email.'
        });
    } catch (error) {
        console.error('Client register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── POST /api/client/login ───────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Allow client role (and legacy 'user' treated as client too if needed)
        if (user.role !== 'client') {
            return res.status(403).json({
                success: false,
                message: 'This portal is for clients only. Architects please use the main portal.'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                requiresVerification: true,
                email: user.email,
                message: 'Please verify your email before logging in.'
            });
        }

        if (user.suspended) {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company || '',
                phone: user.phone || '',
                avatar: user.avatar || '',
                plan: user.plan,
                planExpiresAt: user.planExpiresAt,
                preferences: user.preferences,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── GET /api/client/me ───────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        console.error('Client getMe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── PUT /api/client/profile ──────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, company, avatar, bio, location, preferences } = req.body;

        // Only allow fields that clients may update — role, plan, email etc. are excluded
        const updateFields = {};
        if (name     !== undefined) updateFields.name     = name;
        if (phone    !== undefined) updateFields.phone    = phone;
        if (company  !== undefined) updateFields.company  = company;
        if (bio      !== undefined) updateFields.bio      = String(bio).slice(0, 500);
        if (location !== undefined) updateFields.location = String(location).slice(0, 100);
        if (avatar   !== undefined) updateFields.avatar   = avatar;
        if (preferences !== undefined) updateFields.preferences = preferences;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        console.error('Client updateProfile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── GET /api/client/dashboard ───────────────────────────────────────────────
// Returns summary data for the client dashboard
exports.getDashboard = async (req, res) => {
    try {
        // Placeholder — expand as client features grow
        res.json({
            success: true,
            data: {
                message: 'Welcome to your client dashboard',
                userId: req.user._id
            }
        });
    } catch (error) {
        console.error('Client dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ─── DELETE /api/client/account ──────────────────────────────────────────────
// Permanently removes the client account and all their data.
exports.deleteAccount = async (req, res) => {
    try {
        const ClientProject = require('../models/ClientProject');
        const Connection    = require('../models/Connection');

        // Delete all client projects + connections, then the user itself
        await ClientProject.deleteMany({ client: req.user._id });
        await Connection.deleteMany({ client: req.user._id });
        await User.findByIdAndDelete(req.user._id);

        res.json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Client deleteAccount error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};