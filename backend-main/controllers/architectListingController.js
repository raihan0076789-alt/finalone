// backend-main/controllers/architectListingController.js
// Provides a public (client-authenticated) listing of all verified architects.
// Exposes: GET /api/client/architects  and  GET /api/client/architects/:id

const User    = require('../models/User');
const Project = require('../models/Project');

// ─── GET /api/client/architects ───────────────────────────────────────────────
// Returns paginated, filterable list of architects for client browsing.
// Query params:
//   specialization  (string, partial match)
//   minExperience   (number)
//   maxExperience   (number)
//   minRating       (number, 0–5)
//   sort            (rating | experience | -rating | -experience | name | -createdAt)
//   page, limit
exports.getArchitectListing = async (req, res) => {
    try {
        const {
            specialization = '',
            minExperience  = 0,
            maxExperience  = 60,
            minRating      = 0,
            sort           = '-rating',
            page           = 1,
            limit          = 12,
            search         = ''
        } = req.query;

        const query = {
            role:      { $in: ['architect', 'user'] },  // 'user' is legacy architect
            suspended: { $ne: true },
            emailVerified: true
        };

        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { name:           { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
                { location:       { $regex: search, $options: 'i' } }
            ];
        }

        // Experience range filter
        query.experience = {
            $gte: parseInt(minExperience) || 0,
            $lte: parseInt(maxExperience) || 60
        };

        // Rating filter
        if (parseFloat(minRating) > 0) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        // Resolve sort field
        const allowedSorts = {
            'rating':      { rating: -1 },
            '-rating':     { rating: -1 },
            'experience':  { experience: -1 },
            '-experience': { experience: -1 },
            'name':        { name: 1 },
            '-name':       { name: -1 },
            '-createdAt':  { createdAt: -1 }
        };
        const sortObj = allowedSorts[sort] || { rating: -1 };

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);

        const architects = await User.find(query)
            .select('name avatar specialization experience rating bio location company totalProjects portfolio createdAt')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Enrich with live project count
        const enriched = await Promise.all(architects.map(async (arch) => {
            const projectCount = await Project.countDocuments({ owner: arch._id });
            return {
                id:             arch._id,
                name:           arch.name,
                avatar:         arch.avatar || '',
                specialization: arch.specialization || 'General Architecture',
                experience:     arch.experience || 0,
                rating:         arch.rating     || 0,
                bio:            arch.bio        || '',
                location:       arch.location   || '',
                company:        arch.company    || '',
                totalProjects:  projectCount,
                portfolio:      arch.portfolio  || [],
                memberSince:    arch.createdAt
            };
        }));

        res.json({
            success: true,
            data: enriched,
            pagination: {
                total,
                page:  parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('getArchitectListing error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── GET /api/client/architects/:id ──────────────────────────────────────────
// Full architect profile for modal / detail view.
exports.getArchitectDetail = async (req, res) => {
    try {
        const arch = await User.findOne({
            _id:      req.params.id,
            role:     { $in: ['architect', 'user'] },
            suspended: { $ne: true }
        }).select('-password -emailOtp -emailOtpExpire -resetPasswordToken -resetPasswordExpire -otpResendCount -otpResendDate').lean();

        if (!arch) {
            return res.status(404).json({ success: false, message: 'Architect not found' });
        }

        // Live project count + recent public projects for the portfolio section
        const [projectCount, recentProjects] = await Promise.all([
            Project.countDocuments({ owner: arch._id }),
            Project.find({ owner: arch._id, isPublic: true })
                .sort({ updatedAt: -1 })
                .limit(6)
                .select('name type status metadata thumbnail description updatedAt')
                .lean()
        ]);

        res.json({
            success: true,
            data: {
                id:             arch._id,
                name:           arch.name,
                email:          arch.email,   // shown only in detail view
                phone:          arch.phone    || '',
                avatar:         arch.avatar   || '',
                specialization: arch.specialization || 'General Architecture',
                experience:     arch.experience || 0,
                rating:         arch.rating     || 0,
                bio:            arch.bio        || '',
                location:       arch.location   || '',
                company:        arch.company    || '',
                portfolio:      arch.portfolio  || [],
                totalProjects:  projectCount,
                recentProjects,
                plan:           arch.plan,
                memberSince:    arch.createdAt
            }
        });
    } catch (error) {
        console.error('getArchitectDetail error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};