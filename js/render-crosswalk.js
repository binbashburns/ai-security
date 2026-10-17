function renderCrosswalk(main, state) {
  const cited = new Set();
  state.controls.forEach((c) => {
    Object.entries(c.crosswalk || {}).forEach(([id, entries]) => {
      if (entries && (!Array.isArray(entries) || entries.length)) cited.add(id);
    });
  });
  const fwOrder = state.frameworks.map((f) => f.id).filter((id) => cited.has(id));
  const fwNameById = Object.fromEntries(state.frameworks.map((f) => [f.id, f.name]));

  const headerCells = fwOrder
    .map((id) => `<th>${escapeHtml(fwNameById[id])}</th>`)
    .join('');

  const rows = state.controls
    .slice()
    .sort((a, b) => a.stage - b.stage || pillarOrder(a.pillar) - pillarOrder(b.pillar) || a.title.localeCompare(b.title))
    .map((c) => {
      const cells = fwOrder
        .map((id) => {
          const entries = c.crosswalk && c.crosswalk[id];
          if (!entries || (Array.isArray(entries) && !entries.length)) return '<td></td>';
          const items = Array.isArray(entries) ? entries : [entries];
          return `<td>${items.map((i) => `<span class="crosswalk-item">${codeToken(i)}</span>`).join('')}</td>`;
        })
        .join('');
      return `
        <tr>
          <td class="stage-cell">${escapeHtml(c.stage)}</td>
          <td><span class="pillar-badge ${pillarClass(c.pillar)}">${escapeHtml(c.pillar)}</span></td>
          <td class="control-title"><a href="#/stages/${escapeHtml(c.stage)}#${escapeHtml(c.id)}">${escapeHtml(c.title)}</a></td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  const body = state.controls.length
    ? `
      <div class="matrix-wrap">
        <table class="matrix">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Pillar</th>
              <th>AISMM control</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
    : '<p>No controls loaded.</p>';

  main.innerHTML = `
    <div class="page page-wide">
      <header class="page-header">
        <span class="page-eyebrow">Reference</span>
        <h1 class="page-title">Crosswalk Matrix</h1>
        <p class="page-lead">
          Every AISMM control on one page, with the cross-framework references in line.
          Each cell shows the framework's terminology for the same control. Empty cell means the framework does not address that control directly, or the mapping has not been added yet.
        </p>
      </header>
      ${body}
    </div>
  `;
}
