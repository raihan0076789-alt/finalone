/**
 * market-map.js — Global Real Estate Market Map Plugin v2
 * Fixes: CDN reliability, Leaflet init timing, filter button bindings,
 *        map container height, stats/results loading without map dependency.
 */

'use strict';

/* ═══════════════════════════════════════════════════════
   GLOBAL CITY DATASET  (USD per m², real-world data)
   tier: A=best afford. → D=premium/least affordable
   ═══════════════════════════════════════════════════════ */
const MM_CITIES = [
  // ── INDIA ───────────────────────────────────────────
  { id:1,  city:'Mumbai',       country:'India',        flag:'🇮🇳', lat:19.076,  lng:72.877,  priceM2:4200,  yoyGrowth:8.2,  rentYield:3.1, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'C' },
  { id:2,  city:'Delhi',        country:'India',        flag:'🇮🇳', lat:28.704,  lng:77.102,  priceM2:3100,  yoyGrowth:6.5,  rentYield:3.8, proximity:3, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'B' },
  { id:3,  city:'Bengaluru',    country:'India',        flag:'🇮🇳', lat:12.972,  lng:77.594,  priceM2:2800,  yoyGrowth:11.4, rentYield:4.2, proximity:3, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'A' },
  { id:4,  city:'Hyderabad',    country:'India',        flag:'🇮🇳', lat:17.385,  lng:78.486,  priceM2:2200,  yoyGrowth:9.8,  rentYield:4.8, proximity:4, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'A' },
  { id:5,  city:'Chennai',      country:'India',        flag:'🇮🇳', lat:13.083,  lng:80.270,  priceM2:1950,  yoyGrowth:7.1,  rentYield:4.5, proximity:4, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  { id:6,  city:'Pune',         country:'India',        flag:'🇮🇳', lat:18.520,  lng:73.856,  priceM2:1800,  yoyGrowth:8.9,  rentYield:5.1, proximity:5, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'A' },
  { id:7,  city:'Ahmedabad',    country:'India',        flag:'🇮🇳', lat:23.022,  lng:72.571,  priceM2:1400,  yoyGrowth:7.4,  rentYield:5.4, proximity:4, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'A' },
  // ── ASIA ────────────────────────────────────────────
  { id:8,  city:'Tokyo',        country:'Japan',        flag:'🇯🇵', lat:35.680,  lng:139.691, priceM2:12500, yoyGrowth:3.2,  rentYield:2.8, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:9,  city:'Singapore',    country:'Singapore',    flag:'🇸🇬', lat:1.352,   lng:103.819, priceM2:21000, yoyGrowth:2.1,  rentYield:2.3, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:10, city:'Bangkok',      country:'Thailand',     flag:'🇹🇭', lat:13.756,  lng:100.502, priceM2:3800,  yoyGrowth:4.5,  rentYield:5.2, proximity:2, electricity:true,  transport:true,  schools:true, type:'condo',     tier:'B' },
  { id:11, city:'Ho Chi Minh',  country:'Vietnam',      flag:'🇻🇳', lat:10.823,  lng:106.630, priceM2:2400,  yoyGrowth:7.8,  rentYield:5.8, proximity:3, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'B' },
  { id:12, city:'Kuala Lumpur', country:'Malaysia',     flag:'🇲🇾', lat:3.140,   lng:101.687, priceM2:3200,  yoyGrowth:3.9,  rentYield:4.6, proximity:2, electricity:true,  transport:true,  schools:true, type:'condo',     tier:'B' },
  { id:13, city:'Jakarta',      country:'Indonesia',    flag:'🇮🇩', lat:-6.200,  lng:106.816, priceM2:1900,  yoyGrowth:5.2,  rentYield:5.9, proximity:3, electricity:true,  transport:false, schools:true, type:'apartment', tier:'A' },
  { id:14, city:'Dubai',        country:'UAE',          flag:'🇦🇪', lat:25.204,  lng:55.270,  priceM2:5200,  yoyGrowth:14.2, rentYield:6.8, proximity:1, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'C' },
  { id:15, city:'Seoul',        country:'South Korea',  flag:'🇰🇷', lat:37.566,  lng:126.978, priceM2:9800,  yoyGrowth:1.8,  rentYield:2.5, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:16, city:'Shanghai',     country:'China',        flag:'🇨🇳', lat:31.230,  lng:121.473, priceM2:10200, yoyGrowth:-1.2, rentYield:2.1, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:17, city:'Colombo',      country:'Sri Lanka',    flag:'🇱🇰', lat:6.927,   lng:79.861,  priceM2:900,   yoyGrowth:4.2,  rentYield:6.1, proximity:4, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  { id:18, city:'Riyadh',       country:'Saudi Arabia', flag:'🇸🇦', lat:24.688,  lng:46.722,  priceM2:3000,  yoyGrowth:6.1,  rentYield:5.5, proximity:2, electricity:true,  transport:false, schools:true, type:'villa',     tier:'B' },
  // ── EUROPE ──────────────────────────────────────────
  { id:19, city:'London',       country:'UK',           flag:'🇬🇧', lat:51.507,  lng:-0.127,  priceM2:18000, yoyGrowth:0.8,  rentYield:3.1, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:20, city:'Paris',        country:'France',       flag:'🇫🇷', lat:48.856,  lng:2.352,   priceM2:13500, yoyGrowth:-2.1, rentYield:2.8, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:21, city:'Berlin',       country:'Germany',      flag:'🇩🇪', lat:52.521,  lng:13.405,  priceM2:7200,  yoyGrowth:-5.1, rentYield:2.9, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'C' },
  { id:22, city:'Lisbon',       country:'Portugal',     flag:'🇵🇹', lat:38.716,  lng:-9.142,  priceM2:6800,  yoyGrowth:8.4,  rentYield:4.1, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'C' },
  { id:23, city:'Madrid',       country:'Spain',        flag:'🇪🇸', lat:40.416,  lng:-3.703,  priceM2:5400,  yoyGrowth:6.2,  rentYield:3.8, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'C' },
  { id:24, city:'Warsaw',       country:'Poland',       flag:'🇵🇱', lat:52.229,  lng:21.012,  priceM2:3800,  yoyGrowth:5.1,  rentYield:5.0, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'B' },
  { id:25, city:'Budapest',     country:'Hungary',      flag:'🇭🇺', lat:47.498,  lng:19.040,  priceM2:3200,  yoyGrowth:4.8,  rentYield:5.3, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'B' },
  // ── AMERICAS ────────────────────────────────────────
  { id:26, city:'New York',     country:'USA',          flag:'🇺🇸', lat:40.712,  lng:-74.006, priceM2:20000, yoyGrowth:1.2,  rentYield:3.2, proximity:1, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'D' },
  { id:27, city:'Miami',        country:'USA',          flag:'🇺🇸', lat:25.774,  lng:-80.190, priceM2:8500,  yoyGrowth:5.8,  rentYield:4.1, proximity:1, electricity:true,  transport:false, schools:true, type:'condo',     tier:'C' },
  { id:28, city:'Austin',       country:'USA',          flag:'🇺🇸', lat:30.267,  lng:-97.743, priceM2:5200,  yoyGrowth:2.1,  rentYield:4.4, proximity:2, electricity:true,  transport:false, schools:true, type:'villa',     tier:'C' },
  { id:29, city:'Toronto',      country:'Canada',       flag:'🇨🇦', lat:43.653,  lng:-79.383, priceM2:10200, yoyGrowth:-3.2, rentYield:3.0, proximity:1, electricity:true,  transport:true,  schools:true, type:'condo',     tier:'D' },
  { id:30, city:'Mexico City',  country:'Mexico',       flag:'🇲🇽', lat:19.432,  lng:-99.133, priceM2:2400,  yoyGrowth:9.1,  rentYield:6.2, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'B' },
  { id:31, city:'São Paulo',    country:'Brazil',       flag:'🇧🇷', lat:-23.550, lng:-46.633, priceM2:2200,  yoyGrowth:7.4,  rentYield:5.8, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  { id:32, city:'Buenos Aires', country:'Argentina',    flag:'🇦🇷', lat:-34.603, lng:-58.381, priceM2:1100,  yoyGrowth:15.0, rentYield:7.2, proximity:2, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  { id:33, city:'Bogotá',       country:'Colombia',     flag:'🇨🇴', lat:4.711,   lng:-74.072, priceM2:1400,  yoyGrowth:6.8,  rentYield:6.5, proximity:3, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  // ── AFRICA / OCEANIA ────────────────────────────────
  { id:34, city:'Sydney',       country:'Australia',    flag:'🇦🇺', lat:-33.868, lng:151.209, priceM2:11500, yoyGrowth:7.2,  rentYield:3.5, proximity:1, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'D' },
  { id:35, city:'Melbourne',    country:'Australia',    flag:'🇦🇺', lat:-37.813, lng:144.962, priceM2:8800,  yoyGrowth:4.1,  rentYield:3.8, proximity:1, electricity:true,  transport:true,  schools:true, type:'villa',     tier:'C' },
  { id:36, city:'Cape Town',    country:'South Africa', flag:'🇿🇦', lat:-33.924, lng:18.424,  priceM2:1800,  yoyGrowth:5.5,  rentYield:7.1, proximity:3, electricity:true,  transport:false, schools:true, type:'villa',     tier:'A' },
  { id:37, city:'Nairobi',      country:'Kenya',        flag:'🇰🇪', lat:-1.286,  lng:36.818,  priceM2:1200,  yoyGrowth:4.1,  rentYield:7.8, proximity:4, electricity:true,  transport:false, schools:true, type:'apartment', tier:'A' },
  { id:38, city:'Cairo',        country:'Egypt',        flag:'🇪🇬', lat:30.044,  lng:31.236,  priceM2:800,   yoyGrowth:22.0, rentYield:9.2, proximity:3, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  { id:39, city:'Casablanca',   country:'Morocco',      flag:'🇲🇦', lat:33.589,  lng:-7.614,  priceM2:1100,  yoyGrowth:5.2,  rentYield:6.8, proximity:3, electricity:true,  transport:true,  schools:true, type:'apartment', tier:'A' },
  { id:40, city:'Lagos',        country:'Nigeria',      flag:'🇳🇬', lat:6.524,   lng:3.379,   priceM2:900,   yoyGrowth:8.9,  rentYield:8.5, proximity:3, electricity:false, transport:false, schools:true, type:'apartment', tier:'A' },
];

/* ═══════════════════════════════════════════════════════
   PLUGIN STATE
   ═══════════════════════════════════════════════════════ */
const MM = {
  map: null,
  markersLayer: null,
  heatLayer: null,
  infraLayer: null,
  initialized: false,
  leafletReady: false,
  filters: {
    maxPriceM2: 25000,
    types: [],
    electricity: false,
    transport: false,
    schools: false,
    proximityMax: 5,
    minYield: 0,
    tier: [],
    activeLayer: 'markers',
  },
  searchTimeout: null,
  currentCities: [...MM_CITIES],
};

/* ═══════════════════════════════════════════════════════
   STEP 1 — Load Leaflet from cdnjs (reliable)
   ═══════════════════════════════════════════════════════ */
function mmLoadLeaflet() {
  return new Promise(function (resolve) {
    if (window.L && window.L.map) { MM.leafletReady = true; resolve(true); return; }

    var LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    var LEAFLET_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    var HEAT_JS     = 'https://cdnjs.cloudflare.com/ajax/libs/Leaflet.heat/0.2.0/leaflet-heat.js';

    var cssEl = document.createElement('link');
    cssEl.rel = 'stylesheet'; cssEl.href = LEAFLET_CSS;
    document.head.appendChild(cssEl);

    var jsEl = document.createElement('script');
    jsEl.src = LEAFLET_JS;
    jsEl.onerror = function () { console.error('[MarketMap] Leaflet failed to load'); resolve(false); };
    jsEl.onload = function () {
      var heatEl = document.createElement('script');
      heatEl.src = HEAT_JS;
      heatEl.onload  = function () { MM.leafletReady = true; resolve(true); };
      heatEl.onerror = function () { MM.leafletReady = true; resolve(true); };
      document.head.appendChild(heatEl);
    };
    document.head.appendChild(jsEl);
  });
}

/* ═══════════════════════════════════════════════════════
   STEP 2 — Build the Leaflet map (after CSS paint settle)
   ═══════════════════════════════════════════════════════ */
function mmBuildMap() {
  if (MM.map) return;

  var container = document.getElementById('mm-leaflet-map');
  if (!container) { console.error('[MarketMap] Map container not found'); return; }

  // Guarantee a measurable height so Leaflet doesn't initialise at 0px
  if (container.offsetHeight < 10) {
    container.style.height = (window.innerHeight - 64) + 'px';
  }

  var L = window.L;
  MM.map = L.map('mm-leaflet-map', {
    center: [20, 10],
    zoom: 2,
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(MM.map);

  MM.markersLayer = L.layerGroup().addTo(MM.map);
  MM.infraLayer   = L.layerGroup();

  // Invalidate after first tile paint
  setTimeout(function () { if (MM.map) MM.map.invalidateSize(); }, 250);
}

/* ═══════════════════════════════════════════════════════
   MAIN INIT — called every time the view opens
   ═══════════════════════════════════════════════════════ */
async function mmInit() {
  // Always run data immediately — no map dependency
  mmApplyFilters();

  if (MM.initialized) {
    if (MM.map) setTimeout(function () { MM.map.invalidateSize(); }, 100);
    return;
  }

  var loading = document.getElementById('mm-loading');
  if (loading) loading.style.display = 'flex';

  try {
    var ok = await mmLoadLeaflet();
    if (ok) {
      mmBuildMap();
      mmRenderMarkers(MM.currentCities);
      mmRenderHeat(MM.currentCities);
    }
  } catch (e) {
    console.error('[MarketMap] Init error:', e);
  } finally {
    if (loading) loading.style.display = 'none';
  }

  mmBindFilters();
  mmBindSearch();
  MM.initialized = true;
}

/* ═══════════════════════════════════════════════════════
   AFFORDABILITY SCORE (0–100)
   ═══════════════════════════════════════════════════════ */
function mmAffordScore(c) {
  var priceScore = Math.max(0, 100 - (c.priceM2 / 250));
  var yieldScore = Math.min(c.rentYield * 8, 100);
  var proxScore  = (6 - c.proximity) * 12;
  var infraScore = (c.electricity ? 15 : 0) + (c.transport ? 10 : 0) + (c.schools ? 5 : 0);
  return Math.round((priceScore * 0.45) + (yieldScore * 0.25) + (proxScore * 0.15) + (infraScore * 0.15));
}

/* ═══════════════════════════════════════════════════════
   FILTER APPLICATION  (runs immediately, no map needed)
   ═══════════════════════════════════════════════════════ */
function mmApplyFilters() {
  var f = MM.filters;
  var cities = MM_CITIES.filter(function (c) {
    if (c.priceM2      > f.maxPriceM2)   return false;
    if (f.electricity  && !c.electricity) return false;
    if (f.transport    && !c.transport)   return false;
    if (f.schools      && !c.schools)     return false;
    if (c.proximity    > f.proximityMax)  return false;
    if (c.rentYield    < f.minYield)      return false;
    if (f.types.length && !f.types.includes(c.type)) return false;
    if (f.tier.length  && !f.tier.includes(c.tier))  return false;
    return true;
  });
  cities.sort(function (a, b) { return mmAffordScore(b) - mmAffordScore(a); });
  MM.currentCities = cities;

  mmRenderResults(cities);
  mmUpdateStats(cities);

  if (MM.map && MM.markersLayer) {
    mmRenderMarkers(cities);
    mmRenderHeat(cities);
  }
}

/* ═══════════════════════════════════════════════════════
   STATS BAR
   ═══════════════════════════════════════════════════════ */
function mmUpdateStats(cities) {
  function set(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  if (!cities.length) {
    set('mm-stat-locations','0'); set('mm-stat-avg-price','—');
    set('mm-stat-avg-yield','—'); set('mm-stat-top-score','—');
    return;
  }
  var avgPrice = Math.round(cities.reduce(function (a, c) { return a + c.priceM2; }, 0) / cities.length);
  var avgYield = (cities.reduce(function (a, c) { return a + c.rentYield; }, 0) / cities.length).toFixed(1);
  set('mm-stat-locations', cities.length);
  set('mm-stat-avg-price', '$' + avgPrice.toLocaleString());
  set('mm-stat-avg-yield', avgYield + '%');
  set('mm-stat-top-score', mmAffordScore(cities[0]));
}

/* ═══════════════════════════════════════════════════════
   RESULT CARDS  (sidebar — no map dependency)
   ═══════════════════════════════════════════════════════ */
function mmRenderResults(cities) {
  var container = document.getElementById('mm-results-list');
  var countEl   = document.getElementById('mm-results-count');
  if (!container) return;
  if (countEl) countEl.textContent = cities.length;

  if (!cities.length) {
    container.innerHTML = '<div class="mm-empty"><i class="fas fa-search-location"></i>No locations match your filters.<br>Try relaxing some criteria.</div>';
    return;
  }

  var scoreClass = { A:'score-a', B:'score-b', C:'score-c', D:'score-d' };
  container.innerHTML = cities.slice(0, 20).map(function (c, i) {
    var score = mmAffordScore(c);
    return '<div class="mm-result-card" id="mm-rc-' + c.id + '" onclick="mmFocusCity(' + c.id + ')">' +
      '<div class="mm-result-score ' + (scoreClass[c.tier] || 'score-c') + '">#' + (i + 1) + '</div>' +
      '<div class="mm-result-info">' +
        '<div class="mm-result-city">' + c.flag + ' ' + c.city + '</div>' +
        '<div class="mm-result-country">' + c.country + ' &middot; Score ' + score + '</div>' +
      '</div>' +
      '<div><div class="mm-result-price">$' + c.priceM2.toLocaleString() + '</div>' +
      '<div class="mm-result-per">per m&sup2;</div></div>' +
    '</div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════
   MAP MARKERS
   ═══════════════════════════════════════════════════════ */
function mmRenderMarkers(cities) {
  if (!MM.map || !MM.markersLayer || !window.L) return;
  var L = window.L;
  MM.markersLayer.clearLayers();

  cities.forEach(function (c, idx) {
    var score = mmAffordScore(c);
    var size  = Math.min(30 + Math.round(score / 8), 44);
    var icon = L.divIcon({
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -(size + 4)],
      html: '<div class="mm-marker-icon mm-marker-' + c.tier + '" style="width:' + size + 'px;height:' + size + 'px;"><div class="mm-marker-inner">' + c.flag + '</div></div>',
    });
    L.marker([c.lat, c.lng], { icon: icon })
      .addTo(MM.markersLayer)
      .bindPopup(mmBuildPopup(c, score, idx + 1), { maxWidth:300, minWidth:280, className:'mm-popup-wrapper', closeButton:true })
      .on('click', function () { mmHighlightResult(c.id); });
  });
}

/* ═══════════════════════════════════════════════════════
   HEATMAP
   ═══════════════════════════════════════════════════════ */
function mmRenderHeat(cities) {
  if (!MM.map || !window.L || !window.L.heatLayer) return;
  if (MM.heatLayer) MM.map.removeLayer(MM.heatLayer);
  if (!cities.length) return;
  var maxP = Math.max.apply(null, cities.map(function (c) { return c.priceM2; }));
  MM.heatLayer = window.L.heatLayer(
    cities.map(function (c) { return [c.lat, c.lng, c.priceM2 / maxP]; }),
    { radius:35, blur:25, maxZoom:6, max:1.0, gradient:{ 0.2:'#10b981', 0.5:'#f59e0b', 0.8:'#ef4444', 1.0:'#8b5cf6' } }
  );
  if (MM.filters.activeLayer === 'heat') MM.heatLayer.addTo(MM.map);
}

/* ═══════════════════════════════════════════════════════
   POPUP BUILDER
   ═══════════════════════════════════════════════════════ */
function mmBuildPopup(c, score, rank) {
  var tC = { A:'#10b981', B:'#00d4c8', C:'#f59e0b', D:'#ef4444' };
  var tL = { A:'Highly Affordable', B:'Affordable', C:'Moderate', D:'Premium' };
  var col = tC[c.tier] || '#94a3b8';
  var pBuy = Math.round(c.priceM2 * 120).toLocaleString();
  var prox = ['','City Centre','Inner City','Suburbs','Outskirts','Remote'][c.proximity] || '—';
  var yC = c.yoyGrowth >= 0 ? '#10b981' : '#ef4444';
  var yS = c.yoyGrowth >= 0 ? '+' : '';
  var tags =
    (c.electricity ? '<span class="mm-popup-tag tag-cyan"><i class="fas fa-bolt"></i> Electricity</span>' : '<span class="mm-popup-tag tag-red"><i class="fas fa-bolt-slash"></i> No Grid</span>') +
    (c.transport   ? '<span class="mm-popup-tag tag-green"><i class="fas fa-train"></i> Transport</span>'  : '<span class="mm-popup-tag tag-amber"><i class="fas fa-car"></i> Car Needed</span>') +
    (c.schools     ? '<span class="mm-popup-tag tag-violet"><i class="fas fa-school"></i> Schools</span>' : '');

  return '<div class="mm-popup">' +
    '<div class="mm-popup-head">' +
      '<div class="mm-popup-flag">' + c.flag + '</div>' +
      '<div class="mm-popup-city">#' + rank + ' ' + c.city + '</div>' +
      '<div class="mm-popup-country">' + c.country + '</div>' +
      '<div class="mm-popup-score-badge" style="background:' + col + '22;color:' + col + ';border:1px solid ' + col + '44;">' + tL[c.tier] + '</div>' +
    '</div>' +
    '<div class="mm-popup-body">' +
      '<div class="mm-popup-price-row"><span class="mm-popup-price-main">$' + c.priceM2.toLocaleString() + '</span><span class="mm-popup-price-unit">/ m\u00b2</span></div>' +
      '<div class="mm-popup-grid">' +
        '<div class="mm-popup-kv"><div class="mm-popup-kv-label">Afford. Score</div><div class="mm-popup-kv-val" style="color:' + col + '">' + score + '/100</div></div>' +
        '<div class="mm-popup-kv"><div class="mm-popup-kv-label">YoY Growth</div><div class="mm-popup-kv-val" style="color:' + yC + '">' + yS + c.yoyGrowth + '%</div></div>' +
        '<div class="mm-popup-kv"><div class="mm-popup-kv-label">Rent Yield</div><div class="mm-popup-kv-val">' + c.rentYield + '%</div></div>' +
        '<div class="mm-popup-kv"><div class="mm-popup-kv-label">Location</div><div class="mm-popup-kv-val">' + prox + '</div></div>' +
        '<div class="mm-popup-kv"><div class="mm-popup-kv-label">120m\u00b2 Est.</div><div class="mm-popup-kv-val">~$' + pBuy + '</div></div>' +
        '<div class="mm-popup-kv"><div class="mm-popup-kv-label">Type</div><div class="mm-popup-kv-val" style="text-transform:capitalize">' + c.type + '</div></div>' +
      '</div>' +
      '<div class="mm-popup-infra">' + tags + '</div>' +
      '<button class="mm-popup-cta" onclick="mmFlyTo(' + c.lat + ',' + c.lng + ',10)"><i class="fas fa-map-marker-alt"></i> Explore on Map</button>' +
    '</div>' +
  '</div>';
}

/* ═══════════════════════════════════════════════════════
   INTERACTION HELPERS
   ═══════════════════════════════════════════════════════ */
function mmFlyTo(lat, lng, zoom) {
  if (!MM.map) return;
  MM.map.flyTo([lat, lng], zoom || 10, { duration: 1.2, easeLinearity: 0.5 });
}

function mmFocusCity(id) {
  var c = MM_CITIES.find(function (x) { return x.id === id; });
  if (!c) return;
  mmHighlightResult(id);
  if (!MM.map) return;
  MM.map.flyTo([c.lat, c.lng], 8, { duration: 1.0 });
  MM.markersLayer.eachLayer(function (layer) {
    if (!layer.getLatLng) return;
    var ll = layer.getLatLng();
    if (Math.abs(ll.lat - c.lat) < 0.01 && Math.abs(ll.lng - c.lng) < 0.01) layer.openPopup();
  });
}

function mmHighlightResult(id) {
  document.querySelectorAll('.mm-result-card').forEach(function (el) { el.style.background = ''; });
  var el = document.getElementById('mm-rc-' + id);
  if (el) { el.style.background = 'rgba(0,212,200,0.06)'; el.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
}

/* ═══════════════════════════════════════════════════════
   FILTER BINDINGS (called once on first open)
   ═══════════════════════════════════════════════════════ */
function mmBindFilters() {
  function slider(id, valId, transform, key) {
    var s = document.getElementById(id), v = document.getElementById(valId);
    if (!s) return;
    s.addEventListener('input', function () {
      MM.filters[key] = +s.value;
      if (v) v.textContent = transform(+s.value);
    });
  }
  var proxLbls = ['','City Centre','Inner City','Suburbs','Outskirts','All'];
  slider('mm-price-slider','mm-price-val', function(n){ return '$'+n.toLocaleString(); }, 'maxPriceM2');
  slider('mm-yield-slider','mm-yield-val', function(n){ return n.toFixed(1)+'%'; },       'minYield');
  slider('mm-prox-slider', 'mm-prox-val',  function(n){ return proxLbls[n]||'All'; },     'proximityMax');

  ['electricity','transport','schools'].forEach(function (key) {
    var el = document.getElementById('mm-toggle-' + key);
    if (el) el.addEventListener('change', function () { MM.filters[key] = el.checked; });
  });

  document.querySelectorAll('.mm-chip[data-type]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.classList.toggle('active');
      var t = chip.dataset.type;
      MM.filters.types = MM.filters.types.includes(t)
        ? MM.filters.types.filter(function(x){return x!==t;})
        : MM.filters.types.concat(t);
    });
  });

  document.querySelectorAll('.mm-chip[data-tier]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.classList.toggle('active');
      var t = chip.dataset.tier;
      MM.filters.tier = MM.filters.tier.includes(t)
        ? MM.filters.tier.filter(function(x){return x!==t;})
        : MM.filters.tier.concat(t);
    });
  });

  var ab = document.getElementById('mm-apply-btn');
  if (ab) ab.addEventListener('click', mmApplyFilters);

  var rb = document.getElementById('mm-reset-btn');
  if (rb) rb.addEventListener('click', mmResetFilters);

  document.querySelectorAll('.mm-layer-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.mm-layer-btn').forEach(function (b){ b.classList.remove('active'); });
      btn.classList.add('active');
      MM.filters.activeLayer = btn.dataset.layer;
      mmSwitchLayer(btn.dataset.layer);
    });
  });
}

/* ═══════════════════════════════════════════════════════
   LAYER SWITCHER
   ═══════════════════════════════════════════════════════ */
function mmSwitchLayer(layer) {
  if (!MM.map) return;
  if (layer === 'markers') {
    if (MM.heatLayer)  MM.map.removeLayer(MM.heatLayer);
    if (MM.infraLayer) MM.map.removeLayer(MM.infraLayer);
    if (MM.markersLayer) MM.markersLayer.addTo(MM.map);
    mmRenderMarkers(MM.currentCities);
  } else if (layer === 'heat') {
    if (MM.markersLayer) MM.markersLayer.clearLayers();
    if (MM.infraLayer)   MM.map.removeLayer(MM.infraLayer);
    mmRenderHeat(MM.currentCities);
    if (MM.heatLayer) MM.heatLayer.addTo(MM.map);
  } else if (layer === 'infra') {
    if (MM.markersLayer) MM.markersLayer.clearLayers();
    if (MM.heatLayer)    MM.map.removeLayer(MM.heatLayer);
    mmLoadInfraLayer();
  }
}

/* ═══════════════════════════════════════════════════════
   RESET
   ═══════════════════════════════════════════════════════ */
function mmResetFilters() {
  Object.assign(MM.filters, { maxPriceM2:25000, minYield:0, proximityMax:5, electricity:false, transport:false, schools:false, types:[], tier:[] });
  var ps=document.getElementById('mm-price-slider'); if(ps)ps.value=25000;
  var pv=document.getElementById('mm-price-val');    if(pv)pv.textContent='$25,000';
  var ys=document.getElementById('mm-yield-slider'); if(ys)ys.value=0;
  var yv=document.getElementById('mm-yield-val');    if(yv)yv.textContent='0.0%';
  var xs=document.getElementById('mm-prox-slider');  if(xs)xs.value=5;
  var xv=document.getElementById('mm-prox-val');     if(xv)xv.textContent='All';
  ['electricity','transport','schools'].forEach(function(k){ var e=document.getElementById('mm-toggle-'+k); if(e)e.checked=false; });
  document.querySelectorAll('.mm-chip').forEach(function(c){ c.classList.remove('active'); });
  mmApplyFilters();
}

/* ═══════════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════════ */
function mmBindSearch() {
  var input   = document.getElementById('mm-search-input');
  var results = document.getElementById('mm-search-results');
  if (!input || !results) return;

  input.addEventListener('input', function () {
    clearTimeout(MM.searchTimeout);
    var q = input.value.trim();
    if (q.length < 2) { results.style.display='none'; return; }

    var local = MM_CITIES.filter(function(c){
      return c.city.toLowerCase().includes(q.toLowerCase()) || c.country.toLowerCase().includes(q.toLowerCase());
    }).slice(0,5);

    var html = local.map(function(c){
      return '<div class="mm-search-result-item" onclick="mmFocusCity('+c.id+');document.getElementById(\'mm-search-results\').style.display=\'none\';document.getElementById(\'mm-search-input\').value=\''+c.city+'\'">' +
        '<i class="fas fa-map-marker-alt"></i>'+c.flag+' '+c.city+', '+c.country+'</div>';
    }).join('');

    if (html) { results.innerHTML=html; results.style.display='block'; }

    MM.searchTimeout = setTimeout(function(){
      fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q)+'&limit=4')
        .then(function(r){return r.json();})
        .then(function(data){
          var extra = data.filter(function(r){
            var n=r.display_name.split(',')[0].toLowerCase();
            return !local.find(function(c){return c.city.toLowerCase()===n;});
          }).map(function(r){
            var la=parseFloat(r.lat),lo=parseFloat(r.lon),lbl=r.display_name.split(',').slice(0,2).join(',');
            return '<div class="mm-search-result-item" onclick="mmFlyTo('+la+','+lo+',10);document.getElementById(\'mm-search-results\').style.display=\'none\'">'+
              '<i class="fas fa-globe"></i>'+lbl+'</div>';
          }).join('');
          if(extra){results.innerHTML=html+extra;results.style.display='block';}
        }).catch(function(){});
    }, 400);
  });

  document.addEventListener('click', function(e){
    if(!results.contains(e.target)&&e.target!==input) results.style.display='none';
  });
}

