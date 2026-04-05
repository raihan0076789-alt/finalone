/**
 * presence.js — Heartbeat-based online/offline presence
 *
 * Usage: call startHeartbeat({ apiBase, getToken }) once per page.
 * Then use isOnline(lastSeen) anywhere to check if a user is online.
 *
 * Rules:
 *   - Pings POST {apiBase}/auth/heartbeat every 30 s while page is visible
 *   - Pauses automatically when tab is hidden (Page Visibility API)
 *   - Resumes immediately when tab becomes visible again
 *   - <60 s since lastSeen → 🟢 Online,  else ⚪ Offline
 */

const HEARTBEAT_INTERVAL_MS = 30_000;   // 30 seconds
const ONLINE_THRESHOLD_MS   = 60_000;   // 60 seconds

let _hbTimer    = null;
let _apiBase    = '';
let _getToken   = () => null;

/**
 * Start pinging the heartbeat endpoint.
 * Safe to call multiple times — clears any existing interval first.
 *
 * @param {{ apiBase: string, getToken: () => string|null }} opts
 */
function startHeartbeat({ apiBase, getToken }) {
    _apiBase   = apiBase;
    _getToken  = getToken;

    stopHeartbeat();

    // Fire immediately so lastSeen is fresh on login
    _ping();

    _hbTimer = setInterval(_ping, HEARTBEAT_INTERVAL_MS);

    // Pause/resume on tab visibility change
    document.addEventListener('visibilitychange', _onVisibilityChange);
}

function stopHeartbeat() {
    if (_hbTimer) {
        clearInterval(_hbTimer);
        _hbTimer = null;
    }
    document.removeEventListener('visibilitychange', _onVisibilityChange);
}

function _onVisibilityChange() {
    if (document.visibilityState === 'visible') {
        // Ping immediately on tab focus, then restart interval
        _ping();
        if (_hbTimer) clearInterval(_hbTimer);
        _hbTimer = setInterval(_ping, HEARTBEAT_INTERVAL_MS);
    } else {
        // Tab hidden — stop pinging to save resources
        if (_hbTimer) {
            clearInterval(_hbTimer);
            _hbTimer = null;
        }
    }
}

async function _ping() {
    const token = _getToken();
    if (!token) return;   // not logged in — skip silently

    try {
        await fetch(`${_apiBase}/auth/heartbeat`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (_) {
        // Network error — silently ignore, will retry on next interval
    }
}

/**
 * Returns true if the given lastSeen timestamp is within the online threshold.
 *
 * @param {string|Date|null} lastSeen  — ISO string or Date from the API
 * @returns {boolean}
 */
function isOnline(lastSeen) {
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
}

/**
 * Returns an HTML string for an online/offline badge dot + label.
 *
 * @param {string|Date|null} lastSeen
 * @param {string}           onlineLabel   e.g. 'Online' or 'Architect · Online'
 * @param {string}           offlineLabel  e.g. 'Offline'
 * @returns {string}  HTML
 */
function presenceBadgeHtml(lastSeen, onlineLabel = 'Online', offlineLabel = 'Offline') {
    const online = isOnline(lastSeen);
    const color  = online ? '#10b981' : '#64748b';
    const glow   = online ? `box-shadow:0 0 6px #10b981;` : '';
    const dot    = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};${glow}flex-shrink:0;vertical-align:middle;"></span>`;
    const label  = `<span style="color:${color};vertical-align:middle;">${online ? onlineLabel : offlineLabel}</span>`;
    return `<span style="display:inline-flex;align-items:center;gap:4px;">${dot}${label}</span>`;
}

// Expose globals for plain-HTML pages
window.startHeartbeat   = startHeartbeat;
window.stopHeartbeat    = stopHeartbeat;
window.isOnline         = isOnline;
window.presenceBadgeHtml = presenceBadgeHtml;