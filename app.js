// Boot, data load, vendor-tab state, sidebar rendering, route dispatch.

const DATA_FILES = ['stages', 'controls', 'frameworks', 'vendors', 'refs', 'baselines'];

const state = {
  stages: [],
  controls: [],
  frameworks: [],
  vendors: [],
  refs: [],
  baselines: null,
  activeVendor: null,
};

const VENDOR_STORAGE_KEY = 'ai-security:active-vendor';
const LAST_STAGE_KEY = 'ai-security:last-stage';

// Routes can carry an in-page anchor after a second '#', e.g.
// #/stages/3#AISMM-3-PROTECT-NHI or #/baselines/cursor#CU-5.1.
function splitRoute(hash) {
  const raw = hash || '#/';
  const idx = raw.indexOf('#', 1);
  if (idx === -1) return { route: raw, anchor: null };
  return { route: raw.slice(0, idx), anchor: decodeURIComponent(raw.slice(idx + 1)) };
}

function scrollToAnchor(anchor) {
  if (!anchor) return false;
  const el = document.getElementById(anchor);
  if (!el) return false;
  // A level filter on baseline pages can hide the target; show everything first.
  if (el.hidden) {
    document.querySelector('.level-filter-btn[data-filter="all"]')?.click();
  }
  el.scrollIntoView({ block: 'start' });
  el.classList.add('anchor-flash');
  setTimeout(() => el.classList.remove('anchor-flash'), 1600);
  return true;
}

function isStageRoute(route) {
  return /^#\/stages\/\d+$/.test(route || '');
}

