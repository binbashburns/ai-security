# ai-security

A practitioner-level reference site for AI security, anchored on the **SANS AI Security Maturity Model (AISMM)** with cross-framework mappings (OWASP AI Exchange, NIST AI RMF, ISO/IEC 42001, CSA AICM, CIS Controls v8.1 AI Companion Guides, EU AI Act, MITRE ATLAS) and vendor-specific implementation guidance (cloud-agnostic, AWS Bedrock, Azure AI Foundry, Google Vertex AI, Anthropic Claude, Microsoft 365 Copilot, ChatGPT Enterprise).

A second section, **Tool Baselines**, is the CIS Benchmark that does not exist for enterprise AI tools: per-setting hardening for Claude Code, Claude Enterprise / Team, Cursor, and GitHub Copilot, keyed to eight cross-vendor control primitives.

Live: https://ai.binbashburns.com

## What this is

A static reference. No search bar, no scoring calculator, no user input. The point is to make it easy to look up, for each AISMM control:

- Which other framework addresses it.
- How to implement it on the active vendor stack.

The five AISMM stages live in the left sidebar. The vendor tabs across the top change which implementation guidance is shown beside each control. Switching vendors does not change the framework content.

## Local development

Because the site loads data via `fetch()`, you cannot open `index.html` directly from disk in most browsers. Serve the directory with any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Repo layout

```
.
├── CNAME                            # ai.binbashburns.com
├── index.html                       # shell: topbar (title + vendor tabs), sidebar, main
├── 404.html                         # GitHub Pages not-found page
├── favicon.svg
├── .lycheeignore                    # link-check exclusions, with the reason for each
├── styles.css                       # dark-only dracula, single stylesheet
├── app.js                           # data loader, vendor-tab state, hash router, sidebar
├── js/
│   ├── render-helpers.js            # escaping, links, lookups. loads first, used by all
│   ├── render-home.js
│   ├── render-stage.js              # stage pages (the bulk of the site)
│   ├── render-frameworks.js
│   ├── render-framework-detail.js
│   ├── render-crosswalk.js
│   ├── render-references.js
│   └── render-baselines.js          # tool baseline overview, coverage matrix, per-tool pages
├── data/
│   ├── stages.json                  # per-stage prose: description, indicators, metrics, steps, prereqs
│   ├── controls.json                # per-control records: pillar, summary, source, crosswalk, vendor_implementation
│   ├── frameworks.json              # framework metadata (id, name, version, URL, description)
│   ├── vendors.json                 # vendor tab metadata (id, label, default, summary)
│   ├── refs.json                    # bibliography entries
│   └── baselines.json               # tool baselines: primitives, tools, recommendations
├── scripts/
│   └── validate-data.py             # schema and link-shape checks over data/, run in CI
└── .github/
    ├── dependabot.yml               # GitHub Actions version updates
    └── workflows/
        ├── deploy.yml               # GitHub Pages deploy
        ├── security.yml             # reusable scanning workflows
        └── validate-data.yml        # runs scripts/validate-data.py
```

There is no build step and no bundler. Every function is a global, so the script order in
`index.html` matters: `js/render-helpers.js` first, the other renderers next, `app.js` last.

## Adding a control record

A control is one row in `data/controls.json`. Use this shape:

```json
{
  "id": "AISMM-3-PROTECT-NHI",
  "stage": 3,
  "pillar": "Protect",
  "title": "AI Agent Identity and Authorization (NHI)",
  "summary": "Every AI agent is assigned a distinct NHI with scoped access and a documented human owner.",
  "source": "SANS AISMM 2026 edition, p.12",
  "crosswalk": {
    "owasp_ai_exchange": ["#LEAST MODEL PRIVILEGE", "#MODEL ACCESS CONTROL"],
    "nist_ai_rmf": ["GOVERN 1.4", "MANAGE 2.3"],
    "iso_42001": ["A.6.2.3"],
    "aicm": ["AIM-01"],
    "mitre_atlas": ["AML.T0051"]
  },
  "vendor_implementation": {
    "cloud_agnostic": {
      "summary": "Issue short-lived credentials per agent, rotate via secrets manager, scope to single tool surface.",
      "links": [
        { "label": "HashiCorp Vault agent identity", "url": "https://developer.hashicorp.com/vault/docs/agent-and-proxy/agent" },
        { "label": "SPIFFE / SPIRE", "url": "https://spiffe.io/" }
      ]
    },
    "aws_bedrock": {
      "summary": "Use IAM roles per agent via AgentCore Identity. Scope to invoke-only on specific model IDs and tool ARNs.",
      "links": [
        { "label": "Bedrock AgentCore Identity docs", "url": "https://docs.aws.amazon.com/bedrock/" }
      ]
    }
  }
}
```

Rules of the road:

