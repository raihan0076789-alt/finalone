// js/subscription.js
// Handles subscription status display, Razorpay upgrade flow, plan UI state,
// and the professional limit-reached / upgrade modal system.
// Depends on: api.js (window.api), showToast(), showLoading(), hideLoading()

(function () {

    // ── Plan meta ──────────────────────────────────────────────────────────
    const PLAN_META = {
        free:       { label: 'Free',       badgeClass: 'free',       color: '#94a3b8', icon: 'fa-user' },
        pro:        { label: 'Pro',        badgeClass: 'pro',        color: '#00d4c8', icon: 'fa-star' },
        enterprise: { label: 'Enterprise', badgeClass: 'enterprise', color: '#a5b4fc', icon: 'fa-crown' }
    };

    const PLAN_DETAILS = {
        free: {
            label: 'Free', price: '₹0', period: '/month',
            features: [
                { on: true,  text: '3 saved projects' },
                { on: true,  text: '2D floor plan editor' },
                { on: true,  text: 'Basic room templates' },
                { on: true,  text: '10 AI messages / month' },
                { on: false, text: 'Export (OBJ / STL / GLTF)' },
                { on: false, text: 'Multi-floor design' },
                { on: false, text: 'Priority support' },
            ]
        },
        pro: {
            label: 'Pro', price: '₹499', period: '/month',
            badge: 'Most popular',
            features: [
                { on: true,  text: '20 saved projects' },
                { on: true,  text: '2D + 3D floor plan editor' },
                { on: true,  text: 'All room templates' },
                { on: true,  text: '500 AI messages / month' },
                { on: true,  text: 'Export (OBJ / STL / GLTF)' },
                { on: true,  text: 'Multi-floor design' },
                { on: false, text: 'Priority support' },
            ]
        },
        enterprise: {
            label: 'Enterprise', price: '₹1,499', period: '/month',
            features: [
                { on: true, text: 'Unlimited projects' },
                { on: true, text: '2D + 3D floor plan editor' },
                { on: true, text: 'All room templates' },
                { on: true, text: 'Unlimited AI messages' },
                { on: true, text: 'Export (CAD / OBJ / STL / GLTF)' },
                { on: true, text: 'Multi-floor design' },
                { on: true, text: 'Priority support + SLA' },
            ]
        }
    };

    // ── Load + render current plan status ─────────────────────────────────
    async function loadSubscriptionStatus() {
        const banner = document.getElementById('subStatusBanner');
        if (!banner) return;

        try {
            const data  = await window.api.getSubscriptionStatus();
            const plan  = data.plan || 'free';
            const meta  = PLAN_META[plan] || PLAN_META.free;

            // AI message usage
            const aiUsed  = data.aiMessages?.used  ?? 0;
            const aiLimit = data.aiMessages?.limit;   // null = unlimited
            const aiLeft  = aiLimit !== null ? Math.max(0, aiLimit - aiUsed) : null;

            // Project usage
            const projUsed  = data.projects?.used  ?? 0;
            const projLimit = data.projects?.limit;   // null = unlimited
            const projLeft  = projLimit !== null ? Math.max(0, projLimit - projUsed) : null;

            // Bar math
            let aiBarPct = 0, aiBarClass = '';
            if (aiLimit !== null && aiLimit > 0) {
                aiBarPct   = Math.min(100, Math.round((aiUsed / aiLimit) * 100));
                aiBarClass = aiBarPct >= 90 ? 'danger' : aiBarPct >= 70 ? 'warn' : '';
            }
            let projBarPct = 0, projBarClass = '';
            if (projLimit !== null && projLimit > 0) {
                projBarPct   = Math.min(100, Math.round((projUsed / projLimit) * 100));
                projBarClass = projBarPct >= 90 ? 'danger' : projBarPct >= 70 ? 'warn' : '';
            }

            // Expiry
            let expiryText = plan === 'free' ? 'No expiry — free forever' : '';
            if (data.planExpiresAt) {
                const d = new Date(data.planExpiresAt);
                expiryText = `Renews on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
            }

            function leftColor(barClass) {
                return barClass === 'danger' ? '#f87171' : barClass === 'warn' ? '#facc15' : '#4ade80';
            }

            function usageBar(label, used, limit, left, pct, barClass, icon, unlimited) {
                if (unlimited) {
                    return `<div class="sub-usage-row">
                        <i class="fas ${icon} sub-usage-icon"></i>
                        <div class="sub-usage-info">
                            <div class="sub-usage-label-row">
                                <span class="sub-usage-label">${label}</span>
                                <span class="sub-usage-unlimited"><i class="fas fa-infinity"></i> Unlimited</span>
                            </div>
                        </div>
                    </div>`;
                }
                const leftLabel = left === 0
                    ? `<span style="color:#f87171;font-weight:600;">None left — upgrade to create more</span>`
                    : `<span style="color:${leftColor(barClass)};font-weight:600;">${left} remaining</span>`;
                return `<div class="sub-usage-row">
                    <i class="fas ${icon} sub-usage-icon"></i>
                    <div class="sub-usage-info">
                        <div class="sub-usage-label-row">
                            <span class="sub-usage-label">${label}</span>
                            <span class="sub-usage-counts">${used}&thinsp;/&thinsp;${limit} used &nbsp;·&nbsp; ${leftLabel}</span>
                        </div>
                        <div class="sub-ai-bar-track" style="margin-top:5px;">
                            <div class="sub-ai-bar-fill ${barClass}" style="width:${pct}%"></div>
                        </div>
                    </div>
                </div>`;
            }

            banner.innerHTML = `
                <div class="sub-banner-top">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <span class="sub-plan-badge ${meta.badgeClass}">
                            <i class="fas ${meta.icon}" style="font-size:10px;"></i> ${meta.label}
                        </span>
                        <h3 style="margin:0;font-size:1rem;font-weight:600;color:#f1f5f9;">Your current plan</h3>
                    </div>
                    <p style="margin:4px 0 0;font-size:0.82rem;color:#64748b;">${expiryText}</p>
                </div>
                <div class="sub-banner-usage">
                    ${usageBar('Saved projects', projUsed, projLimit ?? '∞', projLeft, projBarPct, projBarClass, 'fa-folder-open', projLimit === null)}
                    ${usageBar('AI messages this month', aiUsed, aiLimit ?? '∞', aiLeft, aiBarPct, aiBarClass, 'fa-robot', aiLimit === null)}
                </div>
                ${plan === 'free' ? `
                <div class="sub-banner-upgrade-hint">
                    <i class="fas fa-bolt"></i>
                    <span>Unlock more with <strong>Pro</strong> — 20 projects &amp; 500 AI messages/month</span>
                    <button class="sub-upgrade-hint-btn" onclick="window.showUpgradeModal('pro')">
                        Upgrade <i class="fas fa-arrow-right"></i>
                    </button>
                </div>` : ''}
            `;

            // Cache for limit modal
            window._currentPlanData = { plan, aiUsed, aiLimit, aiLeft, projUsed, projLimit, projLeft };

            updatePlanCards(plan);

        } catch (err) {
            console.error('loadSubscriptionStatus:', err);
            const b = document.getElementById('subStatusBanner');
            if (b) b.innerHTML = `<p style="color:#ef4444;font-size:0.85rem;"><i class="fas fa-exclamation-circle"></i> Could not load plan info.</p>`;
        }
    }

    // ── Highlight active plan card ─────────────────────────────────────────
    function updatePlanCards(currentPlan) {
        ['free', 'pro', 'enterprise'].forEach(plan => {
            const card = document.getElementById(`planCard-${plan}`);
            const btn  = document.getElementById(`planBtn-${plan}`);
            if (!card || !btn) return;

            card.classList.toggle('current', plan === currentPlan);

            if (plan === currentPlan) {
                btn.textContent = 'Current plan';
                btn.classList.add('current-btn');
                btn.disabled = true;
            } else if (plan === 'free') {
                btn.textContent = 'Downgrade to Free';
                btn.classList.remove('current-btn');
                btn.disabled = false;
                btn.onclick = () => showToast('To cancel, contact support or let your subscription expire.', 'info');
            } else {
                btn.textContent = plan === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Enterprise';
                btn.classList.remove('current-btn');
                btn.disabled = false;
                btn.onclick = () => startUpgrade(plan);
            }
        });
    }

    // ── Razorpay upgrade flow ─────────────────────────────────────────────
    async function startUpgrade(plan) {
        if (!['pro', 'enterprise'].includes(plan)) return;
        closeLimitModal();
        closeUpgradeModal();

        try {
            showLoading('Preparing payment…');
            const res = await window.api.createSubscriptionOrder(plan);
            hideLoading();

            if (!res.success) { showToast(res.message || 'Could not initiate payment.', 'error'); return; }

            const options = {
                key:         res.razorpayKeyId,
                amount:      res.order.amount,
                currency:    res.order.currency,
                name:        'SmartArch',
                description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — Monthly`,
                order_id:    res.order.id,
                theme:       { color: '#00d4c8' },
                handler: async function (response) {
                    try {
                        showLoading('Verifying payment…');
                        const verify = await window.api.verifySubscriptionPayment({
                            razorpay_order_id:   response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature:  response.razorpay_signature,
                            plan
                        });
                        hideLoading();
                        if (verify.success) {
                            showToast(`🎉 ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated!`, 'success');
                            // Refresh user from server so localStorage reflects the new plan immediately
                            // (patching locally is unreliable if the field was missing or stale)
                            try {
                                const fresh = await window.api.getMe();
                                if (fresh && fresh.user) {
                                    localStorage.setItem('user', JSON.stringify(fresh.user));
                                    // Update the nav pill badge instantly
                                    if (typeof window._updatePlanPill === 'function')
                                        window._updatePlanPill(fresh.user.plan || plan);
                                }
                            } catch (_) {
                                // fallback: patch the plan field directly
                                try {
                                    const u = JSON.parse(localStorage.getItem('user') || '{}');
                                    u.plan = plan;
                                    localStorage.setItem('user', JSON.stringify(u));
                                    if (typeof window._updatePlanPill === 'function')
                                        window._updatePlanPill(plan);
                                } catch (_2) {}
                            }
                            loadSubscriptionStatus();
                        } else {
                            showToast(verify.message || 'Payment verification failed.', 'error');
                        }
                    } catch (err) {
                        hideLoading();
                        showToast('Payment verification error. Contact support.', 'error');
                    }
                },
                modal: { ondismiss: () => showToast('Payment cancelled.', 'info') },
                prefill: (function () {
                    try {
                        const u = JSON.parse(localStorage.getItem('user') || '{}');
                        return { name: u.name || '', email: u.email || '', contact: u.phone || '' };
                    } catch { return {}; }
                })()
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', (r) => showToast(`Payment failed: ${r.error.description}`, 'error'));
            rzp.open();
        } catch (err) {
            hideLoading();
            showToast('Something went wrong. Please try again.', 'error');
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // MODALS
    // ══════════════════════════════════════════════════════════════════════

    function injectModalsIfNeeded() {
        if (document.getElementById('planLimitModal')) return;

        const div = document.createElement('div');
        div.innerHTML = `
        <!-- Limit-Reached Modal -->
        <div id="planLimitModal" class="plan-modal-overlay" style="display:none;" onclick="if(event.target===this)closeLimitModal()">
            <div class="plan-modal-box">
                <button class="plan-modal-close" onclick="closeLimitModal()"><i class="fas fa-times"></i></button>
                <div class="plan-modal-icon-wrap limit"><i class="fas fa-lock plan-modal-icon"></i></div>
                <h2 class="plan-modal-title" id="limitModalTitle">Limit Reached</h2>
                <p class="plan-modal-desc" id="limitModalDesc">You've reached your plan limit.</p>
                <div class="plan-limit-usage" id="limitModalUsage"></div>
                <div class="plan-modal-actions">
                    <button class="plan-modal-btn-primary" id="limitModalUpgradeBtn">
                        <i class="fas fa-arrow-up"></i> View Upgrade Options
                    </button>
                    <button class="plan-modal-btn-ghost" onclick="closeLimitModal()">Maybe later</button>
                </div>
            </div>
        </div>

        <!-- Upgrade Plan Modal -->
        <div id="upgradeModal" class="plan-modal-overlay" style="display:none;" onclick="if(event.target===this)closeUpgradeModal()">
            <div class="plan-modal-box upgrade-modal-box">
                <button class="plan-modal-close" onclick="closeUpgradeModal()"><i class="fas fa-times"></i></button>
                <div class="plan-modal-icon-wrap upgrade"><i class="fas fa-rocket plan-modal-icon"></i></div>
                <h2 class="plan-modal-title">Upgrade Your Plan</h2>
                <p class="plan-modal-desc">Choose a plan that fits your workflow</p>
                <div class="upgrade-modal-plans" id="upgradeModalPlans"></div>
                <p class="plan-modal-note"><i class="fas fa-shield-alt"></i> Secure payment via Razorpay · Cancel anytime</p>
            </div>
        </div>`;
        document.body.appendChild(div);
        injectModalStyles();
    }

    function injectModalStyles() {
        if (document.getElementById('planModalStyles')) return;
        const s = document.createElement('style');
        s.id = 'planModalStyles';
        s.textContent = `
        .plan-modal-overlay{position:fixed;inset:0;z-index:99999;background:rgba(6,10,18,.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:pmFadeIn .2s ease}
        @keyframes pmFadeIn{from{opacity:0}to{opacity:1}}
        .plan-modal-box{background:#0d1424;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:2.5rem 2rem 2rem;width:100%;max-width:460px;position:relative;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.6);animation:pmSlideUp .25s ease}
        .upgrade-modal-box{max-width:720px}
        @keyframes pmSlideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        .plan-modal-close{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.06);border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:.85rem;transition:all .2s;display:flex;align-items:center;justify-content:center}
        .plan-modal-close:hover{background:rgba(255,255,255,.12);color:#f1f5f9}
        .plan-modal-icon-wrap{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.2rem}
        .plan-modal-icon-wrap.limit{background:rgba(239,68,68,.12);border:1.5px solid rgba(239,68,68,.25)}
        .plan-modal-icon-wrap.upgrade{background:rgba(0,212,200,.1);border:1.5px solid rgba(0,212,200,.25)}
        .plan-modal-icon{font-size:1.6rem}
        .plan-modal-icon-wrap.limit .plan-modal-icon{color:#f87171}
        .plan-modal-icon-wrap.upgrade .plan-modal-icon{color:#00d4c8}
        .plan-modal-title{font-size:1.35rem;font-weight:700;color:#f1f5f9;margin:0 0 .5rem}
        .plan-modal-desc{color:#94a3b8;font-size:.9rem;margin:0 0 1.5rem}
        .plan-limit-usage{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1rem 1.2rem;margin-bottom:1.5rem;text-align:left}
        .plan-limit-row{display:flex;justify-content:space-between;align-items:center;font-size:.85rem;color:#94a3b8;margin-bottom:6px}
        .plan-limit-row strong{color:#f1f5f9}
        .plan-limit-bar-track{height:6px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden;margin-bottom:.75rem}
        .plan-limit-bar-fill{height:100%;border-radius:99px;background:#f87171;transition:width .4s}
        .plan-modal-actions{display:flex;flex-direction:column;gap:.6rem}
        .plan-modal-btn-primary{padding:.75rem 1.5rem;background:linear-gradient(135deg,#00d4c8,#7c3aed);color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;transition:opacity .2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .plan-modal-btn-primary:hover{opacity:.88}
        .plan-modal-btn-ghost{padding:.65rem 1.5rem;background:transparent;color:#64748b;border:1px solid rgba(255,255,255,.08);border-radius:10px;font-size:.85rem;cursor:pointer;transition:all .2s}
        .plan-modal-btn-ghost:hover{color:#94a3b8;border-color:rgba(255,255,255,.15)}
        .plan-modal-note{margin-top:1rem;font-size:.78rem;color:#475569;display:flex;align-items:center;justify-content:center;gap:6px}
        .upgrade-modal-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1rem;text-align:left}
        .upgrade-plan-card{background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:1.2rem 1rem;position:relative;transition:border-color .2s,transform .2s}
        .upgrade-plan-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.15)}
        .upgrade-plan-card.featured{border-color:#00d4c8}
        .upgrade-plan-card.current{border-color:#475569;opacity:.6}
        .upgrade-plan-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00d4c8,#7c3aed);color:#fff;font-size:.65rem;font-weight:700;padding:2px 10px;border-radius:99px;white-space:nowrap}
        .upgrade-plan-name{font-size:.9rem;font-weight:700;color:#f1f5f9;margin-bottom:2px}
        .upgrade-plan-price{font-size:1.3rem;font-weight:800;color:#00d4c8}
        .upgrade-plan-price span{font-size:.75rem;color:#64748b;font-weight:400}
        .upgrade-plan-features{list-style:none;padding:0;margin:.75rem 0}
        .upgrade-plan-features li{font-size:.78rem;color:#94a3b8;padding:3px 0;display:flex;gap:6px;align-items:flex-start}
        .upgrade-plan-features li .fi{color:#4ade80;flex-shrink:0}
        .upgrade-plan-features li.off .fi{color:#475569}
        .upgrade-plan-features li.off{color:#475569}
        .upgrade-plan-btn{width:100%;padding:.6rem;background:linear-gradient(135deg,#00d4c8,#7c3aed);color:#fff;border:none;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;transition:opacity .2s}
        .upgrade-plan-btn:hover{opacity:.85}
        .upgrade-plan-btn:disabled{background:rgba(255,255,255,.06);color:#475569;cursor:default;opacity:1}
        /* banner enhancements */
        .sub-banner-top{margin-bottom:1rem}
        .sub-banner-usage{display:flex;flex-direction:column;gap:.9rem}
        .sub-usage-row{display:flex;align-items:flex-start;gap:.75rem}
        .sub-usage-icon{color:#475569;font-size:.9rem;margin-top:2px;flex-shrink:0}
        .sub-usage-info{flex:1;min-width:0}
        .sub-usage-label-row{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px}
        .sub-usage-label{font-size:.83rem;color:#94a3b8}
        .sub-usage-counts{font-size:.78rem;color:#64748b}
        .sub-usage-unlimited{font-size:.82rem;color:#00d4c8;display:flex;align-items:center;gap:5px;margin-top:2px}
        .sub-banner-upgrade-hint{margin-top:1.1rem;padding:.75rem 1rem;background:rgba(0,212,200,.06);border:1px solid rgba(0,212,200,.15);border-radius:10px;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;font-size:.82rem;color:#94a3b8}
        .sub-banner-upgrade-hint i{color:#00d4c8}
        .sub-upgrade-hint-btn{margin-left:auto;padding:5px 14px;background:linear-gradient(135deg,#00d4c8,#7c3aed);color:#fff;border:none;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;white-space:nowrap}
        `;
        document.head.appendChild(s);
    }

    // ── Show limit-reached modal ───────────────────────────────────────────
    function showPlanLimitModal(type, currentPlan) {
        injectModalsIfNeeded();

        const modal      = document.getElementById('planLimitModal');
        const titleEl    = document.getElementById('limitModalTitle');
        const descEl     = document.getElementById('limitModalDesc');
        const usageEl    = document.getElementById('limitModalUsage');
        const upgradeBtn = document.getElementById('limitModalUpgradeBtn');
        if (!modal) return;

        const pd   = window._currentPlanData || {};
        const plan = currentPlan || pd.plan || 'free';

        if (type === 'project' || type === 'projects') {
            const used  = pd.projUsed  ?? '?';
            const limit = pd.projLimit ?? '?';
            const pct   = (typeof limit === 'number' && limit > 0) ? Math.min(100, Math.round((used / limit) * 100)) : 100;
            titleEl.textContent = 'Project Limit Reached';
            descEl.textContent  = `You've used all ${limit} project slots on your ${plan} plan. Delete a project or upgrade for more.`;
            usageEl.innerHTML   = `
                <div class="plan-limit-row"><strong>Projects used</strong><strong>${used} / ${limit}</strong></div>
                <div class="plan-limit-bar-track"><div class="plan-limit-bar-fill" style="width:${pct}%"></div></div>
                <div class="plan-limit-row" style="font-size:.78rem"><span>Free: 3</span><span>Pro: 20</span><span>Enterprise: ∞</span></div>`;

        } else if (type === 'export') {
            titleEl.textContent = 'Export Requires Pro Plan';
            descEl.textContent  = 'CAD (DXF), OBJ, STL, and glTF exports are available on the Pro and Enterprise plans. Upgrade to download professional-grade files.';
            usageEl.innerHTML   = `
                <div class="plan-limit-row"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>CAD (DXF)</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-row"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>OBJ / MTL</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-row"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>STL</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-row" style="margin-bottom:0"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>glTF / GLB</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-bar-track" style="margin-top:.75rem"><div class="plan-limit-bar-fill" style="width:100%"></div></div>
                <div class="plan-limit-row" style="font-size:.78rem;margin-top:4px"><span>Free: JSON &amp; SVG only</span><span>Pro / Enterprise: all formats</span></div>`;

        } else if (type === 'multifloor') {
            titleEl.textContent = 'Multi-Floor Design Requires Pro';
            descEl.textContent  = 'Adding more than one floor is a Pro and Enterprise feature. Upgrade to design multi-storey buildings with full 3D stacking and staircase placement.';
            usageEl.innerHTML   = `
                <div class="plan-limit-row"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>Multiple floors</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-row"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>3D floor stacking</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-row" style="margin-bottom:0"><i class="fas fa-times-circle" style="color:#f87171;margin-right:6px;"></i><strong>Staircase placement</strong><strong style="color:#f87171;">Pro+</strong></div>
                <div class="plan-limit-bar-track" style="margin-top:.75rem"><div class="plan-limit-bar-fill" style="width:100%"></div></div>
                <div class="plan-limit-row" style="font-size:.78rem;margin-top:4px"><span>Free: 1 floor</span><span>Pro / Enterprise: up to 5 floors</span></div>`;

        } else {
            const used  = pd.aiUsed  ?? '?';
            const limit = pd.aiLimit ?? '?';
            const pct   = (typeof limit === 'number' && limit > 0) ? Math.min(100, Math.round((used / limit) * 100)) : 100;
            titleEl.textContent = 'AI Message Limit Reached';
            descEl.textContent  = `You've used all ${limit} AI messages this month on the ${plan} plan. Your limit resets next month, or upgrade now.`;
            usageEl.innerHTML   = `
                <div class="plan-limit-row"><strong>AI messages used</strong><strong>${used} / ${limit}</strong></div>
                <div class="plan-limit-bar-track"><div class="plan-limit-bar-fill" style="width:${pct}%"></div></div>
                <div class="plan-limit-row" style="font-size:.78rem"><span>Free: 10/mo</span><span>Pro: 500/mo</span><span>Enterprise: ∞</span></div>`;
        }

        upgradeBtn.onclick = () => showUpgradeModal();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeLimitModal() {
        const m = document.getElementById('planLimitModal');
        if (m) m.style.display = 'none';
        document.body.style.overflow = '';
    }

    // ── Show upgrade modal ─────────────────────────────────────────────────
    function showUpgradeModal(highlightPlan) {
        injectModalsIfNeeded();
        closeLimitModal();

        const modal   = document.getElementById('upgradeModal');
        const plansEl = document.getElementById('upgradeModalPlans');
        if (!modal || !plansEl) return;

        const currentPlan = (window._currentPlanData?.plan) || 'free';

        plansEl.innerHTML = ['free', 'pro', 'enterprise'].map(plan => {
            const d          = PLAN_DETAILS[plan];
            const isCurrent  = plan === currentPlan;
            const isFeatured = plan === 'pro';
            const cardClass  = isCurrent ? 'current' : isFeatured ? 'featured' : '';

            const featuresHtml = d.features.map(f =>
                `<li class="${f.on ? 'on' : 'off'}"><span class="fi">${f.on ? '✓' : '–'}</span>${f.text}</li>`
            ).join('');

            let btnHtml = '';
            if (isCurrent) {
                btnHtml = `<button class="upgrade-plan-btn" disabled>Current plan</button>`;
            } else if (plan === 'free') {
                btnHtml = `<button class="upgrade-plan-btn" style="background:rgba(255,255,255,.06);color:#64748b;" onclick="closeUpgradeModal();showToast('Contact support to downgrade.','info')">Downgrade to Free</button>`;
            } else {
                btnHtml = `<button class="upgrade-plan-btn" onclick="window.startUpgrade('${plan}')">Upgrade to ${d.label}</button>`;
            }

            return `<div class="upgrade-plan-card ${cardClass}">
                ${isFeatured && !isCurrent ? '<div class="upgrade-plan-badge">Most popular</div>' : ''}
                <div class="upgrade-plan-name">${d.label}</div>
                <div class="upgrade-plan-price">${d.price} <span>${d.period}</span></div>
                <ul class="upgrade-plan-features">${featuresHtml}</ul>
                ${btnHtml}
            </div>`;
        }).join('');

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeUpgradeModal() {
        const m = document.getElementById('upgradeModal');
        if (m) m.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Keyboard close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeLimitModal(); closeUpgradeModal(); }
    });

    // ── Expose globals ─────────────────────────────────────────────────────
    window.startUpgrade           = startUpgrade;
    window.loadSubscriptionStatus = loadSubscriptionStatus;
    window.showPlanLimitModal     = showPlanLimitModal;
    window.closeLimitModal        = closeLimitModal;
    window.showUpgradeModal       = showUpgradeModal;
    window.closeUpgradeModal      = closeUpgradeModal;

    // Inject modal HTML early
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectModalsIfNeeded);
    } else {
        injectModalsIfNeeded();
    }

})();