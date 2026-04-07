'use strict';
const CLIENT_API = 'http://localhost:5000/api';

/* ============================================================
   VIEW SWITCHER
   ============================================================ */
const VIEWS = {
    dashboard: {
        el: 'view-dashboard', navId: 'nav-dashboard',
        title: 'Dashboard', sub: null,
        showDashBtns: true, showPlan: false
    },
    architects: {
        el: 'view-architects', navId: 'nav-architects',
        title: 'Find Architects', sub: 'Browse verified architecture professionals',
        showDashBtns: false, showPlan: true
    },
    connections: {
        el: 'view-connections', navId: 'nav-connections',
        title: 'My Architects', sub: 'Manage your architect connections',
        showDashBtns: false, showPlan: false
    },
    projects: {
        el: 'view-projects', navId: 'nav-projects',
        title: 'My Projects', sub: 'Manage your construction briefs',
        showDashBtns: false, showPlan: false
    },
    shared: {
        el: 'view-shared', navId: 'nav-shared',
        title: 'Design Submissions', sub: 'Review designs submitted by your architects',
        showDashBtns: false, showPlan: false
    },
    settings: {
        el: 'view-settings', navId: 'nav-settings',
        title: 'Settings', sub: 'Manage your account and preferences',
        showDashBtns: false, showPlan: false
    },
    support: {
        el: 'view-support', navId: 'nav-support',
        title: 'Support', sub: 'Get help from the SmartArch team',
        showDashBtns: false, showPlan: false,
        displayType: 'flex'
    }
};

let currentView = 'dashboard';
let architectsLoaded = false;
let connectionsLoaded = false;

function showView(name, event) {
    if (event) event.preventDefault();
    if (name === currentView) { closeSidebar(); return; }

    const prev = VIEWS[currentView];
    const next = VIEWS[name];

    document.getElementById(prev.el).style.display = 'none';
    document.getElementById(next.el).style.display = next.displayType || '';

    document.getElementById(prev.navId).classList.remove('active');
    document.getElementById(next.navId).classList.add('active');

    document.getElementById('topbarTitle').textContent = next.title;
    document.getElementById('topbarSub').textContent   = next.sub || '';

    document.getElementById('notifWrap').style.display       = next.showDashBtns ? '' : 'none';
    document.getElementById('topbarSearchBtn').style.display = next.showDashBtns ? '' : 'none';
    document.getElementById('topbarPlan').style.display      = next.showPlan     ? '' : 'none';

    currentView = name;
    closeSidebar();

    // Lazy-load architects grid on first switch to that view
    if (name === 'architects' && !architectsLoaded) {
        architectsLoaded = true;
        fetchArchitects();
    }
    if (name === 'connections') {
        loadConnections();
    }
    if (name === 'projects') {
        loadClientProjects();
    }
    if (name === 'shared') {
        loadSharedProjects();
    }
    if (name === 'settings') {
        loadClientSettings();
    }
    if (name === 'support') {
        clientSupportInit();
    }
}

/* ============================================================
   AUTH
   ============================================================ */
function requireClientAuth() {
    const token = localStorage.getItem('client_token');
    if (!token) { window.location.href = 'client-index.html?modal=login'; return null; }
    return token;
}
function getToken()    { return localStorage.getItem('client_token'); }
function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}
function logout() {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
    showToast('Logged out successfully', 'info');
    setTimeout(function() { window.location.href = 'client-index.html'; }, 800);
}

/* ============================================================
   USER / SIDEBAR
   ============================================================ */
function loadUser() {
    var userStr = localStorage.getItem('client_user');
    if (!userStr) return;
    try {
        var user = JSON.parse(userStr);
        var avatarUrl = user.avatar ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'C') + '&background=8b5cf6&color=fff&bold=true';

        var sname   = document.getElementById('sidebarName');
        var semail  = document.getElementById('sidebarEmail');
        var savatar = document.getElementById('sidebarAvatar');
        if (sname)   sname.textContent  = user.name  || '-';
        if (semail)  semail.textContent = user.email || '-';
        if (savatar) savatar.src = avatarUrl;

        var tavatar = document.getElementById('topbarAvatar');
        if (tavatar) tavatar.src = avatarUrl;

        // Time-based greeting (only shown when dashboard is active)
        var hour = new Date().getHours();
        var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        var firstName = user.name ? user.name.split(' ')[0] : 'there';
        document.getElementById('topbarSub').textContent = greeting + ', ' + firstName + '! Welcome back!';

        // Plan badge
        var pb   = document.getElementById('topbarPlan');
        var plan = user.plan || 'free';
        pb.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
        pb.className   = 'plan-badge plan-' + plan;

    } catch (e) { console.error('loadUser error', e); }
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type) {
    type = type || 'info';
    var c = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast-item ' + type;
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    t.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + msg + '</span>';
    c.appendChild(t);
    setTimeout(function() {
        t.style.opacity    = '0';
        t.style.transform  = 'translateX(60px)';
        t.style.transition = 'all 0.3s';
        setTimeout(function() { t.remove(); }, 350);
    }, 3200);
}
function comingSoon(e, name) {
    e.preventDefault();
    showToast(name + ' - coming soon! We are building this for you.', 'info');
}
function comingSoonToast(name) {
    showToast(name + ' - coming soon!', 'info');
}

/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

/* ============================================================
   FIND ARCHITECTS - STATE
   ============================================================ */
var archState = {
    page: 1, limit: 12,
    sort: '-rating',
    search: '', minExp: '', maxExp: '',
    minRating: '0', specialization: '',
    total: 0, pages: 0, loading: false
};
var searchDebounce = null;

/* ============================================================
   FETCH ARCHITECTS
   ============================================================ */
async function fetchArchitects() {
    if (archState.loading) return;
    archState.loading = true;
    renderSkeletons();

    var params = new URLSearchParams({
        page: archState.page, limit: archState.limit, sort: archState.sort
    });
    if (archState.search)         params.set('search',         archState.search);
    if (archState.specialization) params.set('specialization', archState.specialization);
    if (archState.minExp)         params.set('minExperience',  archState.minExp);
    if (archState.maxExp)         params.set('maxExperience',  archState.maxExp);
    if (parseFloat(archState.minRating) > 0) params.set('minRating', archState.minRating);

    try {
        var r = await fetch(CLIENT_API + '/client/architects?' + params, { headers: authHeaders() });
        if (r.status === 401 || r.status === 403) { logout(); return; }
        var d = await r.json();
        if (d.success) {
            archState.total = d.pagination.total;
            archState.pages = d.pagination.pages;
            renderCards(d.data);
            renderPagination();
            document.getElementById('resultsCount').innerHTML =
                '<strong>' + d.pagination.total + '</strong> architect' +
                (d.pagination.total !== 1 ? 's' : '') + ' found';
        } else { renderError(); }
    } catch (err) { renderError(); }
    finally { archState.loading = false; }
}

/* ============================================================
   RENDER CARDS
   ============================================================ */
function renderSkeletons() {
    document.getElementById('architectGrid').innerHTML = Array.from({ length: 6 }).map(function() {
        return '<div class="skel-card">' +
            '<div class="skel-header">' +
                '<div class="skeleton skel-avatar"></div>' +
                '<div class="skel-lines">' +
                    '<div class="skeleton skel-line" style="width:70%"></div>' +
                    '<div class="skeleton skel-line" style="width:50%"></div>' +
                    '<div class="skeleton skel-line" style="width:40%"></div>' +
                '</div>' +
            '</div>' +
            '<div class="skel-stats">' +
                '<div class="skeleton skel-stat"></div>' +
                '<div class="skeleton skel-stat"></div>' +
                '<div class="skeleton skel-stat"></div>' +
            '</div>' +
            '<div class="skel-footer skeleton"></div>' +
        '</div>';
    }).join('');
    document.getElementById('pagination').innerHTML = '';
}

