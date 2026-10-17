// Shared helpers used by every render-*.js file. Loaded before them.

// Inline icon set. The site previously pulled Phosphor Icons from a CDN, which
// was the only third-party runtime dependency and the only reason the page
// needed a loosened CSP. These are drawn locally, so the page is self-contained.
const ICONS = {
  list: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  shield: '<path d="M12 3.2 19 6v5.4c0 4.2-2.9 7.7-7 8.6-4.1-.9-7-4.4-7-8.6V6l7-2.8z"/><path d="M9 12.1l2.1 2.1L15.2 10"/>',
  house: '<path d="M4 10.6 12 4.2l8 6.4V19a1.4 1.4 0 0 1-1.4 1.4h-3.4v-6H8.8v6H5.4A1.4 1.4 0 0 1 4 19z"/>',
  stack: '<path d="M4.6 4.6h14.8v4.2H4.6zM4.6 11.2h14.8v3.4H4.6zM4.6 17h14.8v2.4H4.6z"/>',
  grid: '<path d="M4.4 4.4h6.2v6.2H4.4zM13.4 4.4h6.2v6.2h-6.2zM4.4 13.4h6.2v6.2H4.4zM13.4 13.4h6.2v6.2h-6.2z"/>',
  book: '<path d="M12 6.6C10.4 5.1 8.4 4.6 4 4.6v13c4.4 0 6.4.5 8 2 1.6-1.5 3.6-2 8-2v-13c-4.4 0-6.4.5-8 2z"/><path d="M12 6.6v14"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};

// Returns an inline SVG for one of the ICONS keys. Decorative by default: the
// accessible name comes from the adjacent text label.
function icon(name) {
  const path = ICONS[name];
  if (!path) return '';
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render prose with backtick spans rewritten to <code>. Everything else is
// HTML-escaped. Use for fields where authors may surround technical tokens
// (IAM actions, hashtags, identifiers) with backticks.
function inlineCode(str) {
  if (str === null || str === undefined) return '';
  const parts = String(str).split('`');
  return parts
    .map((part, i) => (i % 2 === 1 ? `<code>${escapeHtml(part)}</code>` : escapeHtml(part)))
    .join('');
}

// Render a single crosswalk value as <code>. Crosswalk entries are always
// structured identifiers (#MONITOR USE, MAP 4.1, A.6.2.3, AML.T0051) and
// belong in mono.
function codeToken(value) {
  return `<code>${escapeHtml(value)}</code>`;
}

// Every outbound link in the data files goes through here. Only http(s) reaches
// an href, so a stray javascript: or data: URL degrades to plain text rather than
// becoming script execution.
function externalLink(url, label) {
  const safeLabel = escapeHtml(label || url);
  const raw = String(url || '');
  if (!/^https?:\/\//i.test(raw)) return safeLabel;
  return `<a href="${escapeHtml(raw)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
}

function frameworkById(state, id) {
  return state.frameworks.find((f) => f.id === id);
}

function vendorById(state, id) {
  return state.vendors.find((v) => v.id === id);
}

function controlsByStage(state, stage) {
  return state.controls.filter((c) => c.stage === stage);
}

function pillarOrder(pillar) {
  const order = { Protect: 0, Utilize: 1, Govern: 2 };
  return order[pillar] ?? 99;
}

function pillarClass(pillar) {
  return String(pillar || '').toLowerCase();
}

// Render a single control's crosswalk + active-vendor implementation.
// Hides the vendor block entirely if the active vendor has no entry.
function renderControlExtras(control, state, activeVendor) {
  const parts = [];

  if (control.crosswalk && Object.keys(control.crosswalk).length > 0) {
    const rows = Object.entries(control.crosswalk)
      .map(([fwId, entries]) => {
        const fw = frameworkById(state, fwId);
        const name = fw ? fw.name : fwId;
        const items = Array.isArray(entries) ? entries : [entries];
        return `<dt>${escapeHtml(name)}</dt><dd>${items.map(codeToken).join(' ')}</dd>`;
      })
      .join('');
    parts.push(`
      <div class="crosswalk-block">
        <span class="block-label">Crosswalk</span>
        <dl class="crosswalk-list">${rows}</dl>
      </div>
    `);
  }

  const vendorBlock = control.vendor_implementation && control.vendor_implementation[activeVendor];
  const vendor = vendorById(state, activeVendor);
  const vendorLabel = escapeHtml(vendor ? vendor.label : activeVendor);
  if (vendorBlock && (vendorBlock.summary || (vendorBlock.links && vendorBlock.links.length))) {
    const summary = vendorBlock.summary ? `<p>${inlineCode(vendorBlock.summary)}</p>` : '';
    const links =
      vendorBlock.links && vendorBlock.links.length
        ? `<ul class="vendor-links">${vendorBlock.links
            .map((l) => `<li>${externalLink(l.url, l.label)}</li>`)
            .join('')}</ul>`
        : '';
    parts.push(`
      <div class="vendor-block">
        <span class="block-label">${vendorLabel} implementation</span>
        ${summary}
        ${links}
      </div>
    `);
  } else if (activeVendor) {
    parts.push(`
      <div class="vendor-block empty">
        <span class="block-label">${vendorLabel} implementation</span>
        <p class="vendor-empty">No ${vendorLabel} guidance recorded for this control yet.</p>
      </div>
    `);
  }

  if (!parts.length) return '';
  return `<div class="indicator-extras">${parts.join('')}</div>`;
}
