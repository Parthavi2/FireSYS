// ==========================================================
// FireSYS — dashboard shell utilities (auth guard, nav, API)
// ==========================================================

const NAV_BY_ROLE = {
  Admin: [
    { label: 'Overview', icon: 'layout-dashboard', href: 'dashboard-admin.html' },
    { label: 'Users', icon: 'users', href: 'admin-users.html' },
    { label: 'Firefighters', icon: 'flame', href: 'admin-firefighters.html' },
    { label: 'Trucks', icon: 'truck', href: 'admin-trucks.html' },
    { label: 'Stations', icon: 'building-2', href: 'admin-stations.html' },
    { label: 'Incidents', icon: 'siren', href: 'admin-incidents.html' },
    { label: 'Maintenance', icon: 'wrench', href: 'admin-maintenance.html' },
    { label: 'Analytics', icon: 'bar-chart-3', href: 'admin-analytics.html' },
  ],
  Dispatcher: [
    { label: 'Overview', icon: 'layout-dashboard', href: 'dashboard-dispatcher.html' },
    { label: 'Active incidents', icon: 'siren', href: 'dispatcher-incidents.html' },
    { label: 'Trucks', icon: 'truck', href: 'dispatcher-trucks.html' },
    { label: 'Firefighters', icon: 'flame', href: 'dispatcher-firefighters.html' },
  ],
  Firefighter: [
    { label: 'My incidents', icon: 'layout-dashboard', href: 'dashboard-firefighter.html' },
    { label: 'Profile', icon: 'user', href: 'firefighter-profile.html' },
  ],
};

// Redirects to login if there's no valid session, or to the correct
// dashboard if the signed-in role doesn't match this page. Call this
// first thing on every protected page.
function requireAuth(expectedRole) {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  if (expectedRole && session.user.role !== expectedRole) {
    window.location.href = dashboardPathForRole(session.user.role);
    return null;
  }
  return session;
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

function renderShell({ session, activeHref, pageTitle, pageSubtitle }) {
  const nav = NAV_BY_ROLE[session.user.role] || [];
  const navHtml = nav.map((item) => `
    <a href="${item.href}" class="sidebar-link ${item.href === activeHref ? 'active' : ''}">
      <i data-lucide="${item.icon}" class="icon"></i> ${item.label}
    </a>
  `).join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="auth-brand-mark" style="width:34px;height:34px;"><i data-lucide="flame" class="icon" style="width:18px;height:18px;"></i></div>
          <div>
            <div class="sidebar-brand-name">FireSYS</div>
            <div class="sidebar-brand-role">${session.user.role} Console</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Workspace</div>
          ${navHtml}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">${initials(session.user.name)}</div>
            <div>
              <div class="sidebar-user-name">${session.user.name}</div>
              <div class="sidebar-user-role">${session.user.email}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-block" id="logoutBtn" style="margin-top:8px; justify-content:flex-start;">
            <i data-lucide="log-out" class="icon"></i> Sign out
          </button>
        </div>
      </aside>

      <div class="main-col">
        <header class="topbar">
          <div style="display:flex; align-items:center; gap:14px;">
            <button class="btn-icon sidebar-toggle" id="sidebarToggle" aria-label="Toggle menu"><i data-lucide="menu" class="icon"></i></button>
            <div>
              <div class="topbar-title">${pageTitle}</div>
            </div>
          </div>
          <div class="topbar-actions">
            <div class="search-bar"><i data-lucide="search" class="icon" style="width:15px;height:15px;"></i><input type="text" placeholder="Search…"></div>
            <button class="theme-toggle" data-theme-toggle aria-label="Toggle dark mode">
              <i data-lucide="sun" class="icon icon-sun"></i>
              <i data-lucide="moon" class="icon icon-moon"></i>
            </button>
          </div>
        </header>
        <main class="page-content" id="pageContent">
          <div class="page-header">
            <div>
              <h1>${pageTitle}</h1>
              ${pageSubtitle ? `<p>${pageSubtitle}</p>` : ''}
            </div>
            <div class="page-header-actions" id="pageHeaderActions"></div>
          </div>
          <div id="pageBody"></div>
        </main>
      </div>
    </div>
  `);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'login.html';
  });
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

// Authenticated fetch — attaches the bearer token and handles 401s by
// bouncing back to login (expired/invalid session).
async function apiAuth(path, options = {}) {
  const session = getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (res.status === 401) {
    clearSession();
    window.location.href = 'login.html';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function skeletonRows(cols, rows = 4) {
  return Array.from({ length: rows }).map(() => `
    <tr class="skeleton-row">${Array.from({ length: cols }).map(() => `<td><div class="skeleton skeleton-text"></div></td>`).join('')}</tr>
  `).join('');
}