function renderCards(architects) {
    var grid = document.getElementById('architectGrid');
    if (!architects.length) {
        grid.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-icon"><i class="fas fa-user-slash"></i></div>' +
                '<div class="empty-title">No architects found</div>' +
                '<div class="empty-text">Try adjusting your filters or search terms</div>' +
            '</div>';
        return;
    }
    grid.innerHTML = architects.map(function(a, i) {
        var avatar = a.avatar ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(a.name) + '&background=8b5cf6&color=fff&bold=true&size=80';
        var bio = a.bio || 'Experienced architect ready to bring your vision to life.';
        var locationHtml = a.location
            ? '<div class="card-location"><i class="fas fa-map-marker-alt" style="font-size:0.65rem"></i>' + esc(a.location) + '</div>'
            : '';
        return '<div class="arch-card" style="animation-delay:' + (i * 0.05) + 's" onclick="openProfile(\'' + a.id + '\')">' +
            '<div class="card-header">' +
                '<div class="card-avatar-wrap">' +
                    '<img class="card-avatar" src="' + avatar + '" alt="' + esc(a.name) + '"' +
                        ' onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent(a.name) + '&background=8b5cf6&color=fff&bold=true\'">' +
                    '<div class="card-avatar-badge"></div>' +
                '</div>' +
                '<div class="card-info">' +
                    '<div class="card-name" title="' + esc(a.name) + '">' + esc(a.name) + '</div>' +
                    '<div class="card-spec">' + esc(a.specialization) + '</div>' +
                    locationHtml +
                '</div>' +
            '</div>' +
            '<div class="card-stats">' +
                '<div class="stat-item"><div class="stat-value">' + (a.experience || 0) + '</div><div class="stat-label">Years Exp.</div></div>' +
                '<div class="stat-item"><div class="stars">' + renderStars(a.rating) + '</div><div class="stat-label">' + (a.rating || 0).toFixed(1) + ' Rating</div></div>' +
                '<div class="stat-item"><div class="stat-value">' + (a.totalProjects || 0) + '</div><div class="stat-label">Projects</div></div>' +
            '</div>' +
            '<div class="card-footer">' +
                '<div class="card-bio">' + esc(bio) + '</div>' +
                '<div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.65rem">' +
                    '<span class="card-cta">View <i class="fas fa-arrow-right" style="font-size:0.7rem"></i></span>' +
                    '<button class="connect-card-btn" id="cbtn-' + a.id + '" ' +
                        'onclick="event.stopPropagation();openConnectModal(\'' + a.id + '\',\'' + esc(a.name) + '\',\'' + esc(a.specialization) + '\',\'' + (a.avatar||'') + '\')"> ' +
                        '<i class="fas fa-user-plus" style="font-size:0.7rem"></i> Connect' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function renderPagination() {
    var el = document.getElementById('pagination');
    if (archState.pages <= 1) { el.innerHTML = ''; return; }
    var html = '<button class="page-btn" onclick="goPage(' + (archState.page - 1) + ')" ' + (archState.page <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
    for (var p = 1; p <= archState.pages; p++) {
        if (archState.pages > 7 && Math.abs(p - archState.page) > 2 && p !== 1 && p !== archState.pages) {
            if (p === 2 || p === archState.pages - 1) html += '<span style="color:var(--slate);padding:0 4px">...</span>';
            continue;
        }
        html += '<button class="page-btn ' + (p === archState.page ? 'active' : '') + '" onclick="goPage(' + p + ')">' + p + '</button>';
    }
    html += '<button class="page-btn" onclick="goPage(' + (archState.page + 1) + ')" ' + (archState.page >= archState.pages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
    el.innerHTML = html;
}

function renderError() {
    document.getElementById('architectGrid').innerHTML =
        '<div class="empty-state">' +
            '<div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>' +
            '<div class="empty-title">Failed to load architects</div>' +
            '<div class="empty-text">Please check that the server is running and try again.</div>' +
        '</div>';
}

/* ============================================================
   MODAL
   ============================================================ */
async function openProfile(id) {
    var backdrop = document.getElementById('modalBackdrop');
    var body     = document.getElementById('modalBody');
    var av       = document.getElementById('modalAvatar');

    body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--slate)">' +
        '<i class="fas fa-spinner fa-spin" style="font-size:1.5rem;margin-bottom:1rem;display:block"></i>' +
        'Loading profile...</div>';
    av.src = '';
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
        var r = await fetch(CLIENT_API + '/client/architects/' + id, { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) throw new Error();
        renderModal(d.data);
    } catch (err) {
        body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--rose)">' +
            '<i class="fas fa-exclamation-circle" style="font-size:1.5rem;margin-bottom:1rem;display:block"></i>' +
            'Could not load architect profile.</div>';
    }
}

function renderModal(a) {
    var av = document.getElementById('modalAvatar');
    var fallback = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(a.name) + '&background=8b5cf6&color=fff&bold=true&size=80';
    av.src = a.avatar || fallback;
    av.onerror = function() { av.src = fallback; };

    var stars      = renderStars(a.rating, true);
    var planBadge  = planBadgeHtml(a.plan);
    var memberYear = a.memberSince ? new Date(a.memberSince).getFullYear() : '-';

    var portfolioHtml = '';
    if (a.portfolio && a.portfolio.length) {
        portfolioHtml = '<div class="modal-section">' +
            '<div class="modal-section-title"><i class="fas fa-link" style="color:var(--violet)"></i> Portfolio Links</div>' +
            '<div class="portfolio-links">' +
            a.portfolio.map(function(url) {
                return '<a href="' + url + '" target="_blank" rel="noopener" class="portfolio-link">' +
                    '<i class="fas fa-external-link-alt portfolio-link-icon"></i>' +
                    '<span class="portfolio-link-text">' + url + '</span>' +
                    '<i class="fas fa-chevron-right portfolio-link-arrow"></i>' +
                '</a>';
            }).join('') +
            '</div></div>';
    }

    var projectsHtml = '';
    if (a.recentProjects && a.recentProjects.length) {
        projectsHtml = '<div class="modal-section">' +
            '<div class="modal-section-title"><i class="fas fa-folder" style="color:var(--violet)"></i> Recent Projects</div>' +
            '<div class="projects-grid">' +
            a.recentProjects.map(function(p) {
                var areaHtml = (p.metadata && p.metadata.totalArea)
                    ? '<div class="project-card-type">' + p.metadata.totalArea.toLocaleString() + ' m2</div>'
                    : '';
                return '<div class="project-card">' +
                    '<div class="project-card-name" title="' + esc(p.name) + '">' + esc(p.name) + '</div>' +
                    '<div class="project-card-type">' + esc(p.type || 'residential') + '</div>' +
                    areaHtml +
                    '<span class="project-tag tag-' + p.status + '">' + p.status.replace('_', ' ') + '</span>' +
                '</div>';
            }).join('') +
            '</div></div>';
    }

    var emailHtml   = a.email   ? '<div class="contact-item"><div class="contact-icon email"><i class="fas fa-envelope"></i></div><div><div class="contact-lbl">Email</div><div class="contact-val">' + esc(a.email) + '</div></div></div>' : '';
    var phoneHtml   = a.phone   ? '<div class="contact-item"><div class="contact-icon phone"><i class="fas fa-phone"></i></div><div><div class="contact-lbl">Phone</div><div class="contact-val">' + esc(a.phone) + '</div></div></div>' : '';
    var companyHtml = a.company ? '<div class="contact-item"><div class="contact-icon company"><i class="fas fa-building"></i></div><div><div class="contact-lbl">Company</div><div class="contact-val">' + esc(a.company) + '</div></div></div>' : '';
    var memberHtml  = '<div class="contact-item"><div class="contact-icon member"><i class="fas fa-calendar-alt"></i></div><div><div class="contact-lbl">Member Since</div><div class="contact-val">' + memberYear + '</div></div></div>';
    var contactHtml = '<div class="modal-section"><div class="modal-section-title"><i class="fas fa-id-card" style="color:var(--violet)"></i> Contact &amp; Info</div><div class="contact-grid">' + emailHtml + phoneHtml + companyHtml + memberHtml + '</div></div>';

    var locationHtml = a.location ? '<div class="modal-meta-item"><i class="fas fa-map-marker-alt"></i>' + esc(a.location) + '</div>' : '';
    var bioHtml = a.bio
        ? '<div class="modal-bio">' + esc(a.bio) + '</div>'
        : '<div class="modal-bio"><span class="modal-bio-empty">No bio provided yet.</span></div>';

    document.getElementById('modalBody').innerHTML =
        '<div class="modal-name">' + esc(a.name) + ' ' + planBadge + '</div>' +
        '<div class="modal-spec">' + esc(a.specialization) + '</div>' +
        '<div class="modal-meta">' + locationHtml + '<div class="modal-meta-item">' + stars + '<span style="margin-left:4px;color:var(--white)">' + (a.rating || 0).toFixed(1) + '</span></div></div>' +
        '<div class="modal-stats">' +
            '<div class="modal-stat"><div class="modal-stat-val">' + (a.experience || 0) + '</div><div class="modal-stat-lbl">Years Exp.</div></div>' +
            '<div class="modal-stat"><div class="modal-stat-val">' + (a.totalProjects || 0) + '</div><div class="modal-stat-lbl">Projects</div></div>' +
            '<div class="modal-stat"><div class="modal-stat-val">' + (a.rating || 0).toFixed(1) + '</div><div class="modal-stat-lbl">Rating</div></div>' +
        '</div>' +
        '<div class="modal-section"><div class="modal-section-title"><i class="fas fa-user" style="color:var(--violet)"></i> About</div>' + bioHtml + '</div>' +
        portfolioHtml + projectsHtml + contactHtml +
        '<div style="padding:0.25rem 0 0.5rem">' +
            '<button class="connect-modal-cta" id="modalConnectBtn" ' +
                'onclick="openConnectModal(\'' + a.id + '\',\'' + esc(a.name) + '\',\'' + esc(a.specialization) + '\',\'' + (a.avatar||'') + '\')"> ' +
                '<i class="fas fa-user-plus"></i> Connect with ' + esc(a.name.split(' ')[0]) +
            '</button>' +
        '</div>';
    // Update connect button state after modal renders
    setTimeout(function() { refreshModalConnectBtn(a.id); }, 100);
}

function closeModal(e) {
    if (e && e.target !== document.getElementById('modalBackdrop')) return;
    closeModalDirect();
}
function closeModalDirect() {
    document.getElementById('modalBackdrop').classList.remove('open');
    document.body.style.overflow = '';
}

/* ============================================================
   FILTER CONTROLS
   ============================================================ */
function setExp(btn, min, max) {
    document.querySelectorAll('[data-exp]').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    archState.minExp = min; archState.maxExp = max; archState.page = 1;
    fetchArchitects();
}
function setRating(btn, rating) {
    document.querySelectorAll('[data-rating]').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    archState.minRating = rating; archState.page = 1;
    fetchArchitects();
}
function goPage(p) {
    if (p < 1 || p > archState.pages) return;
    archState.page = p;
    fetchArchitects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   HELPERS
   ============================================================ */
function renderStars(rating, large) {
    var sz = large ? '0.85rem' : '0.7rem';
    var html = '';
    for (var i = 1; i <= 5; i++) {
        if (rating >= i)           html += '<i class="fas fa-star star filled" style="font-size:' + sz + '"></i>';
        else if (rating >= i-0.5)  html += '<i class="fas fa-star-half-alt star half" style="font-size:' + sz + '"></i>';
        else                       html += '<i class="far fa-star star" style="font-size:' + sz + '"></i>';
    }
    return html;
}
function planBadgeHtml(plan) {
    var map   = { pro: 'plan-pro', enterprise: 'plan-enterprise', free: 'plan-free' };
    var cls   = map[plan] || 'plan-free';
    var label = (plan || 'free').charAt(0).toUpperCase() + (plan || 'free').slice(1);
    return '<span class="plan-badge ' + cls + '" style="vertical-align:middle;margin-left:0.4rem">' + label + '</span>';
}
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async function() {
    var token = requireClientAuth();
    if (!token) return;

    try {
        var resp = await fetch(CLIENT_API + '/client/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!resp.ok) {
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_user');
            window.location.href = 'client-index.html?modal=login';
            return;
        }
        var data = await resp.json();
        if (data.user) localStorage.setItem('client_user', JSON.stringify(data.user));
    } catch (e) {
        console.warn('Could not refresh user data:', e.message);
    }

    loadUser();

    // Hide loader
    var loader = document.getElementById('pageLoader');
    if (loader) {
        loader.style.opacity    = '0';
        loader.style.transition = 'opacity 0.4s';
        setTimeout(function() { loader.remove(); }, 400);
    }

    // Filter event listeners (safe even if elements not visible yet)
    document.getElementById('sortFilter').addEventListener('change', function() {
        archState.sort = this.value; archState.page = 1; fetchArchitects();
    });
    document.getElementById('specFilter').addEventListener('change', function() {
        archState.specialization = this.value; archState.page = 1; fetchArchitects();
    });
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(searchDebounce);
        var self = this;
        searchDebounce = setTimeout(function() {
            archState.search = self.value.trim(); archState.page = 1; fetchArchitects();
        }, 350);
    });

    // Keyboard shortcut
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModalDirect();
    });

    // ── Heartbeat presence ────────────────────────────────────────────────────
    if (typeof startHeartbeat === 'function') {
        startHeartbeat({
            apiBase:  CLIENT_API,
            getToken: function() { return localStorage.getItem('client_token'); }
        });
    }

    // ── Description char counter ──────────────────────────────────────────────
    var desc = document.getElementById('wf-desc');
    var cnt  = document.getElementById('wf-desc-count');
    if (desc && cnt) desc.addEventListener('input', function() { cnt.textContent = desc.value.length; });
});

/* ============================================================
   CONNECT FEATURE
   ============================================================ */

var connectState = { architectId: null, architectName: null, selectedProjectId: null };
var activeChatConnectionId = null;
var chatPollTimer = null;

/* ── Open Connect Modal ──────────────────────────────────────────────── */
async function openConnectModal(archId, archName, archSpec, archAvatar) {
    connectState.architectId   = archId;
    connectState.architectName = archName;
    connectState.selectedProjectId = null;

    // Fill header
    var fallback = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(archName) + '&background=8b5cf6&color=fff&bold=true';
    document.getElementById('connectArchAvatar').src = archAvatar || fallback;
    document.getElementById('connectArchAvatar').onerror = function() { this.src = fallback; };
    document.getElementById('connectArchName').textContent = archName;
    document.getElementById('connectArchSpec').textContent = archSpec || 'Architect';
    document.getElementById('connectIntroMsg').value = '';

    // Check existing status
    try {
        var r = await fetch(CLIENT_API + '/connections/status/' + archId, { headers: authHeaders() });
        var d = await r.json();
        if (d.status === 'accepted') {
            closeModalDirect();
            openChatModal(d.connectionId, archName, archAvatar || fallback);
            return;
        }
        if (d.status === 'pending') {
            closeModalDirect();
            showToast('You already have a pending request with ' + archName + '.', 'info');
            return;
        }
    } catch(e) {}

    // Load client's projects into project picker
    var listEl = document.getElementById('connectProjectList');
    listEl.innerHTML = '<div style="color:var(--slate);font-size:0.85rem"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    document.getElementById('connectBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
        var pr = await fetch(CLIENT_API + '/client/projects', { headers: authHeaders() });
        var pd = await pr.json();
        var projects = (pd.data || []).slice(0, 10);
        var createNewHtml = '<div style="margin-top:0.5rem">' +
            '<button onclick="closeConnectModal();openCreateProject()" ' +
            'style="width:100%;padding:0.5rem;border:1.5px dashed rgba(139,92,246,0.4);border-radius:9px;background:rgba(139,92,246,0.05);color:var(--violet);font-size:0.78rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.4rem">' +
            '<i class="fas fa-plus" style="font-size:0.7rem"></i> Create a new project brief</button></div>';
        if (!projects.length) {
            listEl.innerHTML = '<div style="color:var(--slate);font-size:0.83rem;padding:0.4rem 0">No projects yet — you can still connect without one.</div>' + createNewHtml;
        } else {
            listEl.innerHTML = projects.map(function(p) {
                return '<label class="project-pick-item">' +
                    '<input type="radio" name="connectProject" value="' + p._id + '" onchange="selectConnectProject(\'' + p._id + '\')">' +
                    '<span class="project-pick-label">' +
                        '<span class="project-pick-name">' + esc(p.title || p.name) + '</span>' +
                        '<span class="project-pick-type">' + esc(p.projectType || p.type || 'project') + '</span>' +
                    '</span>' +
                '</label>';
            }).join('') +
            '<label class="project-pick-item">' +
                '<input type="radio" name="connectProject" value="" checked onchange="selectConnectProject(null)">' +
                '<span class="project-pick-label"><span class="project-pick-name" style="color:var(--slate)">No specific project</span></span>' +
            '</label>' + createNewHtml;
        }
    } catch(e) {
        listEl.innerHTML = '<div style="color:var(--slate);font-size:0.83rem">Could not load projects.</div>';
    }
}

function selectConnectProject(id) {
    connectState.selectedProjectId = id || null;
}

function closeConnectModal(e) {
    if (e && e.target !== document.getElementById('connectBackdrop')) return;
    document.getElementById('connectBackdrop').classList.remove('open');
    document.body.style.overflow = '';
}

/* ── Submit Connect Request ──────────────────────────────────────────── */
async function submitConnectRequest() {
    var btn  = document.getElementById('connectSendBtn');
    var msg  = document.getElementById('connectIntroMsg').value.trim();

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        var r = await fetch(CLIENT_API + '/connections/request', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                architectId:  connectState.architectId,
                projectId:    connectState.selectedProjectId,
                introMessage: msg
            })
        });
        var d = await r.json();
        if (!d.success) throw new Error(d.message);

        document.getElementById('connectBackdrop').classList.remove('open');
        document.body.style.overflow = '';
        showToast('Connection request sent to ' + connectState.architectName + '!', 'success');

        // Update card button to "Pending"
        updateCardConnectBtn(connectState.architectId, 'pending');
        var modalBtn = document.getElementById('modalConnectBtn');
        if (modalBtn) { modalBtn.disabled = true; modalBtn.innerHTML = '<i class="fas fa-clock"></i> Request Pending'; }

    } catch(err) {
        showToast(err.message || 'Could not send request.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
    }
}

