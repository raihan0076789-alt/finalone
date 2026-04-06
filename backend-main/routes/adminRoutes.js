// backend-main/routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const { adminProtect } = require('../middleware/adminAuth');

// Original controller (login, dashboard, projects, AI scores)
const {
    adminLogin,
    getDashboardStats,
    getUserById,
    updateUserStatus,
    deleteUser,
    getAllProjects,
    getProjectById,
    updateProjectVisibility,
    deleteProject,
    getAIScoreAnalytics
} = require('../controllers/adminController');

// Extended controller (role-filtered users, verify, client-projects)
const {
    getAllUsers,
    verifyUser,
    getClientProjects,
    getClientProjectById,
    getClientProjectAnalytics
} = require('../controllers/adminControllerExtended');

// ── Public ──
router.post('/login', adminLogin);

// ── Dashboard & Analytics ──
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/ai-scores', adminProtect, getAIScoreAnalytics);

// ── Users (extended: supports ?role=architect|client, ?plan=, ?verified=) ──
router.get('/users',             adminProtect, getAllUsers);
router.get('/users/:id',         adminProtect, getUserById);
router.patch('/users/:id/status',adminProtect, updateUserStatus);
router.patch('/users/:id/verify',adminProtect, verifyUser);
router.delete('/users/:id',      adminProtect, deleteUser);

// ── Projects (architect design projects) ──
router.get('/projects',                    adminProtect, getAllProjects);
router.get('/projects/:id',                adminProtect, getProjectById);
router.patch('/projects/:id/visibility',   adminProtect, updateProjectVisibility);
router.delete('/projects/:id',             adminProtect, deleteProject);

// ── Client-Projects / Requests ──
router.get('/client-projects',             adminProtect, getClientProjects);
router.get('/client-projects/analytics',   adminProtect, getClientProjectAnalytics);
router.get('/client-projects/:id',         adminProtect, getClientProjectById);

module.exports = router;
