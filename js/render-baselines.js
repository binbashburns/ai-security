// Enterprise AI tool baselines: CIS Benchmark-style settings per tool, keyed to
// eight cross-vendor control primitives. Data lives in data/baselines.json.

const BASELINE_LEVEL_KEY = 'ai-security:baseline-level';

function baselineData(state) {
  return state.baselines || { primitives: [], tools: [], recommendations: [], cis_safeguards: {}, companion_guides: {} };
}

function baselineToolById(state, id) {
  return baselineData(state).tools.find((t) => t.id === id);
}

function baselinePrimitiveById(state, id) {
  return baselineData(state).primitives.find((p) => p.id === id);
}

function baselineRecs(state, toolId, primitiveId) {
  return baselineData(state).recommendations.filter(
    (r) => (!toolId || r.tool === toolId) && (!primitiveId || r.primitive === primitiveId)
  );
}

function cisSafeguardTokens(state, ids) {
  const titles = baselineData(state).cis_safeguards || {};
  return (ids || [])
    .map((id) => `<code title="${escapeHtml(titles[id] || '')}">${escapeHtml(id)}</code>`)
    .join(' ');
}

function cisSafeguardList(state, ids) {
  const titles = baselineData(state).cis_safeguards || {};
  return (ids || [])
    .map((id) => `<li><code>${escapeHtml(id)}</code> ${escapeHtml(titles[id] || '')}</li>`)
    .join('');
}

function aismmLinks(state, ids) {
  return (ids || [])
    .map((id) => {
      const c = state.controls.find((x) => x.id === id);
      if (!c) return `<code>${escapeHtml(id)}</code>`;
      return `<a href="#/stages/${escapeHtml(c.stage)}#${escapeHtml(c.id)}" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</a> <span class="card-meta">(Stage ${escapeHtml(c.stage)})</span>`;
    })
    .map((html) => `<li>${html}</li>`)
    .join('');
}

function guideLinks(state, keys) {
  const guides = baselineData(state).companion_guides || {};
  return (keys || [])
    .map((k) => (guides[k] ? externalLink(guides[k].url, guides[k].label) : ''))
    .filter(Boolean)
    .join(' &middot; ');
}

function levelBadge(level) {
  return `<span class="level-badge level-${escapeHtml(level)}">L${escapeHtml(level)}</span>`;
}

function assessmentBadge(assessment) {
  return `<span class="assess-badge">${escapeHtml(assessment === 'automated' ? 'Automated' : 'Manual')}</span>`;
}

// ---------------------------------------------------------------- Overview page