/* ── Refresh connect button state in card ────────────────────────────── */
async function refreshCardConnectBtn(archId) {
    try {
        var r = await fetch(CLIENT_API + '/connections/status/' + archId, { headers: authHeaders() });
        var d = await r.json();
        updateCardConnectBtn(archId, d.status || 'none', d.connectionId, d.connectionId ? { id: d.connectionId } : null);
    } catch(e) {}
}

async function refreshModalConnectBtn(archId) {
    var btn = document.getElementById('modalConnectBtn');
    if (!btn) return;
    try {
        var r = await fetch(CLIENT_API + '/connections/status/' + archId, { headers: authHeaders() });
        var d = await r.json();
        if (d.status === 'accepted') {
            btn.innerHTML = '<i class="fas fa-comments"></i> Open Chat';
            btn.onclick = function() { openChatModal(d.connectionId, btn.dataset.name || '', btn.dataset.avatar || ''); };
        } else if (d.status === 'pending') {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-clock"></i> Request Pending';
        }
    } catch(e) {}
}

function updateCardConnectBtn(archId, status, connectionId, archData) {
    var btn = document.getElementById('cbtn-' + archId);
    if (!btn) return;
    if (status === 'pending') {
        btn.className = 'connect-card-btn status-pending';
        btn.innerHTML = '<i class="fas fa-clock" style="font-size:0.7rem"></i> Pending';
        btn.onclick = function(e) { e.stopPropagation(); showToast('Request is awaiting architect response.', 'info'); };
    } else if (status === 'accepted') {
        btn.className = 'connect-card-btn status-accepted';
        btn.innerHTML = '<i class="fas fa-comments" style="font-size:0.7rem"></i> Chat';
        btn.onclick = function(e) {
            e.stopPropagation();
            var av = btn.closest('.arch-card') ? btn.closest('.arch-card').querySelector('.card-avatar') : null;
            openChatModal(connectionId, btn.dataset.archname || archId, av ? av.src : '');
        };
    }
}

/* ── Load My Connections View ────────────────────────────────────────── */
function showCustomConfirm(title, message, onConfirm) {
    var backdrop = document.getElementById('customConfirmBackdrop');
    document.getElementById('customConfirmTitle').textContent = title;
    document.getElementById('customConfirmMsg').textContent   = message;
    backdrop.style.display = 'flex';

    var okBtn     = document.getElementById('customConfirmOk');
    var cancelBtn = document.getElementById('customConfirmCancel');

    function cleanup() {
        backdrop.style.display = 'none';
        okBtn.replaceWith(okBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    }

    document.getElementById('customConfirmOk').addEventListener('click', function() {
        cleanup(); onConfirm();
    });
    document.getElementById('customConfirmCancel').addEventListener('click', cleanup);
    backdrop.addEventListener('click', function handler(e) {
        if (e.target === backdrop) { cleanup(); backdrop.removeEventListener('click', handler); }
    });
}

async function cancelConnectionRequest(connectionId, archName) {
    showCustomConfirm(
        'Cancel Request',
        'Cancel your pending request to ' + archName + '? You can send a new request later.',
        async function() {
            try {
                var r = await fetch(CLIENT_API + '/connections/' + connectionId, {
                    method:  'DELETE',
                    headers: authHeaders()
                });
                var d = await r.json();
                if (!d.success) throw new Error(d.message);
                showToast('Request to ' + archName + ' cancelled.', 'success');
                await loadConnections();
            } catch(err) {
                showToast(err.message || 'Could not cancel request.', 'error');
            }
        }
    );
}

/* ── Delete a rejected connection card ───────────────────────────────── */
async function deleteRejectedConnection(connectionId, archName) {
    showCustomConfirm(
        'Delete Connection',
        'Remove this rejected request from ' + archName + '? This will permanently delete the card.',
        async function() {
            try {
                var r = await fetch(CLIENT_API + '/connections/' + connectionId + '/rejected', {
                    method:  'DELETE',
                    headers: authHeaders()
                });
                var d = await r.json();
                if (!d.success) throw new Error(d.message);
                showToast('Connection with ' + archName + ' deleted.', 'success');
                await loadConnections();
            } catch(err) {
                showToast(err.message || 'Could not delete connection.', 'error');
            }
        }
    );
}

/* ── Re-request a rejected connection ────────────────────────────────── */
async function rerequestConnection(connectionId, archId, archName, archSpec, archAvatar) {
    showCustomConfirm(
        'Send New Request',
        'Send a fresh connection request to ' + archName + '? The previous rejected request will be removed first.',
        async function() {
            try {
                // Delete the old rejected connection first
                var delR = await fetch(CLIENT_API + '/connections/' + connectionId + '/rejected', {
                    method:  'DELETE',
                    headers: authHeaders()
                });
                var delD = await delR.json();
                if (!delD.success) throw new Error(delD.message);

                // Now open the connect modal to send a new request
                await loadConnections();
                openConnectModal(archId, archName, archSpec, archAvatar);
            } catch(err) {
                showToast(err.message || 'Could not initiate re-request.', 'error');
            }
        }
    );
}

async function loadConnections() {
    var body = document.getElementById('connectionsBody');
    body.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--slate)"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i><div style="margin-top:1rem">Loading...</div></div>';

    try {
        var r = await fetch(CLIENT_API + '/connections/my', { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) throw new Error();
        renderConnections(d.data);
    } catch(e) {
        body.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--rose)"><i class="fas fa-exclamation-circle" style="font-size:1.5rem"></i><div style="margin-top:1rem">Could not load connections.</div></div>';
    }
}

function renderConnections(conns) {
    var body = document.getElementById('connectionsBody');

    // Update nav badge
    var pending = conns.filter(function(c) { return c.status === 'pending'; }).length;
    var unread  = conns.filter(function(c) { return c.unreadByClient > 0; }).length;
    var badge   = document.getElementById('connNavBadge');
    if (pending + unread > 0) {
        badge.textContent = pending + unread;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }

    if (!conns.length) {
        body.innerHTML =
            '<div class="conn-empty">' +
                '<div class="conn-empty-icon"><i class="fas fa-user-friends"></i></div>' +
                '<div class="conn-empty-title">No connections yet</div>' +
                '<div class="conn-empty-sub">Browse architects and click Connect to send a request.</div>' +
                `<button class="btn-primary" onclick="showView('architects')" style="margin-top:1.5rem;padding:0.65rem 1.5rem;border-radius:9px;font-size:0.875rem;font-weight:700;border:none;cursor:pointer;">` +
                    '<i class="fas fa-search"></i> Find Architects' +
                '</button>' +
            '</div>';
        return;
    }

    body.innerHTML = '<div class="conn-grid">' + conns.map(function(c) {
        var arch = c.architect || {};
        var avatar = arch.avatar ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(arch.name || 'A') + '&background=8b5cf6&color=fff&bold=true';
        var archLastSeen = (arch && arch.lastSeen) ? arch.lastSeen : null;
        var isOnlineConn = (typeof isOnline === 'function') ? isOnline(archLastSeen) : false;
        var onlineDot    = isOnlineConn
            ? '<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.68rem;color:#10b981;margin-top:3px;"><span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 5px #10b981;display:inline-block;flex-shrink:0;"></span>Online</span>'
            : '<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.68rem;color:#64748b;margin-top:3px;"><span style="width:7px;height:7px;border-radius:50%;background:#475569;display:inline-block;flex-shrink:0;"></span>Offline</span>';
        var statusMap = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };
        var statusCls = { pending: 'status-pending', accepted: 'status-accepted', rejected: 'status-rejected' };
        var projHtml  = c.projectName ? '<div class="conn-project"><i class="fas fa-folder" style="font-size:0.65rem;color:var(--violet)"></i> ' + esc(c.projectName) + '</div>' : '';
        var intro     = c.introMessage ? '<div class="conn-intro">' + esc(c.introMessage) + '</div>' : '';
        var unreadBadge = (c.unreadByClient > 0) ? '<span class="conn-unread-badge">' + c.unreadByClient + ' new</span>' : '';

        var actionBtn = '';
        if (c.status === 'accepted') {
            actionBtn = '<button class="conn-chat-btn" onclick="openChatModal(\'' + c._id + '\',\'' + esc(arch.name) + '\',\'' + avatar + '\')">' +
                '<i class="fas fa-comments"></i> Chat ' + unreadBadge + '</button>';
        } else if (c.status === 'pending') {
            actionBtn = '<div class="conn-pending-note"><i class="fas fa-clock"></i> Awaiting response</div>' +
                '<button class="conn-cancel-btn" onclick="cancelConnectionRequest(\'' + c._id + '\',\'' + esc(arch.name) + '\')">' +
                '<i class="fas fa-times"></i> Cancel Request</button>';
        } else {
            actionBtn =
                '<div class="conn-rejected-note"><i class="fas fa-times-circle"></i> Request not accepted</div>' +
                '<div class="conn-rejected-actions">' +
                    '<button class="conn-rerequest-btn" onclick="rerequestConnection(\'' + c._id + '\',\'' + esc(arch.id || arch._id) + '\',\'' + esc(arch.name) + '\',\'' + esc(arch.specialization || '') + '\',\'' + avatar + '\')">' +
                        '<i class="fas fa-redo"></i> Re-request' +
                    '</button>' +
                    '<button class="conn-delete-btn" onclick="deleteRejectedConnection(\'' + c._id + '\',\'' + esc(arch.name) + '\')">' +
                        '<i class="fas fa-trash-alt"></i> Delete' +
                    '</button>' +
                '</div>';
        }

        return `
<div class="conn-card">
    <div class="conn-card-top">
        <img class="conn-arch-avatar"
             src="${avatar}"
             alt="${esc(arch.name)}"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(arch.name || 'A')}&background=8b5cf6&color=fff&bold=true'">

        <div class="conn-arch-info">
            <div class="conn-arch-name">${esc(arch.name)}</div>
            <div class="conn-arch-spec">${esc(arch.specialization || 'Architect')}</div>
            ${onlineDot}
            <span class="conn-status-chip ${statusCls[c.status] || ''}">
                ${statusMap[c.status] || c.status}
            </span>
        </div>
    </div>

    ${projHtml}
    ${intro}

    <div class="conn-card-footer">
        ${actionBtn}
    </div>
</div>
`;
    }).join('') + '</div>';
}

