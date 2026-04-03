// routes/aiChatRoutes.js
// Proxies AI chat/suggestion requests to backend-ai (port 3001)
// while enforcing the aiMessageGuard on each call.

const express        = require('express');
const router         = express.Router();
const { protect }    = require('../middleware/auth');
const { aiMessageGuard } = require('../middleware/planGuard');

const AI_BACKEND     = process.env.AI_BACKEND_URL || 'http://localhost:3001';

// ── Helper: forward JSON body to AI backend ────────────────────────────────
async function proxyPost(path, body, res) {
    try {
        // Use Node's built-in fetch (Node 18+) or fall back to http module
        const fetch = globalThis.fetch || (await import('node-fetch').then(m => m.default).catch(() => null));
        if (!fetch) {
            // Fallback: use http.request
            return proxyPostHttp(path, body, res);
        }

        const upstream = await fetch(`${AI_BACKEND}${path}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        });

        const data = await upstream.json();
        return res.status(upstream.status).json(data);
    } catch (err) {
        console.error('AI proxy error:', err.message);
        return res.status(502).json({
            success: false,
            code:    'AI_BACKEND_UNAVAILABLE',
            message: 'AI service is currently unavailable. Please ensure the AI backend is running.'
        });
    }
}

// http.request fallback (no fetch available)
function proxyPostHttp(path, body, res) {
    const http    = require('http');
    const url     = new URL(`${AI_BACKEND}${path}`);
    const payload = JSON.stringify(body);

    const options = {
        hostname: url.hostname,
        port:     url.port || 3001,
        path:     url.pathname,
        method:   'POST',
        headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = http.request(options, (upstream) => {
        let raw = '';
        upstream.on('data', chunk => raw += chunk);
        upstream.on('end', () => {
            try {
                const data = JSON.parse(raw);
                res.status(upstream.statusCode).json(data);
            } catch {
                res.status(502).json({ success: false, message: 'Invalid response from AI backend.' });
            }
        });
    });

    req.on('error', (err) => {
        console.error('AI proxy http error:', err.message);
        res.status(502).json({ success: false, code: 'AI_BACKEND_UNAVAILABLE', message: 'AI service unavailable.' });
    });

    req.write(payload);
    req.end();
}

// ── POST /api/ai/chat  ─────────────────────────────────────────────────────
// Counts against the user's monthly AI message quota, then proxies to AI backend.
router.post('/chat', protect, aiMessageGuard, async (req, res) => {
    await proxyPost('/api/architecture/chat', req.body, res);
});

// ── POST /api/ai/suggest  ─────────────────────────────────────────────────
// AI design suggestions — also counts against the quota.
router.post('/suggest', protect, aiMessageGuard, async (req, res) => {
    await proxyPost('/api/architecture/suggest', req.body, res);
});

// ── POST /api/ai/feedback  ────────────────────────────────────────────────
// AI design feedback — counts against the quota.
router.post('/feedback', protect, aiMessageGuard, async (req, res) => {
    await proxyPost('/api/architecture/feedback', req.body, res);
});

// ── POST /api/ai/floorplan/generate  ──────────────────────────────────────
// Floorplan generation (no AI message quota — it's a plan feature guard).
router.post('/floorplan/generate', protect, async (req, res) => {
    await proxyPost('/api/architecture/floorplan/generate', req.body, res);
});

module.exports = router;
