#!/usr/bin/env python3
"""Extract Kindergarten Social Studies lesson fields for lesson-catalog.js."""
import json, re, sys
from pathlib import Path
from html import unescape

def plain(html):
    t = re.sub(r"<a [^>]*>", "", html)
    t = re.sub(r"</a>", "", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = unescape(t)
    return re.sub(r"\s+", " ", t).strip()

def lis(ul):
    out = []
    for i in re.findall(r"<li>([\s\S]*?)</li>", ul):
        s = plain(i)
        if s:
            out.append(s)
    return out

def main(root):
    root = Path(root)
    idx = (root / "index.html").read_text(encoding="utf-8")
    m = re.search(r"window.KSS_LESSONS=(\[.*?\]);</script>", idx, re.S)
    if not m:
        sys.stderr.write("KSS_LESSONS not found\n")
        sys.exit(1)
    lessons = {L["n"]: L for L in json.loads(m.group(1))}
    out = {}
    for n in range(1, 19):
        html = (root / "week" / str(n) / "index.html").read_text(encoding="utf-8")
        L = lessons[n]
        mats, sub = [], []
        mm = re.search(r"<h2>Materials</h2>\s*<ul>([\s\S]*?)</ul>", html)
        if mm:
            mats = lis(mm.group(1))
        sm = re.search(r"<h3>Sub notes</h3>\s*<ul>([\s\S]*?)</ul>", html)
        if sm:
            sub = lis(sm.group(1))
        out[str(n)] = {
            "n": n,
            "title": L.get("title") or "",
            "unit": L.get("unit") or "",
            "focus": L.get("focus") or "",
            "chalkie": L.get("chalkie") or "",
            "materials": " ".join(mats),
            "sub": " ".join(sub),
        }
    json.dump(out, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