/* ── Chat Modal ──────────────────────────────────────────────────────── */
function openChatModal(connectionId, archName, archAvatar) {
    activeChatConnectionId = connectionId;
    clearClientChatImg();
    document.getElementById('chatModalName').textContent   = archName;
    document.getElementById('chatModalAvatar').src         = archAvatar ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(archName) + '&background=8b5cf6&color=fff&bold=true';
    document.getElementById('chatModalMessages').innerHTML =
        '<div style="text-align:center;padding:2rem;color:var(--slate)"><i class="fas fa-spinner fa-spin"></i></div>';
    document.getElementById('chatModalInput').value = '';

    document.getElementById('chatBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';

    loadChatMessages();

    // Poll for new messages every 8 seconds
    clearInterval(chatPollTimer);
    chatPollTimer = setInterval(loadChatMessages, 8000);
}

function closeChatModal(e) {
    if (e && e.target !== document.getElementById('chatBackdrop')) return;
    document.getElementById('chatBackdrop').classList.remove('open');
    document.body.style.overflow = '';
    clearInterval(chatPollTimer);
    chatPollTimer = null;
    activeChatConnectionId = null;
    clearClientChatImg();
    document.getElementById('chatModalInput').value = '';
}

async function loadChatMessages() {
    if (!activeChatConnectionId) return;
    try {
        var r = await fetch(CLIENT_API + '/connections/' + activeChatConnectionId + '/messages', { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) return;
        // Backend returns { success, data: { connection, messages } }
        var payload = d.data || {};
        renderChatMessages(payload.messages, payload.connection);
        _updateClientChatOnlineBadge(payload.connection);
    } catch(e) {}
}

function _updateClientChatOnlineBadge(connection) {
    var statusEl = document.getElementById('chatModalStatus');
    if (!statusEl) return;
    // connection.architect is populated with { name, avatar, lastSeen }
    var lastSeen = (connection && connection.architect && connection.architect.lastSeen)
        ? connection.architect.lastSeen
        : null;
    var online = (typeof isOnline === 'function') ? isOnline(lastSeen) : false;
    var dotColor = online ? '#10b981' : '#64748b';
    var glow     = online ? 'box-shadow:0 0 6px #10b981;' : '';
    var dot = '<span style="width:7px;height:7px;border-radius:50%;background:' + dotColor + ';' + glow + 'display:inline-block;flex-shrink:0;"></span>';
    statusEl.innerHTML = dot + (online
        ? ' <span style="color:#10b981">Connected · Online</span>'
        : ' <span style="color:#64748b">Connected · Offline</span>');
}

function renderChatMessages(messages, connection) {
    var clientId = (JSON.parse(localStorage.getItem('client_user') || '{}') || {}).id || '';
    var el = document.getElementById('chatModalMessages');

    if (!messages || !messages.length) {
        // Show intro message if exists
        var intro = connection && connection.introMessage;
        if (intro) {
            el.innerHTML = '<div class="chat-msg chat-msg-self"><div class="chat-msg-bubble">' + esc(intro) + '</div><div class="chat-msg-time">Request message</div></div>' +
                '<div class="chat-msg-divider">Waiting for architect to respond...</div>';
        } else {
            el.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--slate)">No messages yet. Say hello!</div>';
        }
        return;
    }

    var BASE = 'http://localhost:5000';
    var html = '';
    // Show intro message first if any
    if (connection && connection.introMessage) {
        html += '<div class="chat-msg chat-msg-self"><div class="chat-msg-bubble">' + esc(connection.introMessage) + '</div><div class="chat-msg-time">Request message</div></div>';
    }
    messages.forEach(function(m) {
        var isSelf = m.senderRole === 'client';
        var time   = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        var bubble;
        if (m.type === 'image' && m.imageUrl) {
            var src = BASE + m.imageUrl;
            bubble = '<img src="' + src + '" class="chat-bubble-img" onclick="openClientChatLightbox(\'' + src + '\')" onerror="this.style.display=\'none\'" alt="image">';
        } else {
            bubble = '<div class="chat-msg-bubble">' + esc(m.text) + '</div>';
        }

        html += '<div class="chat-msg ' + (isSelf ? 'chat-msg-self' : 'chat-msg-other') + '">' +
            bubble +
            '<div class="chat-msg-time">' + time + '</div>' +
        '</div>';
    });

    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
}

// ── Client chat image helpers ─────────────────────────────────────────────────
var _clientChatPendingImg = null;

function onClientChatImgSelected(e) {
    var file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    _clientChatPendingImg = file;
    var thumb   = document.getElementById('clientChatImgThumb');
    var preview = document.getElementById('clientChatImgPreview');
    if (thumb)   thumb.src = URL.createObjectURL(file);
    if (preview) preview.style.display = 'flex';
}

function clearClientChatImg() {
    _clientChatPendingImg = null;
    var input   = document.getElementById('clientChatImgInput');
    var preview = document.getElementById('clientChatImgPreview');
    if (input)   input.value = '';
    if (preview) preview.style.display = 'none';
}

function openClientChatLightbox(src) {
    var lb  = document.getElementById('clientChatImgLightbox');
    var img = document.getElementById('clientChatImgLightboxImg');
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add('open');
}

async function sendChatMessage() {
    if (!activeChatConnectionId) return;

    // ── Image send ────────────────────────────────────────────────────────────
    if (_clientChatPendingImg) {
        var file    = _clientChatPendingImg;
        var imgBtn  = document.getElementById('clientChatImgBtn');
        var sendBtn = document.querySelector('#chatModalPanel .chat-modal-send-btn');
        clearClientChatImg();
        if (imgBtn)  imgBtn.disabled  = true;
        if (sendBtn) sendBtn.disabled = true;

        try {
            var form  = new FormData();
            form.append('image', file);
            var token = localStorage.getItem('client_token');
            var r = await fetch(CLIENT_API + '/connections/' + activeChatConnectionId + '/messages/image', {
                method:  'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body:    form
            });
            var d = await r.json();
            if (!d.success) throw new Error(d.message);
            await loadChatMessages();
        } catch(err) {
            showToast(err.message || 'Could not send image.', 'error');
        } finally {
            if (imgBtn)  imgBtn.disabled  = false;
            if (sendBtn) sendBtn.disabled = false;
        }
        return;
    }

    // ── Text send ─────────────────────────────────────────────────────────────
    var input = document.getElementById('chatModalInput');
    var text  = input.value.trim();
    if (!text) return;

    input.value = '';
    input.disabled = true;

    try {
        var r = await fetch(CLIENT_API + '/connections/' + activeChatConnectionId + '/messages', {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({ text: text })
        });
        var d = await r.json();
        if (!d.success) throw new Error(d.message);
        await loadChatMessages();
    } catch(err) {
        showToast(err.message || 'Could not send message.', 'error');
        input.value = text;
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

/* ============================================================
   CLIENT PROJECT FEATURE
   ============================================================ */

var cpState = {
    step:         1,
    projectType:  '',
    attachFiles:  [],    // File objects staged for upload
    editingId:    null   // null = create, string = edit mode
};

/* ── Open / Close Wizard ──────────────────────────────────────────────────── */
function openCreateProject(prefillType) {
    cpState = { step: 1, projectType: prefillType || '', attachFiles: [], editingId: null };
    document.getElementById('wizardTitle').textContent    = 'New Project';
    document.getElementById('wizardNextBtn').textContent  = 'Next ';
    document.getElementById('wizardNextBtn').innerHTML    = 'Next <i class="fas fa-arrow-right"></i>';
    resetWizardFields();
    if (prefillType) selectTypeByVal(prefillType);
    goWizardStep(1);
    document.getElementById('wizardBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeWizard() {
    document.getElementById('wizardBackdrop').classList.remove('open');
    document.body.style.overflow = '';
    cpState.attachFiles = [];
}

function resetWizardFields() {
    ['wf-title','wf-budgetMin','wf-budgetMax','wf-landVal','wf-desc'].forEach(id => {
        var el = document.getElementById(id); if (el) el.value = '';
    });
    ['wf-landUnit','wf-style','wf-timeline'].forEach(id => {
        var el = document.getElementById(id); if (el) el.selectedIndex = 0;
    });
    ['wf-bedrooms','wf-bathrooms','wf-floors'].forEach(id => {
        var el = document.getElementById(id); if (el) el.value = '';
    });
    ['wf-garage','wf-pool','wf-garden'].forEach(id => {
        var el = document.getElementById(id); if (el) el.checked = false;
    });
    document.querySelectorAll('.type-btn').forEach(function(b) { b.classList.remove('active'); });
    cpState.projectType = '';
    document.getElementById('attachPreviewGrid').innerHTML = '';
    document.getElementById('wf-desc-count').textContent = '0';
}

/* ── Step navigation ──────────────────────────────────────────────────────── */
function goWizardStep(n) {
    [1,2,3,4].forEach(function(i) {
        var s = document.getElementById('wstep-' + i);
        if (s) s.style.display = (i === n) ? '' : 'none';
        var dot = document.getElementById('wdot-' + i);
        if (dot) {
            dot.classList.toggle('active',    i <= n);
            dot.classList.toggle('completed', i < n);
        }
        var line = document.getElementById('wline-' + i);
        if (line) line.classList.toggle('active', i < n);
    });
    var labels = ['Basic Info','Requirements','Attachments','Review & Submit'];
    document.getElementById('wizardStepLabel').textContent = 'Step ' + n + ' of 4 — ' + labels[n-1];
    document.getElementById('wizardBackBtn').style.display = n > 1 ? '' : 'none';
    var nextBtn = document.getElementById('wizardNextBtn');
    if (n === 4) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> Submit Project';
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    }
    cpState.step = n;
    if (n === 4) buildReviewCard();
}

function wizardNext() {
    var s = cpState.step;
    if (s === 1) {
        if (!document.getElementById('wf-title').value.trim()) {
            showToast('Please enter a project title.', 'error'); return;
        }
        if (!cpState.projectType) {
            showToast('Please select a project type.', 'error'); return;
        }
        goWizardStep(2);
    } else if (s === 2) {
        goWizardStep(3);
    } else if (s === 3) {
        goWizardStep(4);
    } else if (s === 4) {
        submitWizard();
    }
}

function wizardBack() {
    if (cpState.step > 1) goWizardStep(cpState.step - 1);
}

/* ── Step 1 helpers ───────────────────────────────────────────────────────── */
function selectType(btn) {
    document.querySelectorAll('.type-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    cpState.projectType = btn.dataset.val;
}
function selectTypeByVal(val) {
    var btn = document.querySelector('.type-btn[data-val="' + val + '"]');
    if (btn) selectType(btn);
}

/* ── Step 3 — Attachments ─────────────────────────────────────────────────── */
function handleAttachSelect(files) {
    Array.from(files).forEach(function(f) { addAttachFile(f); });
    document.getElementById('attachFileInput').value = '';
}
function handleAttachDrop(e) {
    e.preventDefault();
    document.getElementById('attachDropZone').classList.remove('drag-over');
    Array.from(e.dataTransfer.files).forEach(function(f) { addAttachFile(f); });
}
function addAttachFile(file) {
    if (cpState.attachFiles.length >= 10) {
        showToast('Maximum 10 files allowed.', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showToast(file.name + ' exceeds 10 MB limit.', 'error'); return;
    }
    cpState.attachFiles.push(file);
    renderAttachPreviews();
}
function removeAttachFile(idx) {
    cpState.attachFiles.splice(idx, 1);
    renderAttachPreviews();
}
function renderAttachPreviews() {
    var grid = document.getElementById('attachPreviewGrid');
    if (!cpState.attachFiles.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = cpState.attachFiles.map(function(f, i) {
        var isImg = f.type.startsWith('image/');
        var icon  = isImg ? '' : '<i class="fas fa-file-alt" style="font-size:1.5rem;color:var(--violet)"></i>';
        var thumb = '';
        if (isImg) {
            // Use object URL for preview
            thumb = '<img src="' + URL.createObjectURL(f) + '" style="width:100%;height:100%;object-fit:cover;border-radius:7px">';
        }
        var kb = (f.size / 1024).toFixed(0);
        return '<div class="attach-thumb">' +
            (isImg ? thumb : '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:0.35rem">' + icon + '<span style="font-size:0.65rem;color:var(--slate);text-align:center;word-break:break-all;padding:0 4px">' + esc(f.name) + '</span></div>') +
            '<div class="attach-thumb-info">' + esc(f.name.length > 12 ? f.name.slice(0,12)+'…' : f.name) + ' · ' + kb + 'KB</div>' +
            '<button class="attach-thumb-remove" onclick="removeAttachFile(' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    }).join('');
}

/* ── Step 4 — Review card ─────────────────────────────────────────────────── */
function buildReviewCard() {
    var title   = document.getElementById('wf-title').value.trim();
    var ptype   = cpState.projectType;
    var bMin    = document.getElementById('wf-budgetMin').value;
    var bMax    = document.getElementById('wf-budgetMax').value;
    var lVal    = document.getElementById('wf-landVal').value;
    var lUnit   = document.getElementById('wf-landUnit').value;
    var style   = document.getElementById('wf-style').value;
    var beds    = document.getElementById('wf-bedrooms').value;
    var baths   = document.getElementById('wf-bathrooms').value;
    var floors  = document.getElementById('wf-floors').value;
    var garage  = document.getElementById('wf-garage').checked;
    var pool    = document.getElementById('wf-pool').checked;
    var garden  = document.getElementById('wf-garden').checked;
    var timeline= document.getElementById('wf-timeline').value;
    var desc    = document.getElementById('wf-desc').value.trim();
    var files   = cpState.attachFiles.length;

    var budgetStr = (bMin || bMax)
        ? '₹' + (bMin ? Number(bMin).toLocaleString('en-IN') : '0') + ' – ₹' + (bMax ? Number(bMax).toLocaleString('en-IN') : '∞')
        : 'Not specified';
    var landStr = lVal ? lVal + ' ' + lUnit : 'Not specified';
    var extrasArr = [];
    if (garage) extrasArr.push('Garage');
    if (pool)   extrasArr.push('Pool');
    if (garden) extrasArr.push('Garden');

    document.getElementById('reviewCard').innerHTML =
        '<div class="review-row"><span class="review-lbl">Title</span><span class="review-val">' + esc(title) + '</span></div>' +
        '<div class="review-row"><span class="review-lbl">Type</span><span class="review-val" style="text-transform:capitalize">' + esc(ptype) + '</span></div>' +
        '<div class="review-row"><span class="review-lbl">Budget</span><span class="review-val">' + budgetStr + '</span></div>' +
        '<div class="review-row"><span class="review-lbl">Land Size</span><span class="review-val">' + landStr + '</span></div>' +
        (style ? '<div class="review-row"><span class="review-lbl">Style</span><span class="review-val" style="text-transform:capitalize">' + esc(style) + '</span></div>' : '') +
        ((beds||baths||floors) ? '<div class="review-row"><span class="review-lbl">Rooms</span><span class="review-val">' + [beds&&(beds+'BD'),baths&&(baths+'BA'),floors&&(floors+' fl')].filter(Boolean).join(' · ') + '</span></div>' : '') +
        (extrasArr.length ? '<div class="review-row"><span class="review-lbl">Extras</span><span class="review-val">' + extrasArr.join(', ') + '</span></div>' : '') +
        '<div class="review-row"><span class="review-lbl">Timeline</span><span class="review-val" style="text-transform:capitalize">' + esc(timeline.replace('-',' ')) + '</span></div>' +
        (desc ? '<div class="review-row review-desc"><span class="review-lbl">Description</span><div class="review-val" style="margin-top:4px">' + esc(desc) + '</div></div>' : '') +
        '<div class="review-row"><span class="review-lbl">Attachments</span><span class="review-val">' + files + ' file' + (files!==1?'s':'') + '</span></div>';
}

/* ── Submit ───────────────────────────────────────────────────────────────── */
async function submitWizard() {
    var btn = document.getElementById('wizardNextBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        var fd = new FormData();
        fd.append('title',       document.getElementById('wf-title').value.trim());
        fd.append('projectType', cpState.projectType);
        fd.append('style',       document.getElementById('wf-style').value);
        fd.append('timeline',    document.getElementById('wf-timeline').value);
        fd.append('description', document.getElementById('wf-desc').value.trim());
        fd.append('budget', JSON.stringify({
            min: parseFloat(document.getElementById('wf-budgetMin').value) || null,
            max: parseFloat(document.getElementById('wf-budgetMax').value) || null,
            currency: 'INR'
        }));
        fd.append('landSize', JSON.stringify({
            value: parseFloat(document.getElementById('wf-landVal').value) || null,
            unit:  document.getElementById('wf-landUnit').value
        }));
        fd.append('requirements', JSON.stringify({
            bedrooms:  parseInt(document.getElementById('wf-bedrooms').value)  || null,
            bathrooms: parseInt(document.getElementById('wf-bathrooms').value) || null,
            floors:    parseInt(document.getElementById('wf-floors').value)    || null,
            garage:    document.getElementById('wf-garage').checked,
            pool:      document.getElementById('wf-pool').checked,
            garden:    document.getElementById('wf-garden').checked
        }));
        cpState.attachFiles.forEach(function(f) { fd.append('attachments', f); });

        var token = getToken();
        var method = cpState.editingId ? 'PUT' : 'POST';
        var url    = CLIENT_API + '/client/projects' + (cpState.editingId ? '/' + cpState.editingId : '');
        var r = await fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + token }, body: fd });
        var d = await r.json();
        if (!d.success) throw new Error(d.message);

        closeWizard();
        showToast(cpState.editingId ? 'Project updated!' : 'Project created!', 'success');
        loadClientProjects();
    } catch(err) {
        showToast(err.message || 'Could not save project.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Submit Project';
    }
}

/* ── Load & render projects ───────────────────────────────────────────────── */
async function loadClientProjects() {
    var grid = document.getElementById('clientProjectsGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--slate)"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i><div style="margin-top:1rem">Loading...</div></div>';
    try {
        var r = await fetch(CLIENT_API + '/client/projects', { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) throw new Error();
        renderClientProjects(d.data);
    } catch(e) {
        grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--rose)"><i class="fas fa-exclamation-circle" style="font-size:1.5rem"></i><div style="margin-top:1rem">Could not load projects.</div></div>';
    }
}

var PROJECT_TYPE_ICONS = {
    residential:'fa-home', commercial:'fa-building', interior:'fa-couch',
    renovation:'fa-tools', landscape:'fa-tree', industrial:'fa-industry', other:'fa-project-diagram'
};
var STATUS_CONFIG = {
    active:      { label:'Active',      cls:'status-active' },
    draft:       { label:'Draft',       cls:'status-draft' },
    in_progress: { label:'In Progress', cls:'status-inprog' },
    completed:   { label:'Completed',   cls:'status-done' },
    cancelled:   { label:'Cancelled',   cls:'status-cancelled' }
};

function renderClientProjects(projects) {
    var grid = document.getElementById('clientProjectsGrid');
    if (!projects.length) {
        grid.innerHTML =
            '<div style="text-align:center;padding:4rem 2rem">' +
                '<div style="font-size:2.5rem;color:rgba(139,92,246,0.3);margin-bottom:1rem"><i class="fas fa-folder-open"></i></div>' +
                '<div style="font-size:1.15rem;font-weight:700;color:var(--white);margin-bottom:0.5rem">No projects yet</div>' +
                '<div style="font-size:0.875rem;color:var(--slate);margin-bottom:1.5rem">Create your first project brief and find the perfect architect.</div>' +
                '<button class="btn-primary" onclick="openCreateProject()" style="padding:0.7rem 1.5rem;border-radius:10px;font-weight:700;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:0.5rem"><i class="fas fa-plus"></i> Create Project</button>' +
            '</div>';
        return;
    }
    grid.innerHTML = '<div class="cp-grid">' + projects.map(function(p) {
        var iconCls = PROJECT_TYPE_ICONS[p.projectType] || 'fa-project-diagram';
        var sc      = STATUS_CONFIG[p.status] || { label: p.status, cls: 'status-draft' };
        var bStr = '';
        if (p.budget && (p.budget.min || p.budget.max)) {
            var fmt = function(n) { return n >= 100000 ? '₹' + (n/100000).toFixed(1) + 'L' : '₹' + n.toLocaleString('en-IN'); };
            bStr = (p.budget.min ? fmt(p.budget.min) : '') + (p.budget.min && p.budget.max ? ' – ' : '') + (p.budget.max ? fmt(p.budget.max) : '');
        }
        var lStr = (p.landSize && p.landSize.value) ? p.landSize.value + ' ' + p.landSize.value + ' ' + p.landSize.unit : '';
        if (p.landSize && p.landSize.value) lStr = p.landSize.value + ' ' + p.landSize.unit;
        var attCount = (p.attachments || []).length;
        var date = new Date(p.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
        return '<div class="cp-card">' +
            '<div class="cp-card-top">' +
                '<div class="cp-type-icon"><i class="fas ' + iconCls + '"></i></div>' +
                '<div class="cp-card-info">' +
                    '<div class="cp-title">' + esc(p.title) + '</div>' +
                    '<div class="cp-type-tag">' + esc(p.projectType) + '</div>' +
                '</div>' +
                '<span class="cp-status ' + sc.cls + '">' + sc.label + '</span>' +
            '</div>' +
            '<div class="cp-meta-row">' +
                (bStr ? '<div class="cp-meta-item"><i class="fas fa-rupee-sign"></i>' + esc(bStr) + '</div>' : '') +
                (lStr ? '<div class="cp-meta-item"><i class="fas fa-expand-arrows-alt"></i>' + esc(lStr) + '</div>' : '') +
                (p.style ? '<div class="cp-meta-item"><i class="fas fa-paint-brush"></i>' + esc(p.style) + '</div>' : '') +
                (attCount ? '<div class="cp-meta-item"><i class="fas fa-paperclip"></i>' + attCount + ' file' + (attCount>1?'s':'') + '</div>' : '') +
            '</div>' +
            (p.description ? '<div class="cp-desc">' + esc(p.description) + '</div>' : '') +
            '<div class="cp-date">Created ' + date + '</div>' +
            '<div class="cp-actions">' +
                '<button class="cp-btn cp-btn-view"    onclick="viewClientProject(\'' + p._id + '\')"><i class="fas fa-eye"></i> View</button>' +
                '<button class="cp-btn cp-btn-edit"    onclick="editClientProject(\'' + p._id + '\')"><i class="fas fa-edit"></i> Edit</button>' +
                '<button class="cp-btn cp-btn-connect" onclick="connectFromProject(\'' + p._id + '\',\'' + esc(p.title) + '\')"><i class="fas fa-user-plus"></i> Find Architect</button>' +
                '<button class="cp-btn cp-btn-delete"  onclick="deleteClientProject(\'' + p._id + '\')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    }).join('') + '</div>';
}

/* ── Project actions ─────────────────────────────────────────────────────── */
async function viewClientProject(id) {
    document.getElementById('pdBody').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--slate)"><i class="fas fa-spinner fa-spin"></i></div>';
    document.getElementById('projDetailBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    try {
        var r = await fetch(CLIENT_API + '/client/projects/' + id, { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) throw new Error();
        renderProjectDetail(d.data);
    } catch(e) {
        document.getElementById('pdBody').innerHTML = '<div style="padding:2rem;color:var(--rose)">Could not load project.</div>';
    }
}

function renderProjectDetail(p) {
    var sc = STATUS_CONFIG[p.status] || { label: p.status, cls: 'status-draft' };
    document.getElementById('pdTitle').textContent = p.title;
    document.getElementById('pdMeta').innerHTML =
        '<span style="text-transform:capitalize">' + esc(p.projectType) + '</span>' +
        ' · <span class="cp-status ' + sc.cls + '" style="font-size:0.68rem">' + sc.label + '</span>';

    var r   = p.requirements || {};
    var bStr = '';
    if (p.budget && (p.budget.min || p.budget.max)) {
        var fmt = function(n) { return '₹' + Number(n).toLocaleString('en-IN'); };
        bStr = (p.budget.min ? fmt(p.budget.min) : '0') + ' – ' + (p.budget.max ? fmt(p.budget.max) : '∞');
    }
    var lStr = (p.landSize && p.landSize.value) ? p.landSize.value + ' ' + p.landSize.unit : '';

    var rows = [
        ['Budget',      bStr || '—'],
        ['Land Size',   lStr || '—'],
        ['Style',       p.style || '—'],
        ['Timeline',    (p.timeline || 'flexible').replace('-',' ')],
        ['Bedrooms',    r.bedrooms  || '—'],
        ['Bathrooms',   r.bathrooms || '—'],
        ['Floors',      r.floors    || '—'],
        ['Extras',      [r.garage&&'Garage', r.pool&&'Pool', r.garden&&'Garden'].filter(Boolean).join(', ') || 'None'],
    ];
    var detailHtml = '<div class="pd-grid">' +
        rows.map(function(row) {
            return '<div class="review-row"><span class="review-lbl">' + row[0] + '</span><span class="review-val" style="text-transform:capitalize">' + esc(String(row[1])) + '</span></div>';
        }).join('') + '</div>';

    if (p.description) {
        detailHtml += '<div style="margin:1rem 0"><div style="font-size:0.78rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem">Description</div><div style="font-size:0.875rem;color:var(--white);line-height:1.6">' + esc(p.description) + '</div></div>';
    }

    // Attachments
    if (p.attachments && p.attachments.length) {
        detailHtml += '<div style="margin-top:1rem"><div style="font-size:0.78rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem">Attachments</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0.5rem">' +
            p.attachments.map(function(a) {
                var isImg = a.mimetype && a.mimetype.startsWith('image/');
                var href  = 'http://localhost:5000' + a.url;
                if (isImg) {
                    return '<a href="' + href + '" target="_blank" style="display:block;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">' +
                        '<img src="' + href + '" style="width:100%;height:100%;object-fit:cover" loading="lazy">' + '</a>';
                }
                return '<a href="' + href + '" target="_blank" class="cp-btn cp-btn-view" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.35rem;font-size:0.75rem">' +
                    '<i class="fas fa-file-alt"></i>' + esc(a.originalName) + '</a>';
            }).join('') + '</div></div>';
    }

    detailHtml += '<div style="display:flex;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap">' +
        '<button class="connect-send-btn" style="flex:1;min-width:140px;justify-content:center" onclick="closeProjDetail();connectFromProject(\'' + p._id + '\',\'' + esc(p.title) + '\')">' +
            '<i class="fas fa-user-plus"></i> Find Architect</button>' +
        '<button class="connect-cancel-btn" onclick="closeProjDetail();editClientProject(\'' + p._id + '\')">' +
            '<i class="fas fa-edit"></i> Edit</button>' +
    '</div>';

    document.getElementById('pdBody').innerHTML = detailHtml;
}

function closeProjDetail(e) {
    if (e && e.target !== document.getElementById('projDetailBackdrop')) return;
    document.getElementById('projDetailBackdrop').classList.remove('open');
    document.body.style.overflow = '';
}

async function editClientProject(id) {
    try {
        var r = await fetch(CLIENT_API + '/client/projects/' + id, { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) throw new Error();
        var p = d.data;
        cpState = { step: 1, projectType: p.projectType, attachFiles: [], editingId: id };
        resetWizardFields();
        document.getElementById('wf-title').value       = p.title || '';
        document.getElementById('wf-style').value       = p.style || '';
        document.getElementById('wf-timeline').value    = p.timeline || 'flexible';
        document.getElementById('wf-desc').value        = p.description || '';
        document.getElementById('wf-desc-count').textContent = (p.description||'').length;
        if (p.budget) {
            if (p.budget.min) document.getElementById('wf-budgetMin').value = p.budget.min;
            if (p.budget.max) document.getElementById('wf-budgetMax').value = p.budget.max;
        }
        if (p.landSize) {
            if (p.landSize.value) document.getElementById('wf-landVal').value  = p.landSize.value;
            if (p.landSize.unit)  document.getElementById('wf-landUnit').value = p.landSize.unit;
        }
        var req = p.requirements || {};
        if (req.bedrooms)  document.getElementById('wf-bedrooms').value  = req.bedrooms;
        if (req.bathrooms) document.getElementById('wf-bathrooms').value = req.bathrooms;
        if (req.floors)    document.getElementById('wf-floors').value    = req.floors;
        if (req.garage)    document.getElementById('wf-garage').checked  = true;
        if (req.pool)      document.getElementById('wf-pool').checked    = true;
        if (req.garden)    document.getElementById('wf-garden').checked  = true;
        selectTypeByVal(p.projectType);
        document.getElementById('wizardTitle').textContent   = 'Edit Project';
        document.getElementById('wizardNextBtn').innerHTML   = 'Next <i class="fas fa-arrow-right"></i>';
        goWizardStep(1);
        document.getElementById('wizardBackdrop').classList.add('open');
        document.body.style.overflow = 'hidden';
    } catch(e) {
        showToast('Could not load project for editing.', 'error');
    }
}

async function deleteClientProject(id) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
        var r = await fetch(CLIENT_API + '/client/projects/' + id, {
            method: 'DELETE', headers: authHeaders()
        });
        var d = await r.json();
        if (!d.success) throw new Error(d.message);
        showToast('Project deleted.', 'success');
        loadClientProjects();
    } catch(e) {
        showToast(e.message || 'Delete failed.', 'error');
    }
}

/* ── Connect from project card ────────────────────────────────────────────── */
function connectFromProject(projectId, projectTitle) {
    // Pre-select this project in the connect modal and switch to architects view
    cpState._pendingConnectProjectId    = projectId;
    cpState._pendingConnectProjectTitle = projectTitle;
    showView('architects');
    showToast('Now pick an architect to connect — your project is pre-selected.', 'info');
}

/* ── Patch openConnectModal to honour pre-selected project ───────────────── */
var _origOpenConnectModal = openConnectModal;
openConnectModal = async function(archId, archName, archSpec, archAvatar) {
    // If a project was pre-selected from the projects view, auto-select it
    if (cpState._pendingConnectProjectId) {
        connectState.architectId            = archId;
        connectState.architectName          = archName;
        connectState.selectedProjectId      = cpState._pendingConnectProjectId;
        var pendingTitle                    = cpState._pendingConnectProjectTitle;
        cpState._pendingConnectProjectId    = null;
        cpState._pendingConnectProjectTitle = null;
        // Call original but patch project list after it opens
        await _origOpenConnectModal(archId, archName, archSpec, archAvatar);
        // Pre-tick the matching radio button
        var radios = document.querySelectorAll('input[name="connectProject"]');
        radios.forEach(function(radio) {
            if (radio.value === connectState.selectedProjectId) {
                radio.checked = true;
                selectConnectProject(radio.value);
            }
        });
    } else {
        await _origOpenConnectModal(archId, archName, archSpec, archAvatar);
    }
};

/* ============================================================
   CLIENT SETTINGS
   ============================================================ */

// ── Panel / Tab switchers ─────────────────────────────────────────────────────
function switchClientSettingsPanel(name, btn) {
    document.querySelectorAll('#view-settings .settings-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#view-settings .settings-panel').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    var panel = document.getElementById('cs-panel-' + name);
    if (panel) panel.classList.add('active');
}

function switchClientProfileTab(name, btn) {
    document.querySelectorAll('#cs-panel-profile .profile-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#cs-panel-profile .profile-content').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    var tab = document.getElementById('cs-tab-' + name);
    if (tab) tab.classList.add('active');
}

// ── Load settings (called every time view is opened) ──────────────────────────
var _csUserCache = null;

async function loadClientSettings() {
    var token = requireClientAuth();
    if (!token) return;
    try {
        var resp = await fetch(CLIENT_API + '/client/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = await resp.json();
        if (!data.user) return;
        _csUserCache = data.user;
        localStorage.setItem('client_user', JSON.stringify(data.user));
        _csPopulateOverview(data.user);
        _csPopulateEditForm(data.user);
        _csPopulatePreferences(data.user);
    } catch (e) {
        console.error('loadClientSettings error', e);
        // Fall back to cached user
        var cached = localStorage.getItem('client_user');
        if (cached) {
            var u = JSON.parse(cached);
            _csUserCache = u;
            _csPopulateOverview(u);
            _csPopulateEditForm(u);
            _csPopulatePreferences(u);
        }
    }
}

function _csPopulateOverview(u) {
    var avatarUrl = u.avatar ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'C') + '&background=8b5cf6&color=fff&bold=true';

    var el = function(id) { return document.getElementById(id); };
    var img = el('cs-overviewAvatar');
    if (img) img.src = avatarUrl;
    if (el('cs-overviewName'))    el('cs-overviewName').textContent    = u.name    || '—';
    if (el('cs-overviewEmail'))   el('cs-overviewEmail').textContent   = u.email   || '—';
    if (el('cs-overviewPhone'))   el('cs-overviewPhone').textContent   = u.phone   || '—';
    if (el('cs-overviewCompany')) el('cs-overviewCompany').textContent = u.company || '—';
    if (el('cs-overviewLocation'))el('cs-overviewLocation').textContent= u.location|| '—';
    if (el('cs-overviewBio'))     el('cs-overviewBio').textContent     = u.bio     || '—';
    if (el('cs-overviewSince')) {
        var d = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
        el('cs-overviewSince').textContent = d;
    }
}

function _csPopulateEditForm(u) {
    var el = function(id) { return document.getElementById(id); };
    var avatarUrl = u.avatar ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'C') + '&background=8b5cf6&color=fff&bold=true';
    var img = el('cs-editAvatar');
    if (img) img.src = avatarUrl;
    if (el('cs-editName'))     el('cs-editName').value     = u.name     || '';
    if (el('cs-editEmail'))    el('cs-editEmail').value    = u.email    || '';
    if (el('cs-editCompany'))  el('cs-editCompany').value  = u.company  || '';
    if (el('cs-editPhone'))    el('cs-editPhone').value    = u.phone    || '';
    if (el('cs-editLocation')) el('cs-editLocation').value = u.location || '';
    if (el('cs-editBio'))      el('cs-editBio').value      = u.bio      || '';
}

function _csPopulatePreferences(u) {
    var prefs = u.preferences || {};
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('cs_prefs') || '{}'); } catch(e) {}
    var merged = Object.assign({}, prefs, stored);

    var emailNotif = document.getElementById('cs-emailNotif');
    var connAlerts = document.getElementById('cs-connAlerts');
    var currency   = document.getElementById('cs-currency');
    if (emailNotif) emailNotif.checked = merged.emailNotif !== false;
    if (connAlerts) connAlerts.checked = merged.connAlerts !== false;
    if (currency && merged.currency)   currency.value = merged.currency;
}

// ── Save profile ──────────────────────────────────────────────────────────────
async function saveClientProfile(event) {
    if (event) event.preventDefault();
    var token = requireClientAuth();
    if (!token) return;

    var btn = document.getElementById('csEpSaveBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

    var el = function(id) { return document.getElementById(id); };

    var body = {
        name:     (el('cs-editName')     ? el('cs-editName').value.trim()     : ''),
        company:  (el('cs-editCompany')  ? el('cs-editCompany').value.trim()  : ''),
        phone:    (el('cs-editPhone')    ? el('cs-editPhone').value.trim()    : ''),
        location: (el('cs-editLocation') ? el('cs-editLocation').value.trim() : ''),
        bio:      (el('cs-editBio')      ? el('cs-editBio').value.trim()      : '')
    };

    // Include avatar if it was changed (stored as base64 on the img src)
    var avatarImg = el('cs-editAvatar');
    if (avatarImg && avatarImg.src && avatarImg.src.startsWith('data:')) {
        body.avatar = avatarImg.src;
    } else if (avatarImg && avatarImg.dataset.removed === 'true') {
        body.avatar = '';
    }

    try {
        var resp = await fetch(CLIENT_API + '/client/profile', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body:    JSON.stringify(body)
        });
        var data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'Update failed');

        // Persist updated user
        var updated = data.user || Object.assign(_csUserCache || {}, body);
        localStorage.setItem('client_user', JSON.stringify(updated));
        _csUserCache = updated;

        // Refresh overview + sidebar
        _csPopulateOverview(updated);
        loadUser();

        showToast('Profile updated successfully!', 'success');
        // Switch back to overview tab
        var overviewBtn = document.querySelector('#cs-panel-profile .profile-tab');
        switchClientProfileTab('overview', overviewBtn);

    } catch (e) {
        showToast(e.message || 'Could not save profile.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Save Changes'; }
    }
}

function discardClientProfileChanges() {
    if (_csUserCache) {
        _csPopulateEditForm(_csUserCache);
    }
    var overviewBtn = document.querySelector('#cs-panel-profile .profile-tab');
    switchClientProfileTab('overview', overviewBtn);
    showToast('Changes discarded.', 'info');
}

// ── Avatar upload / remove ────────────────────────────────────────────────────
function handleClientAvatarUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5 MB.', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = document.getElementById('cs-editAvatar');
        if (img) {
            img.src = e.target.result;
            img.dataset.removed = 'false';
        }
        // Also update overview avatar live
        var ov = document.getElementById('cs-overviewAvatar');
        if (ov) ov.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeClientAvatar() {
    var fallback = 'https://ui-avatars.com/api/?name=' +
        encodeURIComponent((_csUserCache && _csUserCache.name) || 'C') +
        '&background=8b5cf6&color=fff&bold=true';
    var img = document.getElementById('cs-editAvatar');
    if (img) { img.src = fallback; img.dataset.removed = 'true'; }
    var ov = document.getElementById('cs-overviewAvatar');
    if (ov) ov.src = fallback;
}

// ── Change password ───────────────────────────────────────────────────────────
async function updateClientPassword(event) {
    if (event) event.preventDefault();
    var token = requireClientAuth();
    if (!token) return;

    var cur  = document.getElementById('cs-currentPw');
    var nw   = document.getElementById('cs-newPw');
    var conf = document.getElementById('cs-confirmPw');

    if (!cur || !nw || !conf) return;
    if (nw.value.length < 8) { showToast('New password must be at least 8 characters.', 'error'); return; }
    if (nw.value !== conf.value) { showToast('Passwords do not match.', 'error'); return; }

    try {
        var resp = await fetch(CLIENT_API + '/auth/password', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body:    JSON.stringify({ currentPassword: cur.value, newPassword: nw.value })
        });
        var data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'Password update failed');

        cur.value = ''; nw.value = ''; conf.value = '';
        showToast('Password updated successfully!', 'success');
    } catch (e) {
        showToast(e.message || 'Could not update password.', 'error');
    }
}

// ── Password eye toggle ───────────────────────────────────────────────────────
function csTogglePw(inputId, icon) {
    var inp = document.getElementById(inputId);
    if (!inp) return;
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    icon.classList.toggle('fa-eye',      !show);
    icon.classList.toggle('fa-eye-slash', show);
}

// ── Preferences (persisted to localStorage) ───────────────────────────────────
function saveClientPreference(key, value) {
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('cs_prefs') || '{}'); } catch(e) {}
    stored[key] = value;
    localStorage.setItem('cs_prefs', JSON.stringify(stored));
    showToast('Preference saved.', 'success');
}

