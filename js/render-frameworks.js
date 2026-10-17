function renderFrameworks(main, state) {
  const cards = state.frameworks
    .map((f) => {
      let host = '';
      try {
        host = new URL(f.url).hostname.replace(/^www\./, '');
      } catch (e) {
        host = f.url || '';
      }
      const controlCount = state.controls.filter(
        (c) => c.crosswalk && Object.prototype.hasOwnProperty.call(c.crosswalk, f.id)
      ).length;
      return `
        <a class="card framework-card" href="#/frameworks/${escapeHtml(f.id)}">
          <div class="framework-card-head">
            <div class="framework-card-title">${escapeHtml(f.name)}</div>
            ${f.version ? `<span class="framework-version">${escapeHtml(f.version)}</span>` : ''}
          </div>
          <p class="framework-card-desc">${escapeHtml(f.short_description || '')}</p>
          <div class="framework-card-foot">
            <span class="framework-source" title="${escapeHtml(f.url || '')}">${escapeHtml(host)}</span>
            <span class="framework-count">${
              f.spine
                ? `spine &middot; ${state.controls.length} controls`
                : `${controlCount} control${controlCount === 1 ? '' : 's'}`
            }</span>
          </div>
        </a>
      `;
    })
    .join('');

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">Reference</span>
        <h1 class="page-title">Frameworks</h1>
        <p class="page-lead">
          The frameworks crosswalked across this site. SANS AISMM is the spine. Every other framework cites controls into the same AISMM stage tree, so a single indicator can surface what NIST, ISO, OWASP, CSA, MITRE, or the EU AI Act calls the same thing.
        </p>
      </header>
      <div class="framework-grid">${cards}</div>
    </div>
  `;
}
