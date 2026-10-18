#!/usr/bin/env python3
"""Read-only, scoped freeCodeCamp curriculum metadata importer.

Default mode does not download or reproduce curriculum lesson bodies.
An explicit, per-source rights approval file is required to include lesson bodies.
No untrusted code, assertions, or solutions are ever executed.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

REPO = "freeCodeCamp/freeCodeCamp"
BASE = "curriculum/challenges/english/blocks"
STRUCT = "curriculum/structure/blocks"
ALLOWED = {"lesson", "coding_challenge", "multiple_choice", "quiz", "fill_in_the_blank", "debugging_exercise", "project"}
FRONT = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
HEADING = re.compile(r"^# --([a-zA-Z][\w-]*)--\s*$", re.MULTILINE)
FENCE = re.compile(r"```([\w+.#-]*)\s*\n([\s\S]*?)\n```", re.MULTILINE)


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))


def sections(markdown: str) -> dict[str, str]:
    matches = list(HEADING.finditer(markdown))
    return {m.group(1): markdown[m.end():matches[i + 1].start() if i + 1 < len(matches) else len(markdown)].strip()
            for i, m in enumerate(matches)}


def frontmatter(markdown: str) -> dict[str, Any]:
    m = FRONT.match(markdown)
    if not m:
        return {}
    # Values used by FCC here are scalars. Keep parser lightweight and reject rich YAML.
    out: dict[str, Any] = {}
    for line in m.group(1).splitlines():
        found = re.match(r"^([\w-]+):\s*(.*)$", line)
        if found:
            value = found.group(2).strip().strip('"\'')
            out[found.group(1)] = int(value) if value.isdigit() and found.group(1) == "challengeType" else value
    return out


def split_quiz(section: str) -> list[dict[str, Any]]:
    """Extract FCC quiz-format questions; don't guess the ordering of correct answers."""
    result = []
    for q in re.split(r"^### --question--\s*$", section, flags=re.MULTILINE)[1:]:
        a = re.search(r"^#### --answer--\s*$", q, flags=re.MULTILINE)
        d = re.search(r"^#### --distractors--\s*$", q, flags=re.MULTILINE)
        t = re.search(r"^#### --text--\s*$", q, flags=re.MULTILINE)
        if not (a and d and t) or not (t.start() < d.start() < a.start()):
            continue
        prompt = q[t.end():d.start()].strip()
        distractors = [x.strip() for x in re.split(r"^---\s*$", q[d.end():a.start()], flags=re.MULTILINE) if x.strip()]
        answer = q[a.end():].strip()
        if not prompt or not answer:
            continue
        # Shuffle in app using a seed; do not always show correct answer last.
        result.append({"type": "multiple_choice", "question": prompt,
                       "choices": [{"text": x, "correct": False} for x in distractors] + [{"text": answer, "correct": True}],
                       "needsReview": True})
    return result


def classify(meta: dict[str, Any], block: str) -> str:
    label = str(meta.get("blockLabel") or "").lower()
    if label in ("quiz", "exam", "review") or block.startswith("quiz-"):
        return "quiz" if label != "review" else "lesson"
    if label == "lab" or block.startswith("lab-"):
        return "debugging_exercise" if "debug" in block else "coding_challenge"
    if label == "workshop" or block.startswith("workshop-"):
        return "coding_challenge"
    if label == "lecture" or block.startswith("lecture-") or block.startswith("introduction-"):
        return "lesson"
    if block in {"basic-algorithm-scripting", "intermediate-algorithm-scripting", "algorithms", "data-structures", "basic-javascript"}:
        return "coding_challenge"
    return "lesson"


def generic_tags(block: str, language: str) -> list[str]:
    tags = [language]
    if any(t in block for t in ("array", "data-structure", "linked-list")):
        tags.append("data-structures")
    if "algorithm" in block:
        tags.append("algorithms")
    if "http" in block:
        tags.append("http")
    if "git" in block or "ci-cd" in block:
        tags.append("version-control")
    if "python" in block:
        tags.append("python")
    return list(dict.fromkeys(tags))


def md_source_path(block: str, ident: str, title: str, filenames: list[str], overrides: dict[str, str] | None = None) -> str | None:
    possible = [f"{ident}.md", f"{slug(title)}.md", f"{slug(title)}-video.md"]
    if overrides and ident in overrides:
        possible.insert(0, overrides[ident])
    for name in possible:
        if name in filenames:
            return f"{BASE}/{block}/{name}"
    return None