// ── Delete account ────────────────────────────────────────────────────────────
async function deleteClientAccount() {
    var confirmed = window.confirm(
        'This will permanently delete your account, all your projects, and connections.\n\nThis cannot be undone. Are you sure?'
    );
    if (!confirmed) return;

    var token = requireClientAuth();
    if (!token) return;

    try {
        var resp = await fetch(CLIENT_API + '/client/account', {
            method:  'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = await resp.json();
        if (!resp.ok && resp.status !== 404) throw new Error(data.message || 'Could not delete account.');
        localStorage.removeItem('client_token');
        localStorage.removeItem('client_user');
        localStorage.removeItem('cs_prefs');
        showToast('Account deleted. Redirecting…', 'info');
        setTimeout(function() { window.location.href = 'client-index.html'; }, 1800);
    } catch (e) {
        showToast(e.message || 'Could not delete account.', 'error');
    }
}

/* ============================================================
   NOTIFICATION BELL MODULE
   ============================================================ */
(function() {
'use strict';

/* ── Storage keys ─────────────────────────────────── */
var STORAGE_KEY   = 'smartarch_client_notifications';
var DISMISSED_KEY = 'smartarch_client_notif_dismissed';

/* ── In-memory store (also synced to localStorage) ── */
var _notifications = [];   // [{id, type, text, time, read}]
var _dismissed     = {};   // {id: true} — survives clear, prevents re-add
var _dropdownOpen  = false;

/* ── Load persisted notifications ───────────────────── */
function _load() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        _notifications = raw ? JSON.parse(raw) : [];
    } catch(e) { _notifications = []; }
    try {
        var dis = localStorage.getItem(DISMISSED_KEY);
        _dismissed = dis ? JSON.parse(dis) : {};
    } catch(e) { _dismissed = {}; }
}

function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_notifications.slice(0, 50))); } catch(e) {}
}