- **`id`** uses the pattern `AISMM-<stage>-<PILLAR>-<short-token>`.
- **`source`** cites the authoritative document, edition, and page where applicable. Use the published name (e.g. `SANS AISMM 2026 edition, p.12`); do not reference local files.
- **`crosswalk`** keys are framework IDs from `data/frameworks.json`. Omit keys that do not apply rather than setting them to `null` or `[]`.
- **`vendor_implementation`** keys are vendor IDs from `data/vendors.json`. **Omit a vendor entirely** if there is no real guidance. The site states the gap ("No <vendor> guidance recorded for this control yet") rather than inventing filler.
- Every link opens in a new tab. Use canonical vendor docs, not blog posts.
- **Verify every URL before you add it.** A 200 response is not sufficient: several vendor doc links here returned 200 while silently redirecting to a service landing page, which means the cited page is gone. Check the effective URL.

Run `python3 scripts/validate-data.py` after editing anything under `data/`. It is stdlib-only and checks ids, stage/pillar consistency, crosswalk and vendor keys, and link shape.

## Adding a vendor tab

1. Add a record to `data/vendors.json`:

   ```json
   { "id": "new_vendor", "label": "New Vendor", "default": false }
   ```

2. Add a `new_vendor` block to whichever control records have real implementation guidance for that vendor. Skip controls that have no real guidance; those render an explicit "not recorded yet" note under the new tab.

That is the only change required. The vendor tab bar in the topbar reads from `vendors.json`; the renderer reads from `controls.json`.

## Adding a framework

1. Add a record to `data/frameworks.json`:

   ```json
   {
     "id": "new_framework",
     "name": "New Framework v1.0",
     "version": "1.0",
     "url": "https://example.org/framework",
     "short_description": "One-sentence summary of what this framework covers."
   }
   ```

   A framework no control cites yet gets no column in the Crosswalk Matrix, so add the
   mappings in the same change.

2. Add the framework ID as a key under `crosswalk` on any control record where it applies.

The Frameworks page and the Crosswalk Matrix page both rebuild themselves from these files; no further code change is required.

## Tool baselines

`data/baselines.json` drives `#/baselines` and `#/baselines/<tool>`. The model is core and branch:

- **`primitives`** (core): eight cross-vendor control primitives. Each carries `cis` (CIS Controls v8.1 Safeguard numbers, titles in `cis_safeguards`), `guides` (which CIS AI Companion Guide applies), and `aismm` (AISMM control IDs from `controls.json`). The CIS Safeguards on a primitive are also written into the `cis_controls` crosswalk of each AISMM control it lists, so they show up on stage pages and in the Crosswalk Matrix.
- **`tools`** (branches): plans, enforcement plane, how to verify, and optional `gaps` (primitive ID to a note explaining why the vendor has no control and what covers it).
- **`recommendations`**: one CIS-style item each.

```json
{
  "id": "CC-5.1",
  "tool": "claude_code",
  "primitive": "execution",
  "level": 1,
  "assessment": "automated",
  "title": "Disable bypass permissions mode",
  "setting": "`permissions.disableBypassPermissionsMode`",
  "value": "`\"disable\"`",
  "rationale": "Why this matters, in one or two sentences.",
  "audit": "How to verify it is in effect.",
  "default": "Optional: vendor default if documented.",
  "example": "Optional: JSON snippet as a string.",
  "links": [{ "label": "Settings reference", "url": "https://..." }]
}
```

Rules of the road:

- **`id`** is `<tool prefix>-<primitive num>.<n>`. Prefixes: `CC` Claude Code, `CA` Claude Enterprise / Team, `CU` Cursor, `GH` GitHub Copilot.
- **`level`**: `1` for low-friction settings every licensee should apply, `2` for defense in depth with workflow cost.
- **`assessment`**: `automated` if a script, admin API, MDM report, or client status command can verify it; otherwise `manual`.
- Every setting name and value must come from the vendor's canonical docs. Update `meta.as_of` when re-verifying.
- No placeholder recommendations. If the vendor has no control for a primitive, add a `gaps` note on the tool instead.

## Style rules

- **No em-dashes.** Use commas, colons, parentheses, or en-dashes where punctuation is needed. This is an en-dash shop.
- **No marketing voice.** Direct, practitioner-level prose. Summaries describe what you do, not why it matters.
- Vendor links open in a new tab (`target="_blank" rel="noopener noreferrer"`).

## Deployment

GitHub Pages, custom domain via `CNAME`. The workflow at `.github/workflows/deploy.yml` stages files into `_site/` and publishes on every push to `main`. A new top-level file has to be added to both the `paths:` trigger and the staging step or it will not ship.

Security scanning runs from `.github/workflows/security.yml`, which calls the reusable workflows in [binbashburns/security-pipelines](https://github.com/binbashburns/security-pipelines): a TruffleHog secrets gate, then Semgrep, lychee link checking, and a ZAP baseline scan.

## Sibling sites

- https://devsecops.binbashburns.com – Security Stack Modeler
- https://k8s.binbashburns.com – Kubernetes practice