/* ═══════════════════════════════════════════════════════
   INFRA LAYER (Overpass API)
   ═══════════════════════════════════════════════════════ */
async function mmLoadInfraLayer() {
  if (!MM.map || !window.L) return;
  var L = window.L;
  if (!MM.infraLayer) MM.infraLayer = L.layerGroup();
  MM.infraLayer.clearLayers();
  MM.infraLayer.addTo(MM.map);

  var b = MM.map.getBounds();
  var bb = b.getSouth()+','+b.getWest()+','+b.getNorth()+','+b.getEast();
  var q = '[out:json][timeout:10];(node["power"="tower"]('+bb+');node["amenity"="school"]('+bb+');node["amenity"="hospital"]('+bb+');node["public_transport"="station"]('+bb+'););out body 60;';
  try {
    var res  = await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:q});
    var data = await res.json();
    var icons={tower:{i:'⚡',l:'Power Tower'},school:{i:'🏫',l:'School'},hospital:{i:'🏥',l:'Hospital'},station:{i:'🚉',l:'Transit'}};
    (data.elements||[]).forEach(function(el){
      var pt = el.tags.power==='tower'?'tower':el.tags.amenity==='school'?'school':el.tags.amenity==='hospital'?'hospital':el.tags.public_transport==='station'?'station':null;
      if(!pt||!el.lat||!el.lon) return;
      var cfg=icons[pt];
      L.marker([el.lat,el.lon],{icon:L.divIcon({className:'',iconSize:[22,22],iconAnchor:[11,11],html:'<div style="font-size:14px;line-height:22px;text-align:center">'+cfg.i+'</div>'})})
        .addTo(MM.infraLayer)
        .bindPopup('<div class="mm-infra-popup"><h4>'+(el.tags.name||cfg.l)+'</h4><p>'+cfg.l+'</p></div>',{className:'mm-popup-wrapper'});
    });
  } catch(e){ mmToast('Infrastructure data unavailable — zoom into a city first.'); }
}

/* ═══════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════ */
function mmToast(msg) {
  var t=document.createElement('div'); t.textContent=msg;
  Object.assign(t.style,{position:'fixed',bottom:'1.5rem',left:'50%',transform:'translateX(-50%)',
    background:'rgba(13,20,36,0.95)',color:'#94a3b8',padding:'0.65rem 1.2rem',borderRadius:'10px',
    fontSize:'0.78rem',zIndex:'99999',border:'1px solid rgba(255,255,255,0.08)',fontFamily:'Outfit,sans-serif',
    boxShadow:'0 8px 30px rgba(0,0,0,0.5)',backdropFilter:'blur(12px)'});
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},3500);
}

/* ═══════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════ */
window.mmInit      = mmInit;
window.mmFlyTo     = mmFlyTo;
window.mmFocusCity = mmFocusCity;
window.MM          = MM;
