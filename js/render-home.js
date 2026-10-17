function renderHome(main, state) {
  const stageCards = state.stages
    .slice()
    .sort((a, b) => a.stage - b.stage)
    .map(
      (s) => `
      <a class="card" href="#/stages/${s.stage}" style="text-decoration:none;display:block;">
        <div class="card-meta">Stage ${s.stage}</div>
        <div class="card-title">${escapeHtml(s.title)}</div>
        <p style="margin:0;">${escapeHtml(s.tagline || '')}</p>
      </a>`
    )
    .join('');

  const stageGrid = stageCards
    ? `<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">${stageCards}</div>`
    : '<p>No stage data loaded yet.</p>';

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">Reference site</span>
        <h1 class="page-title">AI Security: a practitioner reference</h1>
        <p class="page-lead">
          A working reference for AI security, organized around the SANS AI Security Maturity Model (AISMM).
          Each stage's indicators are mapped to the OWASP AI Exchange, NIST AI RMF, ISO/IEC 42001, CSA AICM, and Forrester AEGIS.
          The vendor tabs at the top change which implementation guidance is surfaced alongside the controls.
        </p>
      </header>

      <h2>How to use this site</h2>
      <ol>
        <li>Pick the AISMM stage that matches your current evidence in the left sidebar.</li>
        <li>Read the description, indicators, and "Steps to the Next Level" for that stage.</li>
        <li>Choose a vendor tab in the topbar to surface implementation guidance and links for the controls on the current page.</li>
        <li>Use the <a href="#/crosswalk">Crosswalk Matrix</a> to see how every control maps across frameworks at once.</li>
      </ol>

      <h2>Tool baselines</h2>
      <p>
        CIS has no Benchmark for enterprise AI tools. The <a href="#/baselines">Tool Baselines</a> section fills that gap for Claude Code, Claude Enterprise / Team, Cursor, and GitHub Copilot:
        exact settings, values, and audit steps in a CIS Benchmark layout, keyed to eight cross-vendor primitives and mapped to CIS Controls v8.1 Safeguards and AISMM indicators.
      </p>

      <h2>Who this is for</h2>
      <p>
        Security engineers, AI platform owners, GRC and compliance teams trying to operationalize a maturity model rather than read another vendor whitepaper.
        Direct answers, framework citations, and links to canonical vendor documentation. No scoring calculator, no marketing voice.
      </p>

      <h2>Stages at a glance</h2>
      ${stageGrid}

      <h2>Source documents</h2>
      <p>
        Every framework cites its canonical, publicly available source. See the <a href="#/refs">References</a> page for the full bibliography.
      </p>
    </div>
  `;
}
