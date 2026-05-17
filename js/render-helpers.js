// Shared helpers used by every render-*.js file. Loaded before them.

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

function externalLink(url, label) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label || url);
  return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
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
  if (vendorBlock && (vendorBlock.summary || (vendorBlock.links && vendorBlock.links.length))) {
    const vendor = vendorById(state, activeVendor);
    const summary = vendorBlock.summary ? `<p>${inlineCode(vendorBlock.summary)}</p>` : '';
    const links =
      vendorBlock.links && vendorBlock.links.length
        ? `<ul class="vendor-links">${vendorBlock.links
            .map((l) => `<li>${externalLink(l.url, l.label)}</li>`)
            .join('')}</ul>`
        : '';
    parts.push(`
      <div class="vendor-block">
        <span class="block-label">${escapeHtml(vendor ? vendor.label : activeVendor)} implementation</span>
        ${summary}
        ${links}
      </div>
    `);
  }

  if (!parts.length) return '';
  return `<div class="indicator-extras">${parts.join('')}</div>`;
}
