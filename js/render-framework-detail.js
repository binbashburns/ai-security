function renderFrameworkDetail(main, state, id) {
  const fw = frameworkById(state, id);
  if (!fw) {
    main.innerHTML = `
      <div class="page">
        <div class="status-banner error">Unknown framework: <code>${escapeHtml(id)}</code>.</div>
        <p><a href="#/frameworks">Back to frameworks</a></p>
      </div>
    `;
    return;
  }

  const citingControls = state.controls.filter(
    (c) => c.crosswalk && Object.prototype.hasOwnProperty.call(c.crosswalk, id)
  );

  const citingRows = citingControls
    .map((c) => {
      const entries = c.crosswalk[id];
      const items = Array.isArray(entries) ? entries : [entries];
      return `
        <tr>
          <td class="stage-cell">${escapeHtml(c.stage)}</td>
          <td class="control-title"><a href="#/stages/${escapeHtml(c.stage)}#${escapeHtml(c.id)}">${escapeHtml(c.title)}</a></td>
          <td>${items.map(codeToken).join(' ')}</td>
        </tr>
      `;
    })
    .join('');

  const citingTable = citingControls.length
    ? `
      <div class="matrix-wrap">
        <table class="matrix">
          <thead><tr><th>Stage</th><th>AISMM control</th><th>${escapeHtml(fw.name)} reference</th></tr></thead>
          <tbody>${citingRows}</tbody>
        </table>
      </div>
    `
    : '<p>No AISMM controls currently cite this framework. Add a <code>crosswalk</code> entry in <code>data/controls.json</code> to surface mappings here.</p>';

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">Framework</span>
        <h1 class="page-title">${escapeHtml(fw.name)}</h1>
        ${fw.version ? `<p class="page-lead">${escapeHtml(fw.version)}</p>` : ''}
      </header>

      <p>${escapeHtml(fw.short_description || '')}</p>

      <h2>Canonical source</h2>
      <ul>
        <li>${externalLink(fw.url, fw.url)}</li>
      </ul>

      <h2>AISMM controls citing this framework</h2>
      ${citingTable}

      <p style="margin-top:18px;"><a href="#/frameworks">All frameworks</a> &middot; <a href="#/crosswalk">Crosswalk Matrix</a></p>
    </div>
  `;
}