function trackLastStage(route) {
  const m = (route || '').match(/^#\/stages\/(\d+)$/);
  if (m) sessionStorage.setItem(LAST_STAGE_KEY, m[1]);
}

function setStatus(message, kind) {
  const main = document.getElementById('main');
  if (!main) return;
  main.innerHTML = `<div class="page"><div class="status-banner${kind === 'error' ? ' error' : ''}">${message}</div></div>`;
}

async function loadData() {
  const results = await Promise.all(
    DATA_FILES.map((name) =>
      fetch(`data/${name}.json`, { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error(`${name}.json: HTTP ${r.status}`);
        return r.json();
      })
    )
  );
  results.forEach((value, i) => {
    state[DATA_FILES[i]] = value;
  });
}

function getActiveVendor() {
  if (state.activeVendor && state.vendors.some((v) => v.id === state.activeVendor)) {
    return state.activeVendor;
  }
  const stored = sessionStorage.getItem(VENDOR_STORAGE_KEY);
  if (stored && state.vendors.some((v) => v.id === stored)) {
    state.activeVendor = stored;
    return stored;
  }
  const fallback = state.vendors.find((v) => v.default) || state.vendors[0];
  state.activeVendor = fallback ? fallback.id : null;
  return state.activeVendor;
}

function setActiveVendor(id) {
  if (!state.vendors.some((v) => v.id === id)) return;
  state.activeVendor = id;
  sessionStorage.setItem(VENDOR_STORAGE_KEY, id);
  renderVendorTabs();

  // Vendor tabs only have a visible effect on stage pages (where vendor blocks
  // render). On any other page, navigate to the last-viewed stage (or Stage 1)
  // so the click produces visible feedback.
  const { route } = splitRoute(location.hash);
  if (!isStageRoute(route)) {
    const lastStage = sessionStorage.getItem(LAST_STAGE_KEY) || '1';
    location.hash = `#/stages/${lastStage}`;
    return;
  }
  dispatchRoute();
}

function renderVendorTabs() {
  const host = document.getElementById('vendor-tabs');
  if (!host) return;
  const active = getActiveVendor();
  document.body.setAttribute('data-vendor', active || '');
  host.innerHTML = state.vendors
    .map(
      (v) =>
        `<button type="button" class="vendor-tab${v.id === active ? ' active' : ''}" data-vendor="${v.id}" title="${escapeAttr(v.summary || v.label)}">${v.label}</button>`
    )
    .join('');
  host.querySelectorAll('.vendor-tab').forEach((btn) => {
    btn.addEventListener('click', () => setActiveVendor(btn.dataset.vendor));
  });
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderSidebar(route) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const isActive = (path) => (route === path ? ' active' : '');
  const isStageActive = (n) => (route === `#/stages/${n}` ? ' active' : '');

  const stageLinks = state.stages
    .slice()
    .sort((a, b) => a.stage - b.stage)
    .map(
      (s) => `
      <a class="nav-link${isStageActive(s.stage)}" href="#/stages/${s.stage}">
        <span class="nav-num">${s.stage}</span>
        <span>${s.title}</span>
      </a>`
    )
    .join('');

  sidebar.innerHTML = `
    <div class="sidebar-section">Overview</div>
    <a class="nav-link${isActive('#/') || isActive('') ? ' active' : ''}" href="#/">
      <span class="nav-icon"><i class="ph ph-house"></i></span>
      <span>Home</span>
    </a>

    <div class="sidebar-section">AISMM Stages</div>
    ${stageLinks}

    ${renderBaselineNav(route)}

    <div class="sidebar-section">Reference</div>
    <a class="nav-link${isActive('#/frameworks')}" href="#/frameworks">
      <span class="nav-icon"><i class="ph ph-stack"></i></span>
      <span>Frameworks</span>
    </a>
    <a class="nav-link${isActive('#/crosswalk')}" href="#/crosswalk">
      <span class="nav-icon"><i class="ph ph-grid-four"></i></span>
      <span>Crosswalk Matrix</span>
    </a>
    <a class="nav-link${isActive('#/refs')}" href="#/refs">
      <span class="nav-icon"><i class="ph ph-book-open"></i></span>
      <span>References</span>
    </a>
  `;
}

function renderBaselineNav(route) {
  const data = state.baselines;
  if (!data || !data.tools || !data.tools.length) return '';
  const toolLinks = data.tools
    .map(
      (t) => `
      <a class="nav-link nav-sub${route === `#/baselines/${t.id}` ? ' active' : ''}" href="#/baselines/${t.id}">
        <span>${t.label}</span>
      </a>`
    )
    .join('');
  return `
    <div class="sidebar-section">Tool Baselines</div>
    <a class="nav-link${route === '#/baselines' ? ' active' : ''}" href="#/baselines">
      <span class="nav-icon"><i class="ph ph-sliders-horizontal"></i></span>
      <span>Overview</span>
    </a>
    ${toolLinks}
  `;
}

function dispatchRoute() {
  const { route, anchor } = splitRoute(location.hash);
  trackLastStage(route);
  renderSidebar(route);
  closeSidebar();

  const main = document.getElementById('main');
  if (!main) return;

  // #/stages/N
  const stageMatch = route.match(/^#\/stages\/(\d+)$/);
  if (stageMatch) {
    const stageNum = Number(stageMatch[1]);
    renderStage(main, state, stageNum, getActiveVendor());
    finishRender(main, anchor);
    return;
  }

  // #/baselines/TOOL
  const baselineMatch = route.match(/^#\/baselines\/([a-z0-9_-]+)$/i);
  if (baselineMatch) {
    renderBaselineTool(main, state, baselineMatch[1]);
    finishRender(main, anchor);
    return;
  }

  // #/frameworks/ID
  const fwMatch = route.match(/^#\/frameworks\/([a-z0-9_-]+)$/i);
  if (fwMatch) {
    renderFrameworkDetail(main, state, fwMatch[1]);
    finishRender(main, anchor);
    return;
  }

  switch (route) {
    case '#/frameworks':
      renderFrameworks(main, state);
      break;
    case '#/crosswalk':
      renderCrosswalk(main, state);
      break;
    case '#/refs':
      renderReferences(main, state);
      break;
    case '#/baselines':
      renderBaselines(main, state);
      break;
    case '#/':
    case '':
    default:
      renderHome(main, state);
  }

  finishRender(main, anchor);
}

function finishRender(main, anchor) {
  main.focus({ preventScroll: true });
  if (!scrollToAnchor(anchor)) window.scrollTo(0, 0);
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.hidden = false;
    backdrop.classList.add('show');
  }
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.classList.remove('show');
    backdrop.hidden = true;
  }
}

async function init() {
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar?.classList.contains('open')) closeSidebar();
    else openSidebar();
  });
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

  try {
    await loadData();
  } catch (err) {
    setStatus(
      `Failed to load site data: <code>${err.message}</code>. If you are running this locally, serve the directory with a static server (for example <code>python3 -m http.server</code>) so that <code>fetch()</code> calls succeed. <code>file://</code> URLs are blocked by most browsers.`,
      'error'
    );
    return;
  }

  renderVendorTabs();
  window.addEventListener('hashchange', dispatchRoute);
  dispatchRoute();
}

document.addEventListener('DOMContentLoaded', init);
