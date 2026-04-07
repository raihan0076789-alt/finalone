// backend-main/models/ArchitectRating.js
// One rating per client per architect, submitted after viewing a shared project.

const mongoose = require('mongoose');

const architectRatingSchema = new mongoose.Schema({
    architect: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: true,
        index:    true
    },
    client: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: true
    },
    // The share that triggered the rating prompt
    share: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'ProjectShare',
        required: true
    },
    rating: {
        type:     Number,
        required: true,
        min:      1,
        max:      5
    },
    review: {
        type:      String,
        trim:      true,
        maxlength: [500, 'Review cannot exceed 500 characters'],
        default:   ''
    }
}, { timestamps: true });

// One rating per client per architect (can update if they re-view)
architectRatingSchema.index({ architect: 1, client: 1 }, { unique: true });

module.exports = mongoose.model('ArchitectRating', architectRatingSchema);