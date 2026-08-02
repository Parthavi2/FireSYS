// ==========================================================
// FireSYS — shared auth/client utilities
// ==========================================================
const API_BASE = '/api';

/* ---------- Theme (light/dark) ---------- */
function initTheme() {
  const saved = localStorage.getItem('firesys_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = saved ? saved === 'dark' : prefersDark;
  document.body.classList.toggle('dark', useDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('firesys_theme', isDark ? 'dark' : 'light');
}

/* ---------- Toasts ---------- */
function ensureToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

const TOAST_ICONS = {
  success: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" d="M22 4 12 14.01l-3-3"/></svg>',
  danger: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/></svg>',
  info: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 16v-4M12 8h.01"/></svg>',
};

function showToast(message, type = 'info', duration = 4200) {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.info}<span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/* ---------- Field validation UI ---------- */
function setFieldError(fieldEl, message) {
  const errorEl = fieldEl.querySelector('.field-error');
  if (errorEl) errorEl.querySelector('span').textContent = message;
  fieldEl.classList.add('has-error');
}
function clearFieldError(fieldEl) {
  fieldEl.classList.remove('has-error');
}

/* ---------- Button loading state ---------- */
function setButtonLoading(btn, loading, loadingText = 'Please wait…') {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

/* ---------- API calls ---------- */
async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function saveSession(token, user) {
  localStorage.setItem('firesys_token', token);
  localStorage.setItem('firesys_user', JSON.stringify(user));
}

function getSession() {
  const token = localStorage.getItem('firesys_token');
  const userRaw = localStorage.getItem('firesys_user');
  if (!token || !userRaw) return null;
  try { return { token, user: JSON.parse(userRaw) }; } catch (_) { return null; }
}

function clearSession() {
  localStorage.removeItem('firesys_token');
  localStorage.removeItem('firesys_user');
}

function dashboardPathForRole(role) {
  switch (role) {
    case 'Admin': return 'dashboard-admin.html';
    case 'Dispatcher': return 'dashboard-dispatcher.html';
    case 'Firefighter': return 'dashboard-firefighter.html';
    default: return 'login.html';
  }
}

async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveSession(data.token, data.user);
  return data.user;
}

async function registerFirefighter(payload) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  saveSession(data.token, data.user);
  return data.user;
}

async function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

async function resetPassword(token, password) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/* ---------- Password visibility toggle ---------- */
function wirePasswordToggle(toggleBtn, inputEl) {
  toggleBtn.addEventListener('click', () => {
    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword
      ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-7.5a13.16 13.16 0 0 1 3.06-4.44M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 7.5a13.14 13.14 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path stroke-linecap="round" d="M1 1l22 22"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
  if (window.lucide) window.lucide.createIcons();
});
