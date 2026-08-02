// ============================================
//  FIRESYS — SHARED LAYOUT & UTILITIES
// ============================================

// --- SIDEBAR HTML ---
function getSidebar(activePage) {
  const pages = [
    { href: 'dashboard.html',    icon: '⬛', label: 'Dashboard',    key: 'dashboard' },
    { href: 'incidents.html',    icon: '🚨', label: 'Incidents',    key: 'incidents' },
    { href: 'dispatch.html',     icon: '📡', label: 'Dispatch',     key: 'dispatch' },
    { href: 'firefighters.html', icon: '👷', label: 'Firefighters', key: 'firefighters' },
  ];

  const links = pages.map(p => `
    <a href="${p.href}" class="${activePage === p.key ? 'active' : ''}">
      <span class="nav-icon">${p.icon}</span>
      ${p.label}
      <span class="nav-arrow">›</span>
    </a>
  `).join('');

  return `
    <div class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🔥</span>
        <span class="brand-name">FireSys</span>
        <span class="brand-sub">Emergency Dispatch</span>
      </div>
      <div class="sidebar-status">
        <div class="status-dot"></div>
        <span class="status-text">SYSTEM ONLINE</span>
      </div>
      <nav class="sidebar-nav">
        <span class="nav-label">Navigation</span>
        ${links}
      </nav>
      <div class="sidebar-footer">
        <span class="time-display" id="sidebarTime">--:--:--</span>
        <span class="date-display" id="sidebarDate">---</span>
      </div>
    </div>
  `;
}

// --- TOPBAR HTML ---
function getTopbar(title, alertText) {
  return `
    <div class="topbar">
      <div class="topbar-left">
        <span class="page-title">${title}</span>
      </div>
      <div class="topbar-right">
        ${alertText ? `<div class="topbar-badge"><div class="dot"></div>${alertText}</div>` : ''}
        <button class="btn btn-danger btn-sm" onclick="logout()">✕ Logout</button>
      </div>
    </div>
  `;
}

// --- CLOCK ---
function startClock() {
  function tick() {
    const now = new Date();
    const t = now.toLocaleTimeString('en-GB', { hour12: false });
    const d = now.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: '2-digit' });
    const tEl = document.getElementById('sidebarTime');
    const dEl = document.getElementById('sidebarDate');
    if (tEl) tEl.textContent = t;
    if (dEl) dEl.textContent = d.toUpperCase();
  }
  tick();
  setInterval(tick, 1000);
}

// --- AUTH ---
function logout() {
  window.location.href = 'index.html';
}

// --- BADGE CLASS HELPERS ---
function statusBadge(status) {
  const map = {
    'Active':       'badge-active',
    'In Progress':  'badge-progress',
    'Resolved':     'badge-resolved',
    'Available':    'badge-available',
    'Busy':         'badge-busy',
    'Standby':      'badge-standby',
  };
  const cls = map[status] || 'badge-standby';
  return `<span class="badge ${cls}">${status}</span>`;
}

function severityBadge(sev) {
  const map = {
    'Critical': 'badge-critical',
    'High':     'badge-high',
    'Medium':   'badge-medium',
    'Low':      'badge-low',
  };
  const cls = map[sev] || 'badge-medium';
  return `<span class="badge ${cls}">${sev || '—'}</span>`;
}

// --- API BASE ---
const API = 'http://localhost:5000/api';

async function apiFetch(path, opts) {
  try {
    const res = await fetch(API + path, opts);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('API unreachable — using demo data');
    return null;
  }
}

// --- DEMO DATA (used when backend is offline) ---
const DEMO = {
  incidents: [
    { id: 1, location: 'MG Road, Sector 12', type: 'Structure Fire', status: 'Active',      severity: 'Critical' },
    { id: 2, location: 'Kalyani Nagar',       type: 'Vehicle Fire',   status: 'In Progress', severity: 'High' },
    { id: 3, location: 'Hadapsar Plant',      type: 'Chemical Fire',  status: 'Active',      severity: 'Critical' },
    { id: 4, location: 'FC Road',             type: 'Grass Fire',     status: 'Resolved',    severity: 'Low' },
    { id: 5, location: 'Baner Highway',       type: 'Vehicle Fire',   status: 'In Progress', severity: 'Medium' },
  ],
  firefighters: [
    { id: 1, name: 'Rajesh Patil',   status: 'Available' },
    { id: 2, name: 'Suresh Kamble',  status: 'Busy' },
    { id: 3, name: 'Amit Desai',     status: 'Available' },
    { id: 4, name: 'Priya Sharma',   status: 'Standby' },
    { id: 5, name: 'Vikram Jadhav',  status: 'Busy' },
  ],
  trucks: [
    { id: 1, name: 'TRK-001', status: 'Available' },
    { id: 2, name: 'TRK-002', status: 'Busy' },
    { id: 3, name: 'TRK-003', status: 'Available' },
    { id: 4, name: 'TRK-004', status: 'Standby' },
  ],
};