function _saveDismissed() {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(_dismissed)); } catch(e) {}
}

/* ── Add a notification (dedup by id + dismissed check) ── */
function _add(id, type, text, time) {
    if (_dismissed[id]) return false;
    if (_notifications.some(function(n) { return n.id === id; })) return false;
    _notifications.unshift({ id: id, type: type, text: text, time: time || new Date().toISOString(), read: false });
    _save();
    return true;
}

/* ── Render the dropdown ─────────────────────────────── */
function _render() {
    var list  = document.getElementById('notifList');
    var badge = document.getElementById('notifBadge');
    var clearBtn = document.getElementById('notifClearBtn');
    if (!list) return;

    var unread = _notifications.filter(function(n) { return !n.read; }).length;

    /* Badge */
    if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : String(unread);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    /* Clear btn visibility */
    if (clearBtn) clearBtn.style.display = _notifications.length ? '' : 'none';

    /* List */
    if (!_notifications.length) {
        list.innerHTML = '<div class="notif-empty"><i class="fas fa-check-circle" style="color:var(--violet);font-size:1.3rem;margin-bottom:0.5rem;display:block"></i>You\'re all caught up!</div>';
        return;
    }

    var iconMap = { accepted: 'fa-user-check', message: 'fa-comment-alt', rejected: 'fa-times-circle', pending: 'fa-clock' };

    list.innerHTML = _notifications.map(function(n) {
        var iconCls = iconMap[n.type] || 'fa-bell';
        var timeStr = _relTime(n.time);
        return '<div class="notif-item' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '" onclick="notifItemClick()" style="cursor:pointer">' +
            '<div class="notif-icon ' + (n.type || 'message') + '"><i class="fas ' + iconCls + '"></i></div>' +
            '<div class="notif-text">' +
                '<div class="notif-text-main">' + _esc(n.text) + '</div>' +
                '<div class="notif-text-time">' + timeStr + '</div>' +
            '</div>' +
            (!n.read ? '<div class="notif-unread-dot"></div>' : '') +
        '</div>';
    }).join('');
}