function renderBaselines(main, state) {
  const data = baselineData(state);
  const meta = data.meta || {};

  const toolCards = data.tools
    .map((t) => {
      const recs = baselineRecs(state, t.id);
      const l1 = recs.filter((r) => r.level === 1).length;
      const l2 = recs.length - l1;
      return `
        <a class="card tool-card" href="#/baselines/${escapeHtml(t.id)}">
          <div class="card-meta">${escapeHtml(t.vendor)}</div>
          <div class="card-title">${escapeHtml(t.label)}</div>
          <p class="tool-card-stats">${recs.length} recommendations &middot; ${l1} Level 1 &middot; ${l2} Level 2</p>
        </a>`;
    })
    .join('');

  const headerCells = data.tools
    .map((t) => `<th><a href="#/baselines/${escapeHtml(t.id)}">${escapeHtml(t.label)}</a></th>`)
    .join('');

  const matrixRows = data.primitives
    .map((p) => {
      const cells = data.tools
        .map((t) => {
          const recs = baselineRecs(state, t.id, p.id);
          if (!recs.length) {
            const gap = t.gaps && t.gaps[p.id];
            return `<td><span class="gap-token" title="${escapeHtml(gap || 'No vendor control documented')}">Gap</span></td>`;
          }
          return `<td>${recs
            .map(
              (r) =>
                `<a class="crosswalk-item" href="#/baselines/${escapeHtml(t.id)}#${escapeHtml(r.id)}" title="${escapeHtml(r.title)}"><code>${escapeHtml(r.id)}</code></a>`
            )
            .join('')}</td>`;
        })
        .join('');
      return `
        <tr>
          <td class="stage-cell">${escapeHtml(p.num)}</td>
          <td class="control-title"><a href="#/baselines#primitive-${escapeHtml(p.id)}">${escapeHtml(p.title)}</a></td>
          <td>${cisSafeguardTokens(state, p.cis)}</td>
          ${cells}
        </tr>`;
    })
    .join('');

  const primitiveSections = data.primitives
    .map(
      (p) => `
      <article class="indicator-item primitive-item" id="primitive-${escapeHtml(p.id)}">
        <p><strong>${escapeHtml(p.num)}. ${escapeHtml(p.title)}</strong></p>
        <p>${inlineCode(p.intent)}</p>
        <div class="indicator-extras">
          <div class="crosswalk-block">
            <span class="block-label">CIS Controls v8.1 Safeguards</span>
            <ul class="plain-list">${cisSafeguardList(state, p.cis)}</ul>
            <div class="card-meta guide-meta">Companion guide: ${guideLinks(state, p.guides)}</div>
          </div>
          <div class="crosswalk-block">
            <span class="block-label">AISMM indicators</span>
            <ul class="plain-list">${aismmLinks(state, p.aismm)}</ul>
          </div>
        </div>
      </article>`
    )
    .join('');

  const resources = (data.control_resources || [])
    .map(
      (r) => `
      <li>
        <strong>${externalLink(r.url, r.title)}</strong> <span class="card-meta">${escapeHtml(r.publisher)}, ${escapeHtml(r.date)}</span>
        <div>${escapeHtml(r.use)}</div>
      </li>`
    )
    .join('');

  const levels = meta.levels || {};
  const assessment = meta.assessment || {};

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">Tool baselines &middot; as of ${escapeHtml(meta.as_of || '')}</span>
        <h1 class="page-title">${escapeHtml(meta.title || 'Enterprise AI Tool Baselines')}</h1>
        ${(meta.intro || []).map((p, i) => `<p class="${i === 0 ? 'page-lead' : ''}">${inlineCode(p)}</p>`).join('')}
      </header>

      <h2>Tools</h2>
      <div class="tool-grid">${toolCards}</div>

      <h2>Coverage matrix</h2>
      <p>Rows are the core primitives, columns are the tool branches. Each cell links to the recommendations that implement the primitive. <span class="gap-token">Gap</span> means the vendor documents no control for that primitive; hover for how to cover it.</p>
      <div class="matrix-wrap">
        <table class="matrix">
          <thead><tr><th>#</th><th>Primitive</th><th>CIS Safeguards</th>${headerCells}</tr></thead>
          <tbody>${matrixRows}</tbody>
        </table>
      </div>

      <h2>Why the primitives</h2>
      <p>${inlineCode(meta.convergence || '')}</p>

      <h2>Profile levels and assessment</h2>
      <ul>
        ${Object.entries(levels).map(([k, v]) => `<li>${levelBadge(k)} ${escapeHtml(v.replace(/^Level \d: /, ''))}</li>`).join('')}
        ${Object.entries(assessment).map(([k, v]) => `<li>${assessmentBadge(k)} ${escapeHtml(v.replace(/^\w+: /, ''))}</li>`).join('')}
      </ul>

      <h2>Primitives</h2>
      ${primitiveSections}

      <h2>Control-layer sources</h2>
      <p>These say what to secure. The tool pages say which setting does it.</p>
      <ul>${resources}</ul>

      <div class="status-banner spaced">${inlineCode(meta.mapping_note || '')}</div>
    </div>
  `;
}

// ------------------------------------------------------------------- Tool page

function getBaselineLevelFilter() {
  try {
    const v = sessionStorage.getItem(BASELINE_LEVEL_KEY);
    return v === '1' ? '1' : 'all';
  } catch (e) {
    return 'all';
  }
}

function setBaselineLevelFilter(value) {
  try {
    sessionStorage.setItem(BASELINE_LEVEL_KEY, value);
  } catch (e) {
    /* storage unavailable: filter still applies for this render */
  }
}

function renderRecommendation(r) {
  const rows = [
    ['Setting', inlineCode(r.setting)],
    ['Recommended', inlineCode(r.value)],
  ];
  if (r.default) rows.push(['Default', inlineCode(r.default)]);
  rows.push(['Rationale', inlineCode(r.rationale)]);
  rows.push(['Audit', inlineCode(r.audit)]);

  const dl = rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${v}</dd>`).join('');
  const example = r.example ? `<pre><code>${escapeHtml(r.example)}</code></pre>` : '';
  const links =
    r.links && r.links.length
      ? `<ul class="vendor-links">${r.links.map((l) => `<li>${externalLink(l.url, l.label)}</li>`).join('')}</ul>`
      : '';

  return `
    <article class="rec-item" id="${escapeHtml(r.id)}" data-level="${escapeHtml(r.level)}">
      <div class="rec-head">
        <code class="rec-id">${escapeHtml(r.id)}</code>
        ${levelBadge(r.level)}
        ${assessmentBadge(r.assessment)}
      </div>
      <p class="rec-title">${escapeHtml(r.title)}</p>
      <dl class="rec-fields">${dl}</dl>
      ${example}
      ${links}
    </article>`;
}

