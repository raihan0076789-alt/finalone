// backend-main/controllers/clientSupportController.js
// Handles support tickets for client-role users.
// All endpoints require protect + authorize('client').

const ClientTicket = require('../models/ClientTicket');
const sendEmail    = require('../utils/sendEmail');

// ─── Email helpers ─────────────────────────────────────────────────────────────

function adminNotifyHtml(ticket) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1424;color:#f1f5f9;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#00d4c8,#0891b2);padding:24px 32px;">
        <h1 style="margin:0;font-size:1.3rem;color:#fff;">📩 New Client Support Ticket</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.9rem;">SmartArch Client Support</p>
      </div>
      <div style="padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:0.85rem;width:120px;">From</td><td style="color:#f1f5f9;font-weight:600;">${ticket.clientName} &lt;${ticket.clientEmail}&gt;</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:0.85rem;">Subject</td><td style="color:#f1f5f9;font-weight:600;">${ticket.subject}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:0.85rem;">Ticket ID</td><td style="color:#64748b;font-size:0.8rem;">${ticket._id}</td></tr>
        </table>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="margin:0;color:#f1f5f9;line-height:1.7;white-space:pre-wrap;">${ticket.message}</p>
        </div>
        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin.html'}" style="display:inline-block;background:#00d4c8;color:#060a12;padding:12px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:0.9rem;">Open Admin Dashboard →</a>
      </div>
    </div>`;
}

function userConfirmHtml(ticket) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1424;color:#f1f5f9;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#00d4c8,#0891b2);padding:24px 32px;">
        <h1 style="margin:0;font-size:1.3rem;color:#fff;">✅ We received your message!</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.9rem;">SmartArch Client Support</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#f1f5f9;line-height:1.7;">Hi <strong>${ticket.clientName}</strong>,</p>
        <p style="color:#94a3b8;line-height:1.7;">Thanks for reaching out. We've received your message and will get back to you within <strong style="color:#00d4c8;">1–2 business days</strong>.</p>
        <div style="background:rgba(255,255,255,0.04);border-left:3px solid #00d4c8;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:0.78rem;text-transform:uppercase;letter-spacing:1px;">Your message</p>
          <p style="margin:0;color:#f1f5f9;font-style:italic;line-height:1.6;">${ticket.message.slice(0, 200)}${ticket.message.length > 200 ? '…' : ''}</p>
        </div>
        <p style="color:#64748b;font-size:0.8rem;">Ticket ID: <code style="color:#00d4c8;">${ticket._id}</code></p>
      </div>
    </div>`;
}

// ─── POST /api/client/support ─────────────────────────────────────────────────
// Create a new support ticket

exports.createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !subject.trim()) {
            return res.status(400).json({ success: false, message: 'Subject is required.' });
        }
        if (!message || message.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
        }
        if (subject.trim().length > 200) {
            return res.status(400).json({ success: false, message: 'Subject must be under 200 characters.' });
        }
        if (message.trim().length > 5000) {
            return res.status(400).json({ success: false, message: 'Message must be under 5000 characters.' });
        }

        const ticket = await ClientTicket.create({
            clientId:    req.user._id,
            clientName:  req.user.name  || 'Client',
            clientEmail: req.user.email,
            subject:     subject.trim(),
            message:     message.trim()
        });

        // Notify admin
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) {
            try {
                await sendEmail({
                    to:      adminEmail,
                    subject: `[SmartArch Client Support] New Ticket: ${ticket.subject}`,
                    html:    adminNotifyHtml(ticket)
                });
            } catch (e) { console.error('Admin email failed:', e.message); }
        }

        // Confirm to client
        try {
            await sendEmail({
                to:      ticket.clientEmail,
                subject: 'We received your message — SmartArch Support',
                html:    userConfirmHtml(ticket)
            });
        } catch (e) { console.error('Client confirm email failed:', e.message); }

        res.status(201).json({ success: true, message: 'Ticket submitted successfully.', ticket });
    } catch (err) {
        console.error('createTicket error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/client/support ──────────────────────────────────────────────────
// List all tickets for the authenticated client

exports.getTickets = async (req, res) => {
    try {
        const tickets = await ClientTicket.find({ clientId: req.user._id })
            .select('-__v')
            .sort({ updatedAt: -1 });

        res.json({ success: true, tickets });
    } catch (err) {
        console.error('getTickets error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/client/support/unread ───────────────────────────────────────────
// Count of tickets with unread admin replies

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await ClientTicket.countDocuments({
            clientId: req.user._id,
            userRead: false
        });
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/client/support/:id ─────────────────────────────────────────────
// Get a single ticket thread (scoped to the requesting client)

exports.getTicket = async (req, res) => {
    try {
        const ticket = await ClientTicket.findOne({
            _id:      req.params.id,
            clientId: req.user._id     // security: only owner can view
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        // Mark as read when client views it
        if (!ticket.userRead) {
            ticket.userRead = true;
            await ticket.save();
        }

        res.json({ success: true, ticket });
    } catch (err) {
        console.error('getTicket error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/client/support/:id/reply ──────────────────────────────────────
// Client replies to an existing ticket thread

exports.replyToTicket = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || message.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Reply message is required.' });
        }
        if (message.trim().length > 5000) {
            return res.status(400).json({ success: false, message: 'Reply must be under 5000 characters.' });
        }

        const ticket = await ClientTicket.findOne({
            _id:      req.params.id,
            clientId: req.user._id     // security: only owner can reply
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ success: false, message: 'This ticket is closed. Please open a new one.' });
        }

        ticket.replies.push({
            sender:     'client',
            senderName: req.user.name || 'Client',
            message:    message.trim()
        });

        // Re-open if previously replied and client is following up
        if (ticket.status === 'replied') {
            ticket.status = 'open';
        }

        // Mark as unread for admin
        ticket.adminRead = false;
        ticket.userRead  = true;
        await ticket.save();

        // Notify admin of follow-up
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) {
            try {
                await sendEmail({
                    to:      adminEmail,
                    subject: `[SmartArch Client Support] Follow-up on: ${ticket.subject}`,
                    html:    adminNotifyHtml({ ...ticket.toObject(), message: message.trim() })
                });
            } catch (e) { console.error('Follow-up admin email failed:', e.message); }
        }

        res.json({ success: true, message: 'Reply sent.', ticket });
    } catch (err) {
        console.error('replyToTicket error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
