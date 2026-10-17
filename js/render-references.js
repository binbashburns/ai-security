function renderReferences(main, state) {
  // Section 1: frameworks, ordered as in frameworks.json.
  const fwItems = state.frameworks
    .map(
      (f) => `
      <li>
        <strong>${escapeHtml(f.name)}</strong>${f.version ? ` (${escapeHtml(f.version)})` : ''} &middot;
        ${externalLink(f.url, f.url)}
        ${f.short_description ? `<div class="card-meta">${escapeHtml(f.short_description)}</div>` : ''}
      </li>`
    )
    .join('');

  // Section 2: extra refs from refs.json (OWASP LLM Top 10, NIST AI 600-1, MITRE ATLAS pages, and similar).
  const extraItems = (state.refs || [])
    .map(
      (r) => `
      <li>
        <strong>${escapeHtml(r.title)}</strong>${r.version ? ` (${escapeHtml(r.version)})` : ''} &middot;
        ${r.url ? externalLink(r.url, r.url) : ''}
        ${r.note ? `<div class="card-meta">${escapeHtml(r.note)}</div>` : ''}
      </li>`
    )
    .join('');

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">Reference</span>
        <h1 class="page-title">References</h1>
        <p class="page-lead">
          Bibliography of every source cited on this site. Each entry links to the canonical, publicly available source.
        </p>
      </header>

      <h2>Frameworks</h2>
      <ul>${fwItems || '<li>No frameworks recorded.</li>'}</ul>

      ${extraItems ? `<h2>Additional sources</h2><ul>${extraItems}</ul>` : ''}
    </div>
  `;
}