function renderBaselineTool(main, state, toolId) {
  const tool = baselineToolById(state, toolId);
  if (!tool) {
    main.innerHTML = `
      <div class="page">
        <div class="status-banner error">Unknown tool baseline: <code>${escapeHtml(toolId)}</code>.</div>
        <p><a href="#/baselines">All tool baselines</a></p>
      </div>`;
    return;
  }

  const data = baselineData(state);
  const filter = getBaselineLevelFilter();
  const all = baselineRecs(state, tool.id);

  const sections = data.primitives
    .map((p) => {
      const recs = baselineRecs(state, tool.id, p.id);
      const gap = tool.gaps && tool.gaps[p.id];
      const body = recs.length
        ? recs.map(renderRecommendation).join('')
        : `<div class="gap-note"><span class="gap-token">Gap</span> ${inlineCode(gap || 'No vendor control documented for this primitive.')}</div>`;
      return `
        <section class="indicator-group baseline-section" data-primitive="${escapeHtml(p.id)}">
          <h2 id="primitive-${escapeHtml(p.id)}">${escapeHtml(p.num)}. ${escapeHtml(p.title)}</h2>
          <div class="card-meta">CIS Safeguards ${cisSafeguardTokens(state, p.cis)} &middot; <a href="#/baselines#primitive-${escapeHtml(p.id)}">Primitive detail</a></div>
          ${body}
        </section>`;
    })
    .join('');

  const others = data.tools
    .filter((t) => t.id !== tool.id)
    .map((t) => `<a href="#/baselines/${escapeHtml(t.id)}">${escapeHtml(t.label)}</a>`)
    .join(' &middot; ');

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">Tool baseline &middot; ${escapeHtml(tool.vendor)} &middot; as of ${escapeHtml((data.meta || {}).as_of || '')}</span>
        <h1 class="page-title">${escapeHtml(tool.label)}</h1>
        <p class="page-lead">${all.length} recommendations across ${data.primitives.length} primitives. IDs follow <code>${escapeHtml(tool.prefix)}-&lt;primitive&gt;.&lt;n&gt;</code>.</p>
      </header>

      <dl class="tool-facts">
        <dt>Plans</dt><dd>${inlineCode(tool.plans)}</dd>
        <dt>Enforcement plane</dt><dd>${inlineCode(tool.enforcement_plane)}</dd>
        <dt>Verify</dt><dd>${inlineCode(tool.verify)}</dd>
        ${tool.notes ? `<dt>Notes</dt><dd>${inlineCode(tool.notes)}</dd>` : ''}
      </dl>
      ${
        tool.docs && tool.docs.length
          ? `<ul class="vendor-links tool-docs">${tool.docs.map((l) => `<li>${externalLink(l.url, l.label)}</li>`).join('')}</ul>`
          : ''
      }

      <div class="level-filter" role="group" aria-label="Filter by profile level">
        <button type="button" class="level-filter-btn${filter === 'all' ? ' active' : ''}" data-filter="all">Level 1 + 2</button>
        <button type="button" class="level-filter-btn${filter === '1' ? ' active' : ''}" data-filter="1">Level 1 only</button>
      </div>

      <div id="baseline-sections">${sections}</div>

      <p class="page-footnote"><a href="#/baselines">All tool baselines</a> &middot; ${others}</p>
    </div>
  `;

  applyBaselineFilter(main, filter);
  main.querySelectorAll('.level-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.filter;
      setBaselineLevelFilter(value);
      main.querySelectorAll('.level-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      applyBaselineFilter(main, value);
    });
  });
}

function applyBaselineFilter(main, value) {
  main.querySelectorAll('.rec-item').forEach((el) => {
    el.hidden = value === '1' && el.dataset.level !== '1';
  });
}
