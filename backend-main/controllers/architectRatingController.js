// backend-main/controllers/architectRatingController.js
// Handles submitting & fetching architect ratings from clients via shared projects.

const ArchitectRating = require('../models/ArchitectRating');
const ProjectShare    = require('../models/ProjectShare');
const User            = require('../models/User');

// ─── POST /api/shares/:shareId/rate ──────────────────────────────────────────
// Client submits (or updates) a rating for the architect of a shared project.
exports.submitRating = async (req, res) => {
    try {
        const { rating, review = '' } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

        // Verify the share exists, is not revoked, and belongs to this client
        const share = await ProjectShare.findOne({
            _id:       req.params.shareId,
            sharedWith: req.user._id,
            isRevoked: false
        }).populate('sharedBy', '_id');

        if (!share) {
            return res.status(404).json({ success: false, message: 'Share not found or not accessible.' });
        }

        const architectId = share.sharedBy._id;

        // Upsert: update existing rating or create new one
        await ArchitectRating.findOneAndUpdate(
            { architect: architectId, client: req.user._id },
            { architect: architectId, client: req.user._id, share: share._id, rating, review },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Recalculate architect's average rating from all their ratings
        const agg = await ArchitectRating.aggregate([
            { $match: { architect: architectId } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const newAvg   = agg.length ? Math.round(agg[0].avg * 10) / 10 : rating;
        const newCount = agg.length ? agg[0].count : 1;

        await User.findByIdAndUpdate(architectId, {
            rating:        newAvg,
            totalProjects: newCount   // reuse as total-ratings count for display
        });

        return res.json({
            success: true,
            message: 'Rating submitted. Thank you!',
            data:    { rating: newAvg, totalRatings: newCount }
        });

    } catch (err) {
        console.error('submitRating error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/shares/:shareId/rating ─────────────────────────────────────────
// Client checks if they have already rated for a given share.
exports.getMyRating = async (req, res) => {
    try {
        const share = await ProjectShare.findOne({
            _id:        req.params.shareId,
            sharedWith: req.user._id,
            isRevoked:  false
        }).populate('sharedBy', '_id');

        if (!share) {
            return res.status(404).json({ success: false, message: 'Share not found.' });
        }

        const existing = await ArchitectRating.findOne({
            architect: share.sharedBy._id,
            client:    req.user._id
        });

        return res.json({
            success: true,
            data:    existing
                ? { rated: true,  rating: existing.rating, review: existing.review }
                : { rated: false, rating: null,             review: '' }
        });

    } catch (err) {
        console.error('getMyRating error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};