/* ── Relative time helper ────────────────────────────── */
function _relTime(iso) {
    try {
        var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (diff < 60)   return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    } catch(e) { return ''; }
}

function _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Mark all as read ────────────────────────────────── */
function _markAllRead() {
    _notifications.forEach(function(n) { n.read = true; });
    _save();
    _render();
}

/* ── Toggle dropdown ─────────────────────────────────── */
window.toggleNotifDropdown = function(e) {
    e.stopPropagation();
    var panel = document.getElementById('notifDropdown');
    if (!panel) return;
    _dropdownOpen = !_dropdownOpen;
    panel.style.display = _dropdownOpen ? 'block' : 'none';
    if (_dropdownOpen) {
        _markAllRead();
        _render();
    }
};

/* ── Clear all ───────────────────────────────────────── */
window.clearAllNotifications = function() {
    /* Mark every current notification id as dismissed so polling never re-adds them */
    _notifications.forEach(function(n) { _dismissed[n.id] = true; });
    _saveDismissed();
    _notifications = [];
    _save();
    _render();
};

/* ── Navigate to connections on item click ───────────── */
window.notifItemClick = function() {
    document.getElementById('notifDropdown').style.display = 'none';
    _dropdownOpen = false;
    if (typeof showView === 'function') showView('connections');
};

/* ── Outside-click to close ──────────────────────────── */
document.addEventListener('click', function(e) {
    if (!_dropdownOpen) return;
    var wrap = document.getElementById('notifWrap');
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById('notifDropdown').style.display = 'none';
        _dropdownOpen = false;
    }
});

/* ── Escape key ──────────────────────────────────────── */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && _dropdownOpen) {
        document.getElementById('notifDropdown').style.display = 'none';
        _dropdownOpen = false;
    }
});

/* ════════════════════════════════════════════════════
   POLL CONNECTIONS & BUILD NOTIFICATIONS
   ════════════════════════════════════════════════════ */
var _lastKnownConnections = null;  // Map<id, {status, unreadByClient}>

async function _pollConnections() {
    var token = localStorage.getItem('client_token');
    if (!token) return;
    try {
        var r = await fetch((window.CLIENT_API || 'http://localhost:5000/api') + '/connections/my', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!r.ok) return;
        var d = await r.json();
        if (!d.success) return;
        _processConnections(d.data || []);
    } catch(e) {}
}

function _processConnections(conns) {
    var changed = false;
    conns.forEach(function(c) {
        var arch     = c.architect || {};
        var archName = arch.name || 'An architect';
        var cid      = c._id;

        var prev = _lastKnownConnections ? _lastKnownConnections[cid] : null;

        /* Request accepted */
        if (c.status === 'accepted' && (!prev || prev.status !== 'accepted')) {
            if (_add('accepted-' + cid, 'accepted',
                archName + ' accepted your connection request!', c.updatedAt)) changed = true;
        }

        /* Request rejected */
        if (c.status === 'rejected' && (!prev || prev.status !== 'rejected')) {
            if (_add('rejected-' + cid, 'rejected',
                archName + ' declined your connection request.', c.updatedAt)) changed = true;
        }

        /* New unread messages from architect */
        if (c.unreadByClient > 0) {
            var prevUnread = prev ? (prev.unreadByClient || 0) : 0;
            if (c.unreadByClient > prevUnread) {
                var msgId = 'msg-' + cid + '-' + c.unreadByClient;
                var count = c.unreadByClient - prevUnread;
                var txt   = count === 1
                    ? archName + ' sent you a message.'
                    : archName + ' sent you ' + count + ' new messages.';
                if (_add(msgId, 'message', txt, new Date().toISOString())) changed = true;
            }
        }
    });

    /* Build fresh snapshot */
    var snap = {};
    conns.forEach(function(c) { snap[c._id] = { status: c.status, unreadByClient: c.unreadByClient || 0 }; });
    _lastKnownConnections = snap;

    if (changed) _render();
}

/* ── Boot ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    _load();
    _render();

    /* Start polling after a short delay so auth is ready */
    setTimeout(function() {
        _pollConnections();
        setInterval(_pollConnections, 20000);   // every 20 s
    }, 2000);
});

})();

/* ============================================================
   SHARED WITH ME — projects sent by architects to this client
   ============================================================ */

