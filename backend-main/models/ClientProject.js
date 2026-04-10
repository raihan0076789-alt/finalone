// backend-main/models/ClientProject.js
// Projects created by clients (NOT architect design projects).
// These represent real-world construction briefs that clients want built.

const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    filename:     { type: String, required: true },   // stored filename on disk
    mimetype:     { type: String, required: true },
    size:         { type: Number, required: true },    // bytes
    url:          { type: String, required: true }     // relative URL to serve
}, { _id: false });

const clientProjectSchema = new mongoose.Schema({

    // ── Owner ──────────────────────────────────────────────────────────────────
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
        required: true,
        index: true
    },

    // ── Step 1: Basic Info ─────────────────────────────────────────────────────
    title: {
        type:      String,
        required:  [true, 'Project title is required'],
        trim:      true,
        maxlength: [120, 'Title cannot exceed 120 characters']
    },
    projectType: {
        type: String,
        enum: ['residential', 'commercial', 'industrial', 'interior', 'renovation', 'landscape', 'other'],
        required: [true, 'Project type is required']
    },

    // ── Step 2: Requirements ───────────────────────────────────────────────────
    budget: {
        min:      { type: Number, default: null },
        max:      { type: Number, default: null },
        currency: { type: String, default: 'INR' }
    },
    landSize: {
        value: { type: Number, default: null },
        unit:  { type: String, enum: ['sqft', 'sqm', 'acres', 'cents'], default: 'sqft' }
    },
    style: {
        type: String,
        enum: ['modern', 'traditional', 'contemporary', 'minimalist', 'colonial', 'mediterranean', 'other', ''],
        default: ''
    },
    description: {
        type:      String,
        trim:      true,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
        default:   ''
    },
    requirements: {
        bedrooms:  { type: Number, default: null },
        bathrooms: { type: Number, default: null },
        floors:    { type: Number, default: null },
        garage:    { type: Boolean, default: false },
        pool:      { type: Boolean, default: false },
        garden:    { type: Boolean, default: false }
    },
    timeline: {
        type: String,
        validate: {
            validator: function(v) {
                const allowed = ['asap', '1-3months', '3-6months', '6-12months', 'flexible', ''];
                if (allowed.includes(v)) return true;
                // Allow specific future date in format date:YYYY-MM-DD
                if (/^date:\d{4}-\d{2}-\d{2}$/.test(v)) {
                    const picked = new Date(v.slice(5) + 'T00:00:00');
                    const today  = new Date(); today.setHours(0, 0, 0, 0);
                    return picked > today;
                }
                return false;
            },
            message: props => `"${props.value}" is not a valid timeline value.`
        },
        default: 'flexible'
    },

    // ── Step 3: Attachments ────────────────────────────────────────────────────
    attachments: {
        type:     [attachmentSchema],
        validate: {
            validator: arr => arr.length <= 10,
            message:   'Cannot attach more than 10 files'
        },
        default: []
    },

    // ── Status & workflow ──────────────────────────────────────────────────────
    status: {
        type:    String,
        enum:    ['draft', 'active', 'in_progress', 'completed', 'cancelled'],
        default: 'active'
    },

    // Optional: linked architect connection
    linkedConnection: {
        type:    mongoose.Schema.Types.ObjectId,
        ref:     'Connection',
        default: null
    }

}, { timestamps: true });

// Full-text search on title + description
clientProjectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('ClientProject', clientProjectSchema);