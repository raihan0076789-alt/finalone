// backend-main/models/ProjectShare.js
// Tracks projects shared by architects with their clients.
// Supports two delivery modes:
//   1. connection-based  — sent directly to a connected client's dashboard
//   2. token-based link  — public shareable URL (no login required)

const mongoose = require('mongoose');
const crypto   = require('crypto');

const projectShareSchema = new mongoose.Schema({

    // ── Core refs ──────────────────────────────────────────────────────────────
    project: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'Project',
        required: true,
        index:    true
    },
    sharedBy: {           // architect
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: true
    },

    // ── Delivery mode ──────────────────────────────────────────────────────────
    // 'connection' → sharedWith is set; client can see it on their dashboard
    // 'link'       → sharedWith is null; anyone with shareToken can view
    mode: {
        type: String,
        enum: ['connection', 'link'],
        default: 'connection'
    },
    sharedWith: {         // specific client (null for link mode)
        type:    mongoose.Schema.Types.ObjectId,
        ref:     'User',
        default: null,
        index:   true
    },
    connection: {         // the Connection doc (for connection mode)
        type:    mongoose.Schema.Types.ObjectId,
        ref:     'Connection',
        default: null
    },

    // ── Token (both modes) ────────────────────────────────────────────────────
    // Unique token used in the viewer URL: /project-viewer.html?token=<shareToken>
    shareToken: {
        type:   String,
        unique: true,
        index:  true
    },

    // ── Architect's note to the client ────────────────────────────────────────
    message: {
        type:      String,
        trim:      true,
        maxlength: 500,
        default:   ''
    },

    // ── Access control ────────────────────────────────────────────────────────
    expiresAt: {
        type:    Date,
        default: null   // null = never expires
    },
    isRevoked: {
        type:    Boolean,
        default: false
    },

    // ── Client interaction ────────────────────────────────────────────────────
    viewedAt:    { type: Date, default: null },
    viewCount:   { type: Number, default: 0 }

}, { timestamps: true });

// Auto-generate a unique share token before saving if not already set
projectShareSchema.pre('save', function (next) {
    if (!this.shareToken) {
        this.shareToken = crypto.randomBytes(24).toString('hex');
    }
    next();
});

// Compound index: one active share per project per client (connection mode)
projectShareSchema.index(
    { project: 1, sharedWith: 1 },
    { unique: true, sparse: true, partialFilterExpression: { mode: 'connection', isRevoked: false } }
);

module.exports = mongoose.model('ProjectShare', projectShareSchema);