async function loadSharedProjects() {
    var grid = document.getElementById('sharedProjectsGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--slate)"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i><div style="margin-top:1rem">Loading shared projects…</div></div>';

    try {
        var r = await fetch(CLIENT_API + '/shares/my', { headers: authHeaders() });
        var d = await r.json();
        if (!d.success) throw new Error();
        renderSharedProjects(d.data);
    } catch(e) {
        grid.innerHTML = '<div class="shared-empty"><div class="shared-empty-icon"><i class="fas fa-exclamation-circle"></i></div><div>Could not load shared projects.</div></div>';
    }
}

function renderSharedProjects(shares) {
    var grid  = document.getElementById('sharedProjectsGrid');
    var badge = document.getElementById('sharedNavBadge');

    // Badge: count unviewed shares
    var unviewed = shares.filter(function(s){ return !s.viewedAt; }).length;
    if (unviewed > 0) {
        badge.textContent = unviewed;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }

    if (!shares.length) {
        grid.innerHTML =
            '<div class="shared-empty">' +
                '<div class="shared-empty-icon"><i class="fas fa-share-alt"></i></div>' +
                '<div style="font-size:1rem;font-weight:600;color:#f1f5f9;margin-bottom:0.5rem;">No shared projects yet</div>' +
                '<div style="font-size:0.85rem;color:#64748b;">When an architect shares a completed project with you, it will appear here.</div>' +
            '</div>';
        return;
    }

    var viewModes = [
        { icon: 'fa-th-large',      label: '2D Plan'    },
        { icon: 'fa-cube',          label: '3D View'    },
        { icon: 'fa-vector-square', label: 'Wireframe'  },
        { icon: 'fa-walking',       label: 'Walkthrough'},
        { icon: 'fa-home',          label: 'Dollhouse'  }
    ];

    grid.innerHTML = '<div class="shared-grid">' + shares.map(function(share) {
        var proj  = share.project || {};
        var arch  = share.sharedBy || {};
        var isNew = !share.viewedAt;

        var archAvatar = arch.avatar ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(arch.name || 'A') + '&background:7c3aed&color=fff&bold=true&size=40';

        var metaHtml =
            '<div class="shared-meta-chip"><i class="fas fa-ruler-combined"></i>' + (proj.metadata && proj.metadata.totalArea ? proj.metadata.totalArea.toLocaleString() + ' m²' : '—') + '</div>' +
            '<div class="shared-meta-chip"><i class="fas fa-layer-group"></i>' + ((proj.floors && proj.floors.length) || 0) + ' floors</div>' +
            '<div class="shared-meta-chip"><i class="fas fa-door-open"></i>' + (proj.metadata && proj.metadata.totalRooms || 0) + ' rooms</div>';

        var viewModesHtml = '<div class="view-mode-grid">' +
            viewModes.map(function(m){
                return '<div class="view-mode-chip"><i class="fas ' + m.icon + '" style="font-size:0.6rem"></i>' + m.label + '</div>';
            }).join('') + '</div>';

        var msgHtml = share.message
            ? '<div class="shared-card-msg">' + esc(share.message) + '</div>'
            : '';

        var newBadge = isNew ? '<span class="shared-new-badge">New</span>' : '';

        var sharedDate = share.createdAt
            ? new Date(share.createdAt).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })
            : '';

        return '<div class="shared-card" onclick="openSharedProject(\'' + share.shareToken + '\')">' +
            '<div class="shared-card-top"></div>' +
            '<div class="shared-card-body">' +
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;">' +
                    '<div class="shared-card-title">' + esc(proj.name || 'Untitled Project') + '</div>' +
                    newBadge +
                '</div>' +
                '<div class="shared-card-arch">' +
                    '<img src="' + archAvatar + '" alt="' + esc(arch.name || '') + '" style="width:20px;height:20px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.src=\'https://ui-avatars.com/api/?name=A&background=7c3aed&color=fff&bold=true\'">' +
                    esc(arch.name || 'Architect') +
                    (arch.specialization ? ' · ' + esc(arch.specialization) : '') +
                    (sharedDate ? '<span style="margin-left:auto;color:#475569;font-size:0.7rem;">' + sharedDate + '</span>' : '') +
                '</div>' +
                '<div class="shared-card-meta">' + metaHtml + '</div>' +
                viewModesHtml +
                msgHtml +
                '<div class="shared-card-footer">' +
                    '<button class="shared-view-btn" onclick="event.stopPropagation();openSharedProject(\'' + share.shareToken + '\')">' +
                        '<i class="fas fa-eye"></i> Open Project Viewer' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('') + '</div>';
}

function openSharedProject(token) {
    window.open('project-viewer.html?token=' + token, '_blank');
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CLIENT SUPPORT — Ticket System
   Mirrors architect dashboard.js chat logic, adapted for the client role.
   API base: /api/client/support  (requires client JWT)
   ═══════════════════════════════════════════════════════════════════════════════ */

const CLIENT_SUPPORT_API = CLIENT_API + '/client/support';

// ── Module state ──────────────────────────────────────────────────────────────
var clientSupportState = {
    tickets:    [],
    activeId:   null,
    composing:  false,
    initialised: false,
    pollTimer:  null
};

// ── Auth header helper ────────────────────────────────────────────────────────
function clientSupportHeaders() {
    var token = localStorage.getItem('client_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
}

// ── Init (called once when view first becomes active) ────────────────────────
function clientSupportInit() {
    clientSupportLoadTickets();
    // Start unread polling (every 60s)
    if (!clientSupportState.pollTimer) {
        clientSupportPollUnread();
        clientSupportState.pollTimer = setInterval(clientSupportPollUnread, 60000);
    }
}

// ── Poll unread count and update sidebar badge ────────────────────────────────
async function clientSupportPollUnread() {
    try {
        var res  = await fetch(CLIENT_SUPPORT_API + '/unread', { headers: clientSupportHeaders() });
        if (!res.ok) return;
        var data = await res.json();
        var badge = document.getElementById('clientSupportBadge');
        if (!badge) return;
        if (data.count > 0) {
            badge.textContent    = data.count;
            badge.style.display  = 'inline-block';
        } else {
            badge.style.display  = 'none';
        }
    } catch (e) { /* silent */ }
}

// ── Load and render ticket list ───────────────────────────────────────────────
async function clientSupportLoadTickets() {
    var listEl = document.getElementById('clientChatThreadList');
    if (!listEl) return;

    listEl.innerHTML = '<div class="client-chat-list-loading"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        var res  = await fetch(CLIENT_SUPPORT_API, { headers: clientSupportHeaders() });
        var data = await res.json();

        if (!data.success) {
            listEl.innerHTML = '<div class="client-chat-list-empty"><i class="fas fa-exclamation-circle"></i><p>Failed to load tickets</p></div>';
            return;
        }

        clientSupportState.tickets = data.tickets || [];
        clientSupportRenderList();

        // Clear nav badge now that user is looking at the list
        var badge = document.getElementById('clientSupportBadge');
        if (badge) badge.style.display = 'none';

        // Re-render active thread if one was open
        if (clientSupportState.activeId) {
            var active = clientSupportState.tickets.find(function(t) { return t._id === clientSupportState.activeId; });
            if (active) clientSupportRenderThread(active);
        }
    } catch (e) {
        listEl.innerHTML = '<div class="client-chat-list-empty"><i class="fas fa-wifi"></i><p>Network error.<br>Check your connection.</p></div>';
    }
}

// ── Render thread list in sidebar ─────────────────────────────────────────────
function clientSupportRenderList() {
    var listEl = document.getElementById('clientChatThreadList');
    if (!listEl) return;

    if (!clientSupportState.tickets.length) {
        listEl.innerHTML = '<div class="client-chat-list-empty">' +
            '<i class="fas fa-comment-slash"></i>' +
            '<p>No tickets yet.<br>Tap <i class="fas fa-edit"></i> to open one.</p>' +
            '</div>';
        return;
    }

    var statusColors = { open: '#f59e0b', replied: '#10b981', closed: '#64748b' };

    listEl.innerHTML = clientSupportState.tickets.map(function(t) {
        var unread  = !t.userRead && t.replies && t.replies.length > 0;
        var color   = statusColors[t.status] || '#64748b';
        var lastMsg = (t.replies && t.replies.length)
            ? t.replies[t.replies.length - 1].message
            : t.message;
        var preview = lastMsg ? lastMsg.slice(0, 55) + (lastMsg.length > 55 ? '…' : '') : '';
        var time    = clientSupportRelTime(t.updatedAt || t.createdAt);
        var isActive = t._id === clientSupportState.activeId;

        return '<div class="client-chat-list-item' +
            (unread   ? ' unread' : '') +
            (isActive ? ' active' : '') +
            '" onclick="clientSupportOpenThread(\'' + t._id + '\')" data-stid="' + t._id + '">' +
            '<div class="client-chat-list-subject">' +
            (unread ? '<span class="client-chat-unread-dot"></span>' : '') +
            clientSupportEsc(t.subject) +
            '</div>' +
            '<div class="client-chat-list-meta">' +
            '<span class="client-chat-list-preview">' + clientSupportEsc(preview) + '</span>' +
            '<span class="client-chat-list-time">' + time + '</span>' +
            '</div>' +
            '<span class="client-chat-status-pill" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44;">' +
            t.status + '</span>' +
            '</div>';
    }).join('');
}

// ── Open a ticket thread ──────────────────────────────────────────────────────
function clientSupportOpenThread(id) {
    clientSupportState.activeId = id;

    // Update active state in sidebar
    document.querySelectorAll('.client-chat-list-item').forEach(function(el) {
        el.classList.remove('active');
    });
    var item = document.querySelector('.client-chat-list-item[data-stid="' + id + '"]');
    if (item) item.classList.add('active');

    // Dismiss compose if open
    clientSupportHideCompose(false);

    var ticket = clientSupportState.tickets.find(function(t) { return t._id === id; });
    if (ticket) {
        clientSupportRenderThread(ticket);
        // Mark read via GET single ticket (fires server-side userRead = true)
        if (!ticket.userRead) {
            fetch(CLIENT_SUPPORT_API + '/' + id, { headers: clientSupportHeaders() })
                .then(function(r) { return r.json(); })
                .then(function(d) {
                    if (d.success) {
                        // Update local state
                        var idx = clientSupportState.tickets.findIndex(function(t) { return t._id === id; });
                        if (idx !== -1) clientSupportState.tickets[idx] = d.ticket;
                        clientSupportRenderList();
                        clientSupportPollUnread();
                    }
                })
                .catch(function() {});
        }
    }
}

// ── Render a ticket thread in the main pane ───────────────────────────────────
function clientSupportRenderThread(ticket) {
    var emptyEl   = document.getElementById('clientChatEmpty');
    var composeEl = document.getElementById('clientChatCompose');
    var threadEl  = document.getElementById('clientChatThread');

    if (emptyEl)   emptyEl.style.display   = 'none';
    if (composeEl) composeEl.style.display = 'none';
    if (threadEl)  threadEl.style.display  = 'flex';

    // Header
    var statusColors = { open: '#f59e0b', replied: '#10b981', closed: '#64748b' };
    var color = statusColors[ticket.status] || '#64748b';

    var subjectEl = document.getElementById('clientThreadSubject');
    var metaEl    = document.getElementById('clientThreadMeta');
    var statusEl  = document.getElementById('clientThreadStatus');

    if (subjectEl) subjectEl.textContent = ticket.subject;
    if (metaEl)    metaEl.textContent    = new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (statusEl)  statusEl.innerHTML   = '<span class="client-chat-status-pill" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44;">' + ticket.status + '</span>';

    // Reply box vs closed notice
    var replyBox     = document.getElementById('clientChatReplyBox');
    var closedNotice = document.getElementById('clientChatClosedNotice');
    if (ticket.status === 'closed') {
        if (replyBox)     replyBox.style.display     = 'none';
        if (closedNotice) closedNotice.style.display = 'flex';
    } else {
        if (replyBox)     replyBox.style.display     = 'flex';
        if (closedNotice) closedNotice.style.display = 'none';
        // Focus reply input
        setTimeout(function() {
            var inp = document.getElementById('clientChatReplyInput');
            if (inp) inp.focus();
        }, 80);
    }

    // Build message thread: original message + replies
    var allMsgs = [
        { sender: 'client', senderName: ticket.clientName, message: ticket.message, createdAt: ticket.createdAt }
    ].concat(ticket.replies || []);

    var msgsEl = document.getElementById('clientChatMessages');
    if (msgsEl) {
        msgsEl.innerHTML = allMsgs.map(function(msg) {
            var isAdmin     = msg.sender === 'admin';
            var rowClass    = isAdmin ? 'from-admin' : 'from-client';
            var senderLabel = isAdmin ? '🛡 SmartArch Support' : '👤 You';
            var time        = new Date(msg.createdAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return '<div class="client-bubble-row ' + rowClass + '">' +
                '<span class="client-bubble-sender">' + senderLabel + '</span>' +
                '<div class="client-bubble">' + clientSupportEsc(msg.message) + '</div>' +
                '<span class="client-bubble-time">' + time + '</span>' +
                '</div>';
        }).join('');

        // Scroll to latest message
        setTimeout(function() { msgsEl.scrollTop = msgsEl.scrollHeight; }, 40);
    }
}

// ── Show compose panel ────────────────────────────────────────────────────────
function clientSupportShowCompose() {
    clientSupportState.composing = true;
    clientSupportState.activeId  = null;

    // Deselect sidebar items
    document.querySelectorAll('.client-chat-list-item').forEach(function(el) {
        el.classList.remove('active');
    });

    var emptyEl   = document.getElementById('clientChatEmpty');
    var threadEl  = document.getElementById('clientChatThread');
    var composeEl = document.getElementById('clientChatCompose');

    if (emptyEl)   emptyEl.style.display   = 'none';
    if (threadEl)  threadEl.style.display  = 'none';
    if (composeEl) composeEl.style.display = 'flex';

    // Reset form
    var subjectEl = document.getElementById('clientComposeSubject');
    var msgEl     = document.getElementById('clientComposeMessage');
    var cntEl     = document.getElementById('clientComposeCharCount');
    if (subjectEl) subjectEl.value    = '';
    if (msgEl)     msgEl.value        = '';
    if (cntEl)     cntEl.textContent  = '0';

    // Focus
    setTimeout(function() { if (subjectEl) subjectEl.focus(); }, 80);
}

// ── Hide compose panel ────────────────────────────────────────────────────────
function clientSupportHideCompose(showEmpty) {
    if (showEmpty === undefined) showEmpty = true;
    clientSupportState.composing = false;

    var composeEl = document.getElementById('clientChatCompose');
    var emptyEl   = document.getElementById('clientChatEmpty');
    var threadEl  = document.getElementById('clientChatThread');

    if (composeEl) composeEl.style.display = 'none';

    if (showEmpty && !clientSupportState.activeId) {
        if (emptyEl)  emptyEl.style.display  = 'flex';
        if (threadEl) threadEl.style.display = 'none';
    }
}

// ── Submit a new ticket ───────────────────────────────────────────────────────
async function clientSupportSubmitTicket() {
    var subject = (document.getElementById('clientComposeSubject')?.value || '').trim();
    var message = (document.getElementById('clientComposeMessage')?.value || '').trim();

    if (!subject)               { clientSupportToast('Subject is required.', 'error'); return; }
    if (message.length < 10)    { clientSupportToast('Message must be at least 10 characters.', 'error'); return; }

    var btn = document.getElementById('clientComposeSendBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…'; }

    try {
        var res  = await fetch(CLIENT_SUPPORT_API, {
            method:  'POST',
            headers: clientSupportHeaders(),
            body:    JSON.stringify({ subject: subject, message: message })
        });
        var data = await res.json();

        if (data.success) {
            clientSupportToast('Ticket submitted! We\'ll reply soon.', 'success');
            await clientSupportLoadTickets();
            // Open the new ticket (first in list = most recent)
            if (clientSupportState.tickets.length) {
                clientSupportOpenThread(clientSupportState.tickets[0]._id);
            }
        } else {
            clientSupportToast(data.message || 'Failed to submit ticket.', 'error');
        }
    } catch (e) {
        clientSupportToast('Network error. Please try again.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Ticket'; }
    }
}

// ── Send a reply inside an open thread ───────────────────────────────────────
async function clientSupportSendReply() {
    var inputEl = document.getElementById('clientChatReplyInput');
    var message = (inputEl ? inputEl.value : '').trim();
    if (!message) return;

    var id = clientSupportState.activeId;
    if (!id) return;

    var btn = document.getElementById('clientChatReplySend');
    if (btn) btn.disabled = true;

    try {
        var res  = await fetch(CLIENT_SUPPORT_API + '/' + id + '/reply', {
            method:  'POST',
            headers: clientSupportHeaders(),
            body:    JSON.stringify({ message: message })
        });
        var data = await res.json();

        if (data.success) {
            if (inputEl) inputEl.value = '';
            // Update local ticket and re-render thread immediately
            var idx = clientSupportState.tickets.findIndex(function(t) { return t._id === id; });
            if (idx !== -1) clientSupportState.tickets[idx] = data.ticket;
            clientSupportRenderList();
            clientSupportRenderThread(data.ticket);
        } else {
            clientSupportToast(data.message || 'Failed to send reply.', 'error');
        }
    } catch (e) {
        clientSupportToast('Network error. Please try again.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ── Keyboard shortcut: Enter sends, Shift+Enter newline ──────────────────────
function clientSupportReplyKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        clientSupportSendReply();
    }
}

// ── Mobile: show sidebar list ─────────────────────────────────────────────────
function clientSupportShowList() {
    clientSupportState.activeId = null;
    var threadEl  = document.getElementById('clientChatThread');
    var composeEl = document.getElementById('clientChatCompose');
    var emptyEl   = document.getElementById('clientChatEmpty');
    var sidebar   = document.getElementById('clientChatSidebar');

    if (threadEl)  threadEl.style.display  = 'none';
    if (composeEl) composeEl.style.display = 'none';
    if (emptyEl)   emptyEl.style.display   = 'flex';
    if (sidebar)   sidebar.classList.add('mobile-visible');

    document.querySelectorAll('.client-chat-list-item').forEach(function(el) {
        el.classList.remove('active');
    });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function clientSupportEsc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function clientSupportRelTime(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24)   return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days < 7)   return days + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function clientSupportToast(message, type) {
    type = type || 'info';
    // Prefer existing toast system
    if (typeof showToast === 'function')       { showToast(message, type); return; }
    if (typeof clientShowToast === 'function') { clientShowToast(message, type); return; }
    var colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
    var toast  = document.createElement('div');
    toast.style.cssText = [
        'position:fixed', 'bottom:1.5rem', 'right:1.5rem', 'z-index:9999',
        'background:#0d1424', 'border:1px solid rgba(255,255,255,0.1)',
        'border-left:3px solid ' + (colors[type] || colors.info),
        'border-radius:10px', 'padding:0.875rem 1.25rem',
        'color:#f1f5f9', 'font-size:0.875rem', 'min-width:260px',
        'box-shadow:0 20px 40px rgba(0,0,0,0.4)'
    ].join(';');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity    = '0';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
}

// ── Bootstrap unread polling on page load ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    // Start polling regardless of which view is active
    clientSupportPollUnread();
    setInterval(clientSupportPollUnread, 60000);
});

// ── Expose to inline HTML handlers ───────────────────────────────────────────
window.clientSupportInit          = clientSupportInit;
window.clientSupportShowCompose   = clientSupportShowCompose;
window.clientSupportHideCompose   = clientSupportHideCompose;
window.clientSupportSubmitTicket  = clientSupportSubmitTicket;
window.clientSupportOpenThread    = clientSupportOpenThread;
window.clientSupportSendReply     = clientSupportSendReply;
window.clientSupportReplyKeydown  = clientSupportReplyKeydown;
window.clientSupportShowList      = clientSupportShowList;