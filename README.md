# ai-security

A practitioner-level reference site for AI security, anchored on the **SANS AI Security Maturity Model (AISMM)** with cross-framework mappings (OWASP AI Exchange, NIST AI RMF, ISO/IEC 42001, CSA AICM, Forrester AEGIS) and vendor-specific implementation guidance (cloud-agnostic, AWS Bedrock, Azure AI Foundry, Google Vertex AI, Anthropic Claude, Microsoft 365 Copilot, ChatGPT Enterprise).

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
├── styles.css                       # dark-only dracula, single stylesheet
├── app.js                           # data loader, vendor-tab state, router dispatch
├── js/
│   ├── router.js
│   ├── render-home.js
│   ├── render-stage.js              # stage pages (the bulk of the site)
│   ├── render-frameworks.js
│   ├── render-framework-detail.js
│   ├── render-crosswalk.js
│   └── render-references.js
├── data/
│   ├── stages.json                  # per-stage prose: description, indicators, metrics, steps, prereqs
│   ├── controls.json                # per-control records: pillar, summary, source, crosswalk, vendor_implementation
│   ├── frameworks.json              # framework metadata (name, URL, PDF, version)
│   ├── vendors.json                 # vendor tab metadata (id, label, default)
│   └── refs.json                    # bibliography entries
└── .github/workflows/
    ├── deploy.yml                   # GitHub Pages deploy
    └── security.yml                 # reusable scanning workflows
```

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
    "aegis": ["AE-12"]
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
- **`vendor_implementation`** keys are vendor IDs from `data/vendors.json`. **Omit a vendor entirely** if there is no real guidance. The site hides any vendor block that has no entry rather than showing a placeholder.
- Every link opens in a new tab. Use canonical vendor docs, not blog posts.

## Adding a vendor tab

1. Add a record to `data/vendors.json`:

   ```json
   { "id": "new_vendor", "label": "New Vendor", "default": false }
   ```

2. Add a `new_vendor` block to whichever control records have real implementation guidance for that vendor. Skip controls that have no real guidance; the tab will silently hide those.

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

2. Add the framework ID as a key under `crosswalk` on any control record where it applies.

The Frameworks page and the Crosswalk Matrix page both rebuild themselves from these files; no further code change is required.

## Style rules

- **No em-dashes.** Use commas, colons, parentheses, or en-dashes where punctuation is needed. This is an en-dash shop.
- **No marketing voice.** Direct, practitioner-level prose. Summaries describe what you do, not why it matters.
- Vendor links open in a new tab (`target="_blank" rel="noopener noreferrer"`).

## Deployment

GitHub Pages, custom domain via `CNAME`. The workflow at `.github/workflows/deploy.yml` stages files into `_site/` and publishes on every push to `main`.

## Sibling sites

- https://devsecops.binbashburns.com – Security Stack Modeler
- https://k8s.binbashburns.com – Kubernetes practice
