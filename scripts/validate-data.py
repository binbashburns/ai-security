#!/usr/bin/env python3
"""Schema and link-shape checks over data/.

Stdlib only, no dependencies: the site has no build step and this should stay
runnable with a bare python3. Exits non-zero and prints every problem it finds.

    python3 scripts/validate-data.py
"""

import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
PILLARS = {"Protect", "Utilize", "Govern"}
ID_PATTERN = re.compile(r"^AISMM-(\d+)-([A-Z]+)-[A-Z0-9-]+$")

problems = []


def fail(where, message):
    problems.append(f"{where}: {message}")


def load(name):
    path = DATA / f"{name}.json"
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as err:
        fail(path.name, f"invalid JSON ({err})")
        return None


def check_links(where, links):
    if not isinstance(links, list):
        fail(where, "links must be a list")
        return
    for i, link in enumerate(links):
        at = f"{where} link[{i}]"
        if not isinstance(link, dict):
            fail(at, "link must be an object")
            continue
        for field in ("label", "url"):
            if not link.get(field):
                fail(at, f"missing {field}")
        url = link.get("url", "")
        if url and not url.startswith("https://"):
            fail(at, f"url must be https ({url})")


def main():
    stages = load("stages")
    controls = load("controls")
    frameworks = load("frameworks")
    vendors = load("vendors")
    refs = load("refs")
    baselines = load("baselines")
    if None in (stages, controls, frameworks, vendors, refs, baselines):
        report()

    stage_numbers = {s.get("stage") for s in stages}
    framework_ids = {f.get("id") for f in frameworks}
    vendor_ids = {v.get("id") for v in vendors}

    if sum(1 for v in vendors if v.get("default")) != 1:
        fail("vendors.json", "exactly one vendor must be marked default")

    seen_ids = set()
    for control in controls:
        cid = control.get("id", "<no id>")
        where = f"controls.json {cid}"

        for field in ("id", "stage", "pillar", "title", "summary", "source",
                      "crosswalk", "vendor_implementation"):
            if field not in control:
                fail(where, f"missing {field}")

        if cid in seen_ids:
            fail(where, "duplicate id")
        seen_ids.add(cid)

        match = ID_PATTERN.match(cid)
        if not match:
            fail(where, "id does not match AISMM-<stage>-<PILLAR>-<token>")
        else:
            id_stage, id_pillar = match.group(1), match.group(2)
            if str(control.get("stage")) != id_stage:
                fail(where, f"id says stage {id_stage}, record says {control.get('stage')}")
            if str(control.get("pillar", "")).upper() != id_pillar:
                fail(where, f"id says pillar {id_pillar}, record says {control.get('pillar')}")

        if control.get("stage") not in stage_numbers:
            fail(where, f"stage {control.get('stage')} is not in stages.json")
        if control.get("pillar") not in PILLARS:
            fail(where, f"pillar must be one of {sorted(PILLARS)}")

        crosswalk = control.get("crosswalk") or {}
        for fw_id, entries in crosswalk.items():
            if fw_id not in framework_ids:
                fail(where, f"crosswalk key '{fw_id}' is not a framework id")
            if entries in (None, [], {}, ""):
                fail(where, f"crosswalk '{fw_id}' is empty: omit the key instead")
            elif not isinstance(entries, list):
                fail(where, f"crosswalk '{fw_id}' must be a list")

        implementations = control.get("vendor_implementation") or {}
        for vendor_id, block in implementations.items():
            if vendor_id not in vendor_ids:
                fail(where, f"vendor key '{vendor_id}' is not a vendor id")
            if not isinstance(block, dict):
                fail(where, f"vendor '{vendor_id}' must be an object")
                continue
            if not block.get("summary") and not block.get("links"):
                fail(where, f"vendor '{vendor_id}' is empty: omit the vendor instead")
            if "links" in block:
                check_links(f"{where} {vendor_id}", block["links"])

    for framework in frameworks:
        where = f"frameworks.json {framework.get('id', '<no id>')}"
        for field in ("id", "name", "url", "short_description"):
            if not framework.get(field):
                fail(where, f"missing {field}")
        if not str(framework.get("url", "")).startswith("https://"):
            fail(where, "url must be https")
        cited = any(framework.get("id") in (c.get("crosswalk") or {}) for c in controls)
        if not cited and not framework.get("spine"):
            fail(where, "no control cites this framework: add mappings or remove it")

    for ref in refs:
        where = f"refs.json {ref.get('title', '<no title>')}"
        if not ref.get("title"):
            fail(where, "missing title")
        if ref.get("url") and not str(ref["url"]).startswith("https://"):
            fail(where, "url must be https")

    check_baselines(baselines, seen_ids)

    # House style: no em-dashes anywhere in the data files.
    for path in sorted(DATA.glob("*.json")):
        if "—" in path.read_text():
            fail(path.name, "contains an em-dash (house style is en-dashes)")

    report()


def check_baselines(baselines, control_ids):
    primitive_ids = {p.get("id") for p in baselines.get("primitives", [])}
    tool_ids = {t.get("id") for t in baselines.get("tools", [])}
    guides = baselines.get("companion_guides", {})

    for key, guide in guides.items():
        check_links(f"baselines.json companion_guides.{key}", [guide])

    for primitive in baselines.get("primitives", []):
        where = f"baselines.json primitive {primitive.get('id', '<no id>')}"
        for key in primitive.get("guides", []):
            if key not in guides:
                fail(where, f"guide '{key}' is not in companion_guides")
        for cid in primitive.get("aismm", []):
            if cid not in control_ids:
                fail(where, f"AISMM id '{cid}' is not in controls.json")

    for tool in baselines.get("tools", []):
        check_links(f"baselines.json tool {tool.get('id', '<no id>')}", tool.get("docs", []))

    seen = set()
    for rec in baselines.get("recommendations", []):
        rid = rec.get("id", "<no id>")
        where = f"baselines.json {rid}"
        if rid in seen:
            fail(where, "duplicate id")
        seen.add(rid)
        if rec.get("tool") not in tool_ids:
            fail(where, f"tool '{rec.get('tool')}' is not a tool id")
        if rec.get("primitive") not in primitive_ids:
            fail(where, f"primitive '{rec.get('primitive')}' is not a primitive id")
        if rec.get("level") not in (1, 2):
            fail(where, "level must be 1 or 2")
        check_links(where, rec.get("links", []))

    for resource in baselines.get("control_resources", []):
        where = f"baselines.json control_resources {resource.get('title', '<no title>')}"
        if not str(resource.get("url", "")).startswith("https://"):
            fail(where, "url must be https")


def report():
    if problems:
        print(f"{len(problems)} problem(s) found:\n")
        for problem in problems:
            print(f"  {problem}")
        sys.exit(1)
    print("data/ is valid")
    sys.exit(0)


if __name__ == "__main__":
    main()
