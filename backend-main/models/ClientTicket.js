// backend-main/models/ClientTicket.js
// Support tickets submitted by client-role users from the client dashboard.
// Separate from the general Ticket model so client and architect tickets are
// independently queryable and scoped.
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    sender:      { type: String, enum: ['client', 'admin'], required: true },
    senderName:  { type: String, required: true },
    message:     { type: String, required: true, maxlength: 5000 },
    createdAt:   { type: Date, default: Date.now }
});

const clientTicketSchema = new mongoose.Schema({
    // Owner
    clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientName:  { type: String, required: true, trim: true, maxlength: 100 },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },

    // Ticket content
    subject:     { type: String, required: true, trim: true, maxlength: 200 },
    message:     { type: String, required: true, maxlength: 5000 },

    // Thread
    replies:     [replySchema],

    // Status
    status: {
        type:    String,
        enum:    ['open', 'replied', 'closed'],
        default: 'open'
    },

    // Notification flags
    // userRead: cleared by admin reply, set when client views thread
    userRead:   { type: Boolean, default: true },
    // adminRead: false = new unread message for admin panel
    adminRead:  { type: Boolean, default: false }

}, { timestamps: true });

clientTicketSchema.index({ clientId: 1, createdAt: -1 });
clientTicketSchema.index({ status: 1, adminRead: 1 });

module.exports = mongoose.model('ClientTicket', clientTicketSchema);