class Source:
    def __init__(self, ref: str, local: Path | None = None, token: str | None = None):
        self.ref, self.local, self.token = ref, local, token

    def _request(self, url: str) -> bytes:
        headers = {"User-Agent": "scoped-curriculum-indexer/1.0", "Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
            return response.read()

    def read(self, path: str) -> str:
        if not path.startswith("curriculum/") or ".." in Path(path).parts:
            raise ValueError("Disallowed repository path")
        if self.local:
            return (self.local / path).read_text(encoding="utf-8")
        safe_path = urllib.parse.quote(path, safe="/")
        return self._request(f"https://raw.githubusercontent.com/{REPO}/{self.ref}/{safe_path}").decode("utf-8")

    def list_md(self, block: str) -> list[str]:
        path = f"{BASE}/{block}"
        if self.local:
            return sorted(p.name for p in (self.local / path).glob("*.md"))
        url = (f"https://api.github.com/repos/{REPO}/contents/{path}"
               f"?ref={urllib.parse.quote(self.ref)}")
        records = json.loads(self._request(url))
        if not isinstance(records, list):
            raise ValueError(f"Not a GitHub directory: {path}")
        if len(records) >= 1000:
            raise ValueError(f"Directory listing may be truncated: {path}")
        return sorted(r["name"] for r in records if r.get("type") == "file" and r.get("name", "").endswith(".md"))


def approved_map(path: Path | None) -> dict[str, str]:
    if path is None:
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("rights-file must be an object path -> reviewed license")
    allowed = {}
    for key, item in raw.items():
        if (not isinstance(item, dict) or item.get("reviewed") is not True
                or not item.get("license") or item.get("allowedForThisApp") is not True):
            continue
        allowed[key] = item["license"]
    return allowed


def extract(meta: dict[str, Any], block: str, order: dict, path: str | None,
            ref: str, approved: dict[str, str], content: str | None = None,
            prior_id: str | None = None, position: int = 0) -> dict[str, Any]:
    block_type = classify(meta, block)
    language = ("python" if "python" in block or meta.get("helpCategory") == "Python" else
                "javascript" if ("javascript" in block or "js" in block or meta.get("helpCategory") == "JavaScript"
                or "node" in block or "express" in block or "algorithm" in block or "data-structure" in block) else "general")
    if "http" in block or "git" in block or "ci-cd" in block:
        language = "general"
    difficulty = "intermediate" if any(s in block for s in ("intermediate", "advanced", "dynamic-programming", "linked-list", "algorithms")) else "beginner"
    source_license = approved.get(path or "") or "UNVERIFIED_CURRICULUM_RIGHTS"
    r = {
        "id": f"fcc-{order['id']}", "externalId": order["id"], "type": block_type,
        "course": meta.get("course", "programming-foundations"), "module": block,
        "title": order["title"], "language": language, "difficulty": difficulty,
        "difficultySource": "heuristic-unreviewed", "estimatedDurationMinutes": 8 if block_type != "coding_challenge" else 12,
        "durationSource": "estimate", "xp": 15 if block_type != "coding_challenge" else 25,
        "xpSource": "app-defined", "tags": generic_tags(block, language),
        "lessonContent": None, "instructions": None, "starterCode": None,
        "tests": [], "hints": [], "explanation": None, "prerequisites": [prior_id] if prior_id else [],
        "multipleChoice": [], "project": None, "solutions": [],
        "source": {"repository": REPO, "ref": ref,
                   "file": path, "url": f"https://github.com/{REPO}/blob/{ref}/{path}" if path else None,
                   "structureFile": f"{STRUCT}/{block}.json",
                   "structureUrl": f"https://github.com/{REPO}/blob/{ref}/{STRUCT}/{block}.json",
                   "license": source_license,
                   "attribution": "freeCodeCamp.org contributors; © freeCodeCamp.org (rights require verification)"},
        "modifications": ["Reorganized metadata as a mobile app catalog entry; no lesson text reproduced"],
        "editorialFlags": (["SOURCE_FILE_NOT_RESOLVED"] if not path else []) +
                          ([] if path in approved else ["RIGHTS_REVIEW_REQUIRED"]),
        "redistributionApproved": bool(path and path in approved),
        "orderInBlock": position,
    }
    if content is not None:
        if not (path and path in approved):
            raise PermissionError("Content requires an approved exact source path")
        fm = frontmatter(content)
        if fm.get("id") != order["id"]:
            raise ValueError(f"Frontmatter id mismatch at {path}: {fm.get('id')} != {order['id']}")
        parts = sections(content)
        r["lessonContent"] = parts.get("description")
        r["instructions"] = parts.get("instructions")
        if "seed" in parts:
            f = FENCE.search(parts["seed"])
            r["starterCode"] = f.group(2) if f else None
        if "hints" in parts:
            s = parts["hints"]
            # In freeCodeCamp, the --hints-- section usually means assertions, not study hints.
            for m in FENCE.finditer(s):
                r["tests"].append({"runner": "freecodecamp-assert-js", "code": m.group(2),
                                   "portable": False, "runOnlyInTrustedSandbox": True})
            r["editorialFlags"].append("TESTS_REQUIRE_FCC_HARNESS_REVIEW")
        if "quizzes" in parts:
            r["multipleChoice"] = split_quiz(parts["quizzes"])
            if not r["multipleChoice"]:
                r["editorialFlags"].append("QUIZ_PARSER_REVIEW_REQUIRED")
        if "questions" in parts:
            r["editorialFlags"].append("LECTURE_QUESTIONS_NEED_EDITORIAL_CONVERSION")
        if "solutions" in parts:
            # Never expose solutions in the public JSON by default.
            r["editorialFlags"].append("SOURCE_CONTAINS_SOLUTIONS_NOT_EXPORTED")
        if re.search(r"https?://|<img\b|!\[", content):
            r["editorialFlags"].append("EXTERNAL_MEDIA_RIGHTS_REVIEW")
        if meta.get("usesMultifileEditor"):
            r["editorialFlags"].append("MULTIFILE_MOBILE_ADAPTATION")
        r["modifications"] = ["Converted a reviewed Markdown source to structured JSON", "Extracted candidate quiz questions; requires editorial verification"]
    if path and path.endswith("-video.md"):
        r["editorialFlags"].append("VIDEO_MEDIA_AND_TRANSCRIPT_RIGHTS_REVIEW")
    return r


def execute(config: dict, source: Source, rights: dict[str, str], include_content: bool,
            resolve_files: bool) -> tuple[list[dict], dict]:
    entries, problems = [], []
    seen_ids: set[str] = set()
    selections = config["selectedBlocks"]
    for selection in selections:
        block = selection["name"]
        try:
            meta = json.loads(source.read(f"{STRUCT}/{block}.json"))
        except (OSError, ValueError, urllib.error.URLError) as ex:
            problems.append({"block": block, "reason": "structure unavailable", "detail": str(ex)})
            continue
        if meta.get("isUpcomingChange"):
            problems.append({"block": block, "reason": "upcoming block skipped"})
            continue
        meta["course"] = selection.get("track", "programming-foundations")
        orders = meta.get("challengeOrder", [])
        if not isinstance(orders, list):
            problems.append({"block": block, "reason": "invalid challengeOrder"})
            continue
        limit = min(len(orders), selection.get("maxLessons", len(orders)))
        try:
            filenames = source.list_md(block) if resolve_files else []
        except (OSError, ValueError, urllib.error.URLError) as ex:
            filenames = []
            problems.append({"block": block, "reason": "directory listing unavailable", "detail": str(ex)})
        last_id = None
        for index, order in enumerate(orders[:limit]):
            if not isinstance(order, dict) or not all(k in order for k in ("id", "title")):
                problems.append({"block": block, "reason": "invalid challenge metadata", "order": index})
                continue
            if order["id"] in seen_ids:
                problems.append({"block": block, "reason": "duplicate id", "id": order["id"]})
                continue
            seen_ids.add(order["id"])
            path = md_source_path(block, order["id"], order["title"], filenames, config.get("fileOverrides"))
            body = None
            if include_content and path in rights:
                try:
                    body = source.read(path)
                except Exception as ex:
                    problems.append({"block": block, "reason": "approved body unavailable", "file": path, "detail": str(ex)})
            try:
                obj = extract(meta, block, order, path, config["source"]["ref"], rights, body, last_id, index)
            except (ValueError, PermissionError) as ex:
                problems.append({"block": block, "reason": "content validation failed", "detail": str(ex)})
                obj = extract(meta, block, order, path, config["source"]["ref"], rights, None, last_id, index)
            entries.append(obj)
            last_id = obj["id"]
    manifest = {
        "sourceRepository": REPO, "sourceRef": config["source"]["ref"],
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "approved-content" if include_content else "metadata-only",
        "selectedCount": len(entries),
        "selected": [{"id": x["id"], "type": x["type"], "title": x["title"],
                      "module": x["module"], "sourceFile": x["source"]["file"],
                      "sourceUrl": x["source"]["url"], "license": x["source"]["license"],
                      "flags": x["editorialFlags"]} for x in entries],
        "problems": problems,
    }
    return entries, manifest


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, default=Path(__file__).resolve().parent.parent / "manifest.selection.json")
    p.add_argument("--local-repo", type=Path, help="Optional local freeCodeCamp checkout; never modified")
    p.add_argument("--output", type=Path, default=Path("output"))
    p.add_argument("--no-resolve-files", action="store_true", help="Do not perform GitHub directory listings")
    p.add_argument("--include-content", action="store_true", help="Requires --rights-file with per-file approvals")
    p.add_argument("--rights-file", type=Path, help="Exact source paths approved for reuse, after legal review")
    args = p.parse_args(argv)
    if args.include_content and not args.rights_file:
        p.error("--include-content requires --rights-file with explicit per-file grants")
    config = json.loads(args.manifest.read_text(encoding="utf-8"))
    rights = approved_map(args.rights_file)
    source = Source(config["source"]["ref"], args.local_repo, os.environ.get("GITHUB_TOKEN"))
    entries, selection = execute(config, source, rights, args.include_content, not args.no_resolve_files)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "lessons.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output / "manifest.generated.json").write_text(json.dumps(selection, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(entries)} indexed; unresolved files: {sum(x['source']['file'] is None for x in entries)}; "
          f"issues: {len(selection['problems'])}; mode: {selection['mode']}")
    return 0 if not selection["problems"] else 2


if __name__ == "__main__":
    sys.exit(main())
