/* Sub Day Plans — PDF and Word (.docx) downloads, built in the browser.
   No libraries and no CDN: the PDF uses the built-in Helvetica fonts (Letter paper),
   and the .docx is a small OOXML zip written by hand. Exposes window.SubExport. */
(function () {
  "use strict";

  /* ================= shared helpers ================= */
  function download(bytes, name, mime) {
    var blob = new Blob([bytes], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  function latin1Bytes(s) { var b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; return b; }

  /* Links: text is a list of segments {t, url}. URLs typed into plan fields (http(s):// or www.)
     are found automatically; links with a friendly name arrive as ready-made segments. */
  var URL_RE = /(https?:\/\/|www\.)[^\s<>"]*[^\s<>".,;:!?'")\]]/gi;
  function href(u) { u = String(u || "").trim(); if (/^www\./i.test(u)) u = "https://" + u; return /^https?:\/\/\S+$/i.test(u) ? u : ""; }
  function autoLink(text) {
    text = String(text == null ? "" : text);
    var out = [], last = 0, m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text))) {
      if (m.index > last) out.push({ t: text.slice(last, m.index) });
      out.push({ t: m[0], url: href(m[0]) });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  }
  function segsOf(it) { return it.segs ? it.segs.map(function (g) { return { t: g.t, url: g.url ? href(g.url) : "" }; }) : autoLink(it.v); }

  /* ================= PDF ================= */
  var W_R = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,350,556,350,222,556,333,1000,556,556,333,1000,667,333,1000,350,611,350,350,222,222,333,333,350,556,1000,333,1000,500,333,944,350,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
  var W_B = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,350,556,350,278,556,500,1000,556,556,333,1000,667,333,1000,350,611,350,350,278,278,500,500,350,556,1000,333,1000,556,333,944,350,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];

  var CP1252 = { 0x20AC: 128, 0x201A: 130, 0x0192: 131, 0x201E: 132, 0x2026: 133, 0x2020: 134, 0x2021: 135, 0x02C6: 136, 0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017D: 142,
    0x2018: 145, 0x2019: 146, 0x201C: 147, 0x201D: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151, 0x02DC: 152, 0x2122: 153, 0x0161: 154, 0x203A: 155, 0x0153: 156, 0x017E: 158, 0x0178: 159 };
  var SUBST = { 0x26A0: "!", 0x2192: "->", 0x2190: "<-", 0x2212: "-", 0x2011: "-", 0x2010: "-", 0x00A0: " ", 0x2009: " ", 0x202F: " ", 0x2713: "v", 0x2714: "v", 0x2715: "x", 0x2717: "x", 0x2605: "*", 0x2606: "*" };
  // Unicode -> WinAnsi (one char per byte). Emoji are dropped; other unsupported characters become "?".
  function win(s) {
    var out = "";
    for (var ch of String(s == null ? "" : s)) {
      var c = ch.codePointAt(0);
      if (c === 9) { out += " "; continue; }
      if (c === 10) { out += "\n"; continue; }
      if (c < 32 || (c >= 0xFE00 && c <= 0xFE0F) || c === 0x200D) continue;
      if (c < 128 || (c >= 160 && c <= 255)) { out += String.fromCharCode(c); continue; }
      if (CP1252[c]) { out += String.fromCharCode(CP1252[c]); continue; }
      if (SUBST[c]) { out += SUBST[c]; continue; }
      if (c > 0xFFFF || (c >= 0x2600 && c <= 0x27BF)) continue;
      out += "?";
    }
    return out;
  }
  function textW(s, bold, size) {
    var t = bold ? W_B : W_R, w = 0;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); w += c >= 32 && c <= 255 ? t[c - 32] : 0; }
    return w * size / 1000;
  }
  // Wrap WinAnsi text to a width. firstW lets the first line be shorter (room for a bold prefix).
  function wrap(s, bold, size, maxW, firstW) {
    var lines = [], paras = s.split("\n");
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/ +/), line = "";
      var lim = function () { return lines.length === 0 && firstW != null ? firstW : maxW; };
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (!w) continue;
        var trial = line ? line + " " + w : w;
        if (textW(trial, bold, size) <= lim()) { line = trial; continue; }
        if (line) { lines.push(line); line = ""; }
        while (textW(w, bold, size) > lim()) {        // a single word wider than the column
          var k = 1;
          while (k < w.length && textW(w.slice(0, k + 1), bold, size) <= lim()) k++;
          lines.push(w.slice(0, k)); w = w.slice(k);
        }
        line = w;
      }
      lines.push(line);
    }
    return lines;
  }
  // Wrap segments; returns lines, each a list of pieces {t, url} (WinAnsi text).
  function wrapRich(segs, bold, size, maxW, firstW) {
    var lines = [[]], curW = 0, pend = false, spW = textW(" ", bold, size);
    function lim() { return lines.length === 1 && firstW != null ? firstW : maxW; }
    function newLine() { lines.push([]); curW = 0; pend = false; }
    function add(t, url) { var ln = lines[lines.length - 1], lp = ln[ln.length - 1]; if (lp && (lp.url || "") === (url || "")) lp.t += t; else ln.push({ t: t, url: url || "" }); curW += textW(t, bold, size); }
    segs.forEach(function (g) {
      win(g.t).split(/(\n| +)/).forEach(function (tok) {
        if (!tok) return;
        if (tok === "\n") { newLine(); return; }
        if (/^ +$/.test(tok)) { pend = lines[lines.length - 1].length > 0; return; }
        var w = tok, ww = textW(w, bold, size);
        if (pend && curW + spW + ww <= lim()) { var ln = lines[lines.length - 1], lp = ln[ln.length - 1]; add(" ", lp && lp.url && lp.url === g.url ? g.url : ""); }
        else if (pend || curW + ww > lim()) { if (lines[lines.length - 1].length) newLine(); }
        pend = false;
        while (textW(w, bold, size) > lim() - curW && w.length > 1) {
          var k = 1;
          while (k < w.length && curW + textW(w.slice(0, k + 1), bold, size) <= lim()) k++;
          add(w.slice(0, k), g.url); newLine(); w = w.slice(k);
        }
        add(w, g.url);
      });
    });
    return lines;
  }
  function uriStr(u) { return "(" + encodeURI(decodeURIComponentSafe(u)).replace(/\\/g, "%5C").replace(/\(/g, "%28").replace(/\)/g, "%29") + ")"; }
  function decodeURIComponentSafe(u) { try { return decodeURI(u); } catch (e) { return u; } }
  function pdfStr(s) { return "(" + s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")"; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(function (v) { return +v.toFixed(3); }).join(" "); }

  var PW = 612, PH = 792, M = 40, CW = PW - 2 * M;
  var LINK = "#0b57d0";
  var RED = "#b91c1c", DARK = "#111827", GREY = "#4b5563", LIGHT = "#6b7280", DUTYBG = "#fdecec", HEADBG = "#e5e7eb", TAGBG = "#fff4e5";

  function buildPDF(m) {
    var pages = [], annots = [], ann = null, ops = null, y = 0;
    function newPage() { ops = []; pages.push(ops); ann = []; annots.push(ann); y = M; }
    // Draw a wrapped line of pieces; links are blue, underlined and get a /Link annotation.
    function TR(x, yy, pieces, bold, size, color) {
      var cx = x;
      pieces.forEach(function (pc) {
        var w = textW(pc.t, bold, size);
        if (pc.url && pc.t.trim()) {
          T(cx, yy, pc.t, bold, size, LINK);
          L(cx, yy + 1.4, cx + w, yy + 1.4, LINK, 0.5);
          ann.push({ r: [cx, PH - yy - 2.5, cx + w, PH - yy + size * 0.8], uri: pc.url });
        } else T(cx, yy, pc.t, bold, size, color);
        cx += w;
      });
    }
    function T(x, yy, s, bold, size, color) {
      if (!s) return;
      ops.push("BT /" + (bold ? "F2" : "F1") + " " + size + " Tf " + rgb(color || DARK) + " rg " + x.toFixed(2) + " " + (PH - yy).toFixed(2) + " Td " + pdfStr(s) + " Tj ET");
    }
    function R(x, yy, w, h, fill, stroke, lw) {
      var s = "";
      if (fill) s += rgb(fill) + " rg ";
      if (stroke) s += rgb(stroke) + " RG " + (lw || 0.6) + " w ";
      s += x.toFixed(2) + " " + (PH - yy - h).toFixed(2) + " " + w.toFixed(2) + " " + h.toFixed(2) + " re " + (fill && stroke ? "B" : fill ? "f" : "S");
      ops.push(s);
    }
    function L(x1, y1, x2, y2, color, lw) { ops.push(rgb(color || DARK) + " RG " + (lw || 0.6) + " w " + x1.toFixed(2) + " " + (PH - y1).toFixed(2) + " m " + x2.toFixed(2) + " " + (PH - y2).toFixed(2) + " l S"); }
    function room(h) { if (y + h > PH - M - 16) { newPage(); return true; } return false; }

    newPage();
    /* header */
    T(M, y + 8, win(m.kicker).toUpperCase(), true, 8, LIGHT);
    T(M, y + 30, win(m.title), true, 20, DARK);
    var who1 = win("Teacher: " + (m.teacher || "")), who2 = win("Sub: " + (m.sub || "________________"));
    T(PW - M - textW(who1, false, 10), y + 14, who1, false, 10, DARK);
    T(PW - M - textW(who2, false, 10), y + 30, who2, false, 10, DARK);
    y += 40; L(M, y, PW - M, y, DARK, 1.5); y += 10;

    /* duties — boxed in red so the sub can't miss it */
    if (m.duties) {
      var dl = wrapRich(autoLink(m.duties), true, 10.5, CW - 20);
      var dh = 22 + dl.length * 13 + 6;
      R(M, y, CW, dh, DUTYBG, RED, 2);
      T(M + 10, y + 15, win("\u26a0 DUTIES \u2014 PLEASE DON\u2019T MISS"), true, 10, RED);
      dl.forEach(function (ln, i) { TR(M + 10, y + 30 + i * 13, ln, true, 10.5, DARK); });
      y += dh + 10;
    }

    /* day fields: two columns */
    var info = m.info.filter(function (f) { return f.value; });
    var colW = (CW - 14) / 2;
    for (var i = 0; i < info.length; i += 2) {
      var pair = [info[i], info[i + 1]].filter(Boolean).map(function (f) { return { label: win(f.label).toUpperCase(), lines: wrapRich(autoLink(f.value), false, 9.5, colW) }; });
      var h = 12 + Math.max.apply(null, pair.map(function (p) { return p.lines.length; })) * 11.5 + 6;
      room(h);
      pair.forEach(function (p, j) {
        var x = M + j * (colW + 14);
        T(x, y + 8, p.label, true, 7.5, GREY);
        p.lines.forEach(function (ln, k) { TR(x, y + 20 + k * 11.5, ln, false, 9.5, DARK); });
      });
      y += h;
    }
    y += 4;

    /* schedule table */
    var COLS = [62, 150, CW - 212], PAD = 5;
    function tableHead() {
      R(M, y, CW, 16, HEADBG, DARK, 0.6);
      T(M + PAD, y + 11, "TIME", true, 8, DARK); T(M + COLS[0] + PAD, y + 11, "CLASS", true, 8, DARK); T(M + COLS[0] + COLS[1] + PAD, y + 11, "PLAN", true, 8, DARK);
      y += 16;
    }
    room(60); tableHead();
    m.rows.forEach(function (r) {
      var dim = r.kind === "minor";
      // Each cell is a list of lines: {t, b, s (size), c (colour), h (line height), pre (bold prefix)}
      var cTime = [{ t: win(r.time), b: true, s: 9, c: dim ? LIGHT : DARK, h: 11.5 }];
      var cCls = [], cPlan = [];
      var w1 = COLS[1] - 2 * PAD, w2 = COLS[2] - 2 * PAD;
      wrap(win(r.cls), true, r.kind === "class" ? 10 : 9, w1).forEach(function (t) { cCls.push({ t: t, b: true, s: r.kind === "class" ? 10 : 9, c: dim ? LIGHT : DARK, h: 12 }); });
      (r.tags || []).forEach(function (tag) { wrap(win(tag).toUpperCase(), true, 7.5, w1).forEach(function (t) { cCls.push({ t: t, b: true, s: 7.5, c: RED, h: 10, tag: true }); }); });
      (r.sub || []).forEach(function (sx) { wrap(win(sx), false, 8.5, w1).forEach(function (t) { cCls.push({ t: t, b: false, s: 8.5, c: GREY, h: 10.5 }); }); });
      if (r.orig) wrap(win("Timetable: " + r.orig), false, 7.5, w1).forEach(function (t) { cCls.push({ t: t, b: false, s: 7.5, c: LIGHT, h: 9.5 }); });
      (r.plan || []).forEach(function (it) {
        var size = dim ? 8.5 : 9, bold = !!it.strong, col = it.color === "red" ? RED : dim ? GREY : DARK;
        var key = it.k ? win(it.k) + " " : "", kw = key ? textW(key, true, size) : 0;
        var ls = wrapRich(segsOf(it), bold, size, w2, key ? w2 - kw : null);
        ls.forEach(function (pcs, j) { cPlan.push({ runs: pcs, b: bold, s: size, c: col, h: size + 2.5, pre: j === 0 ? key : "", preW: kw }); });
        if (it.gap) cPlan.push({ t: "", h: 3 });
      });
      var cells = [cTime, cCls, cPlan];
      var first = true;
      while (cells.some(function (c) { return c.length; }) || first) {
        var avail = PH - M - 16 - y - 2 * PAD;
        var minFirst = Math.max.apply(null, cells.map(function (c) { return c.length ? c[0].h : 0; }));
        if (avail < Math.max(minFirst, first ? Math.min(40, cells.reduce(function (a, c) { return Math.max(a, c.reduce(function (s, l) { return s + l.h; }, 0)); }, 0)) : minFirst)) { newPage(); tableHead(); avail = PH - M - 16 - y - 2 * PAD; }
        var take = cells.map(function (c) { var n = 0, h = 0; while (n < c.length && h + c[n].h <= avail) { h += c[n].h; n++; } return { n: n, h: h }; });
        var rowH = Math.max(14, Math.max.apply(null, take.map(function (t) { return t.h; })) + 2 * PAD);
        if (r.kind === "duty") R(M, y, CW, rowH, DUTYBG, null);
        else if (dim) R(M, y, CW, rowH, "#f9fafb", null);
        var x = M;
        cells.forEach(function (c, ci) {
          var yy = y + PAD;
          for (var n = 0; n < take[ci].n; n++) {
            var l = c[n];
            if (l.tag) { var tw = textW(l.t, true, l.s); R(x + PAD - 2, yy + 0.5, tw + 4, l.h - 0.5, TAGBG, RED, 0.8); }
            if (l.pre) T(x + PAD, yy + l.s, l.pre, true, l.s, l.c);
            if (l.runs) TR(x + PAD + (l.pre ? l.preW : 0), yy + l.s, l.runs, l.b, l.s, l.c);
            else T(x + PAD + (l.pre ? l.preW : 0), yy + l.s, l.t, l.b, l.s, l.c);
            yy += l.h;
          }
          cells[ci] = c.slice(take[ci].n);
          x += COLS[ci];
        });
        if (r.kind === "duty") R(M, y, CW, rowH, null, RED, 2);
        else R(M, y, CW, rowH, null, DARK, 0.6);
        L(M + COLS[0], y, M + COLS[0], y + rowH, DARK, 0.4); L(M + COLS[0] + COLS[1], y, M + COLS[0] + COLS[1], y + rowH, DARK, 0.4);
        if (r.combined) R(M, y, 4, rowH, DARK, null);
        y += rowH; first = false;
      }
    });

    /* end-of-day notes */
    y += 12;
    var endLines = m.endNotes ? wrapRich(autoLink(m.endNotes), false, 9.5, CW) : null;
    room(endLines ? 20 + endLines.length * 12 : 80);
    T(M, y + 8, win(m.endNotes ? "END-OF-DAY NOTES" : "END-OF-DAY NOTES FROM THE SUB (HOW IT WENT, ABSENCES, FOLLOW-UPS)"), true, 7.5, GREY);
    y += 14;
    if (endLines) { endLines.forEach(function (ln) { room(12); TR(M, y + 9, ln, false, 9.5, DARK); y += 12; }); }
    else { for (var k = 0; k < 3; k++) { y += 20; L(M, y, PW - M, y, "#9ca3af", 0.6); } }
    y += 12;
    if (m.backup) {
      var bl = wrapRich(m.backup.map ? segsOf({ segs: m.backup }) : autoLink(m.backup), false, 8.5, CW);
      room(14 + bl.length * 11);
      T(M, y + 8, "IF A PLAN FALLS THROUGH", true, 7.5, GREY); y += 12;
      bl.forEach(function (ln) { TR(M, y + 9, ln, false, 8.5, DARK); y += 11; });
    }
    if (m.thanks) { room(20); y += 8; T(M, y + 9, win(m.thanks), true, 9.5, DARK); }

    /* footers + assemble */
    var total = pages.length;
    pages.forEach(function (p, i) {
      ops = p;
      var f = win(m.footer + " \u00b7 page " + (i + 1) + " of " + total);
      T(PW - M - textW(f, false, 7.5), PH - 22, f, false, 7.5, LIGHT);
    });
    var objs = [], next = 5;
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    var kids = [];
    pages.forEach(function (p, i) {
      var po = next++, co = next++, stream = p.join("\n");
      var refs = annots[i].map(function (a) {
        var n = next++;
        objs[n] = "<< /Type /Annot /Subtype /Link /Rect [" + a.r.map(function (v) { return v.toFixed(2); }).join(" ") + "] /Border [0 0 0] /A << /Type /Action /S /URI /URI " + uriStr(a.uri) + " >> >>";
        return n + " 0 R";
      });
      kids.push(po + " 0 R");
      objs[po] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PW + " " + PH + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + co + " 0 R" + (refs.length ? " /Annots [" + refs.join(" ") + "]" : "") + " >>";
      objs[co] = "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream";
    });
    objs[2] = "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + pages.length + " >>";
    var info = next++;
    objs[info] = "<< /Title " + pdfStr(win(m.docTitle)) + " /Author " + pdfStr(win(m.teacher || "")) + " /Producer (Sub Day Plans) >>";
    var out = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n", offs = [];
    for (var n = 1; n < objs.length; n++) { offs[n] = out.length; out += n + " 0 obj\n" + objs[n] + "\nendobj\n"; }
    var xref = out.length;
    out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
    for (n = 1; n < objs.length; n++) out += String(offs[n]).padStart(10, "0") + " 00000 n \n";
    out += "trailer\n<< /Size " + objs.length + " /Root 1 0 R /Info " + info + " 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
    return { bytes: latin1Bytes(out), pages: pages.length };
  }

  /* ================= DOCX ================= */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  // Minimal zip writer (stored, no compression) — enough for a .docx.
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0, DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
    function u16(v) { return [v & 255, v >> 8 & 255]; }
    function u32(v) { return [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24 & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      var common = [].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(DATE), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      var local = new Uint8Array([].concat(u32(0x04034b50), common));
      parts.push(local, name, data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), common, u16(0), u16(0), u16(0), u32(0), u32(off))), name);
      off += local.length + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, a) { return s + a.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(off), u16(0)));
    var all = parts.concat(central, [end]), len = all.reduce(function (s, a) { return s + a.length; }, 0), out = new Uint8Array(len), p = 0;
    all.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }
  function x(s) { return String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // Hyperlink relationships for the document being built (reset by buildDOCX).
  var rels = null;
  function relId(url) {
    for (var i = 0; i < rels.length; i++) if (rels[i].url === url) return rels[i].id;
    var id = "rIdL" + (rels.length + 1); rels.push({ id: id, url: url }); return id;
  }
  function linkRuns(segs, base) {
    base = base || {};
    return segs.filter(function (g) { return g.t; }).map(function (g) {
      var r = {}; for (var k in base) r[k] = base[k];
      r.t = g.t; if (g.url) { r.url = g.url; delete r.color; }
      return r;
    });
  }
  // run: {t, b, color, sz (half-points), caps, hl, url}
  function run(r) {
    if (r.url && rels) {
      var inner = {}; for (var k in r) if (k !== "url") inner[k] = r[k];
      inner.link = true;
      return '<w:hyperlink r:id="' + relId(r.url) + '" w:history="1">' + run(inner) + "</w:hyperlink>";
    }
    var pr = (r.link ? '<w:rStyle w:val="Hyperlink"/>' : "") + (r.b ? "<w:b/>" : "") + (r.caps ? "<w:caps/>" : "") + (r.color ? '<w:color w:val="' + r.color + '"/>' : "") + (r.sz ? '<w:sz w:val="' + r.sz + '"/><w:szCs w:val="' + r.sz + '"/>' : "") + (r.hl ? '<w:shd w:val="clear" w:color="auto" w:fill="' + r.hl + '"/>' : "");
    var lines = String(r.t == null ? "" : r.t).split("\n");
    return "<w:r>" + (pr ? "<w:rPr>" + pr + "</w:rPr>" : "") + lines.map(function (l, i) { return (i ? "<w:br/>" : "") + '<w:t xml:space="preserve">' + x(l) + "</w:t>"; }).join("") + "</w:r>";
  }
  function para(runs, o) {
    o = o || {};
    var pr = '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 60 : o.after) + '"/>' + (o.align ? '<w:jc w:val="' + o.align + '"/>' : "") + (o.keep ? "<w:keepNext/>" : "");
    if (o.box) pr = '<w:pBdr><w:top w:val="single" w:sz="18" w:space="4" w:color="' + o.box + '"/><w:left w:val="single" w:sz="18" w:space="4" w:color="' + o.box + '"/><w:bottom w:val="single" w:sz="18" w:space="4" w:color="' + o.box + '"/><w:right w:val="single" w:sz="18" w:space="4" w:color="' + o.box + '"/></w:pBdr>' + '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' + pr;
    if (o.rule) pr = '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="2" w:color="111827"/></w:pBdr>' + pr;
    return "<w:p><w:pPr>" + pr + "</w:pPr>" + runs.map(run).join("") + "</w:p>";
  }
  function cell(w, paras, o) {
    o = o || {};
    var b = "";
    if (o.borders) b = "<w:tcBorders>" + o.borders + "</w:tcBorders>";
    return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + b + (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : "") + "</w:tcPr>" + (paras.length ? paras.join("") : para([{ t: "" }])) + "</w:tc>";
  }
  function bd(side, sz, color) { return "<w:" + side + ' w:val="single" w:sz="' + sz + '" w:space="0" w:color="' + color + '"/>'; }

  function buildDOCX(m) {
    var b = [], G = [1250, 3000, 6550];
    rels = [];
    b.push(para([{ t: m.kicker, b: true, caps: true, color: "6B7280", sz: 16 }], { after: 0 }));
    b.push(para([{ t: m.title, b: true, sz: 36 }], { after: 40 }));
    b.push(para([{ t: "Teacher: " }, { t: m.teacher || "", b: true }, { t: "     Sub: " }, { t: m.sub || "________________", b: true }], { after: 160, rule: true }));
    if (m.duties) {
      b.push(para([{ t: "\u26a0 DUTIES \u2014 PLEASE DON\u2019T MISS", b: true, color: "B91C1C", sz: 20 }, { t: "\n" }].concat(linkRuns(autoLink(m.duties), { b: true, sz: 22 })), { box: "B91C1C", fill: "FDECEC", after: 200, before: 60 }));
    }
    m.info.forEach(function (f) { if (f.value) b.push(para([{ t: f.label + ": ", b: true, color: "4B5563" }].concat(linkRuns(autoLink(f.value))), { after: 80 })); });

    var hdrB = bd("top", 6, "111827") + bd("bottom", 6, "111827") + bd("left", 6, "111827") + bd("right", 6, "111827");
    var tbl = '<w:tbl><w:tblPr><w:tblW w:w="10800" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>' + bd("top", 6, "111827") + bd("left", 6, "111827") + bd("bottom", 6, "111827") + bd("right", 6, "111827") + bd("insideH", 4, "111827") + bd("insideV", 4, "111827") +
      '</w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + G.map(function (g) { return '<w:gridCol w:w="' + g + '"/>'; }).join("") + "</w:tblGrid>";
    tbl += '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + ["Time", "Class", "Plan"].map(function (h, i) { return cell(G[i], [para([{ t: h, b: true, caps: true, sz: 17 }], { after: 0 })], { fill: "E5E7EB", borders: hdrB }); }).join("") + "</w:tr>";
    m.rows.forEach(function (r) {
      var dim = r.kind === "minor", duty = r.kind === "duty";
      var fill = duty ? "FDECEC" : dim ? "F9FAFB" : null;
      var borders = function (i) {
        if (duty) return bd("top", 18, "B91C1C") + bd("bottom", 18, "B91C1C") + (i === 0 ? bd("left", 18, "B91C1C") : "") + (i === 2 ? bd("right", 18, "B91C1C") : "");
        if (r.combined && i === 0) return bd("left", 36, "111827");
        return "";
      };
      var cls = [para([{ t: r.cls, b: true, sz: r.kind === "class" ? 21 : 18, color: dim ? "6B7280" : null }], { after: 20 })];
      (r.tags || []).forEach(function (t) { cls.push(para([{ t: " " + t + " ", b: true, caps: true, sz: 15, color: "B91C1C", hl: "FFF4E5" }], { after: 20 })); });
      (r.sub || []).forEach(function (t) { cls.push(para([{ t: t, sz: 17, color: "4B5563" }], { after: 0 })); });
      if (r.orig) cls.push(para([{ t: "Timetable: " + r.orig, sz: 15, color: "6B7280" }], { after: 0 }));
      var plan = (r.plan || []).map(function (it) {
        var runs = [];
        if (it.k) runs.push({ t: it.k + " ", b: true });
        runs = runs.concat(linkRuns(segsOf(it), { b: !!it.strong, color: it.color === "red" ? "B91C1C" : dim ? "4B5563" : null, sz: dim ? 17 : null }));
        return para(runs, { after: 40 });
      });
      tbl += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cell(G[0], [para([{ t: r.time, b: true, sz: 18, color: dim ? "6B7280" : null }], { after: 0 })], { fill: fill, borders: borders(0) }) + cell(G[1], cls, { fill: fill, borders: borders(1) }) + cell(G[2], plan, { fill: fill, borders: borders(2) }) + "</w:tr>";
    });
    tbl += "</w:tbl>";
    b.push(tbl);
    b.push(para([{ t: m.endNotes ? "End-of-day notes" : "End-of-day notes from the sub (how it went, absences, follow-ups)", b: true, caps: true, sz: 16, color: "4B5563" }], { before: 240, after: 60 }));
    if (m.endNotes) b.push(para(linkRuns(autoLink(m.endNotes))));
    else for (var i = 0; i < 3; i++) b.push('<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="underscore" w:pos="10790"/></w:tabs><w:spacing w:before="160" w:after="60"/></w:pPr><w:r><w:rPr><w:color w:val="9CA3AF"/></w:rPr><w:tab/></w:r></w:p>');
    if (m.backup) b.push(para([{ t: "If a plan falls through: ", b: true, color: "4B5563" }].concat(linkRuns(m.backup.map ? segsOf({ segs: m.backup }) : autoLink(m.backup), { sz: 18 })), { before: 200 }));
    if (m.thanks) b.push(para([{ t: m.thanks, b: true }], { before: 120 }));

    var W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ' + W + "><w:body>" + b.join("") +
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles ' + W + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="19"/><w:szCs w:val="19"/><w:lang w:val="en-CA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="252" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
    var now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    var files = [
      { name: "[Content_Types].xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
      { name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
      { name: "docProps/core.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + x(m.docTitle) + "</dc:title><dc:creator>" + x(m.teacher || "") + '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + "</dcterms:created></cp:coreProperties>" },
      { name: "word/_rels/document.xml.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + rels.map(function (r) { return '<Relationship Id="' + r.id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="' + x(r.url) + '" TargetMode="External"/>'; }).join("") + '</Relationships>' },
      { name: "word/document.xml", data: doc },
      { name: "word/styles.xml", data: styles }
    ];
    return zip(files);
  }

  window.SubExport = {
    pdf: function (m) { var r = buildPDF(m); download(r.bytes, m.fileBase + ".pdf", "application/pdf"); return r.pages; },
    docx: function (m) { download(buildDOCX(m), m.fileBase + ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); },
    _buildPDF: buildPDF, _buildDOCX: buildDOCX
  };
})();
