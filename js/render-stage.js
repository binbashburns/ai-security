function renderStage(main, state, stageNum, activeVendor) {
  const stage = state.stages.find((s) => s.stage === stageNum);
  if (!stage) {
    main.innerHTML = `
      <div class="page">
        <div class="status-banner error">No data for stage ${escapeHtml(stageNum)}.</div>
      </div>
    `;
    return;
  }

  const controls = controlsByStage(state, stageNum);

  // Group controls by pillar, preserving Protect / Utilize / Govern order.
  const byPillar = controls.reduce((acc, c) => {
    if (!acc[c.pillar]) acc[c.pillar] = [];
    acc[c.pillar].push(c);
    return acc;
  }, {});
  const pillarOrderKeys = Object.keys(byPillar).sort((a, b) => pillarOrder(a) - pillarOrder(b));

  const indicatorGroups = pillarOrderKeys
    .map((pillar) => {
      const items = byPillar[pillar]
        .map(
          (c) => `
          <article class="indicator-item pillar-${pillarClass(c.pillar)}" id="${escapeHtml(c.id)}">
            <p><strong>${escapeHtml(c.title)}</strong></p>
            ${c.summary ? `<p>${inlineCode(c.summary)}</p>` : ''}
            ${c.source ? `<div class="indicator-meta">Source: ${escapeHtml(c.source)}</div>` : ''}
            ${renderControlExtras(c, state, activeVendor)}
          </article>
        `
        )
        .join('');
      return `
        <section class="indicator-group">
          <div class="indicator-group-header">
            <span class="pillar-badge ${pillarClass(pillar)}">${escapeHtml(pillar)}</span>
            <h3 style="margin:0;text-transform:none;letter-spacing:0;font-size:14px;">Program indicators</h3>
          </div>
          ${items}
        </section>
      `;
    })
    .join('');

  const peopleList = (stage.people_indicators || [])
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join('');

  const metricsList = (stage.metrics_by_pillar
    ? Object.entries(stage.metrics_by_pillar)
    : []
  )
    .filter(([, items]) => items && items.length)
    .map(
      ([pillar, items]) => `
      <section class="indicator-group">
        <div class="indicator-group-header">
          <span class="pillar-badge ${pillarClass(pillar)}">${escapeHtml(pillar)}</span>
          <h3 style="margin:0;text-transform:none;letter-spacing:0;font-size:14px;">Potential metrics</h3>
        </div>
        <ul>${items.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>
      </section>
    `
    )
    .join('');

  const stepsList = (stage.steps_to_next_level || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

  const prereqText = stage.prerequisites_for_next_stage
    ? `<p>${escapeHtml(stage.prerequisites_for_next_stage)}</p>`
    : '';

  main.innerHTML = `
    <div class="page">
      <header class="page-header">
        <span class="page-eyebrow">AISMM Stage ${escapeHtml(stage.stage)}</span>
        <h1 class="page-title">${escapeHtml(stage.title)}</h1>
        ${stage.tagline ? `<p class="page-lead">${escapeHtml(stage.tagline)}</p>` : ''}
      </header>

      <h2>Description</h2>
      ${(stage.description || []).map((p) => `<p>${inlineCode(p)}</p>`).join('')}

      ${
        stage.value
          ? `<h2>Value</h2><p>${inlineCode(stage.value)}</p>`
          : ''
      }

      <h2>Program indicators by pillar</h2>
      ${indicatorGroups || '<p>No indicators recorded for this stage.</p>'}

      ${peopleList ? `<h2>People indicators</h2><ul>${peopleList}</ul>` : ''}
      ${metricsList ? `<h2>Potential metrics</h2>${metricsList}` : ''}
      ${stepsList ? `<h2>Steps to the next level</h2><ol>${stepsList}</ol>` : ''}
      ${prereqText ? `<h2>Prerequisites for stage ${escapeHtml(stage.stage + 1)}</h2>${prereqText}` : ''}

      <p style="margin-top:24px;">
        ${stage.source ? `<span class="card-meta">Source: ${escapeHtml(stage.source)}</span>` : ''}
      </p>
    </div>
  `;
}
