/* Sub Day Plans — plain JS, no frameworks, no tracking. Data lives in localStorage + share links.
   The app is split into small files that share one script scope, loaded in this order
   (after schedule.js, school-year.js, lesson-catalog.js, autofill.js, export.js, backup-cards.js):
   app-1-state.js, app-2-render.js, app-3-events.js, app-4-print-share.js, app-5-schedule-boot.js.
   This file: printable view, PDF/Word downloads and share links. */
"use strict";

/* ---------- printable / read-only view ---------- */
var printTimer;
function renderPrintSoon() { clearTimeout(printTimer); printTimer = setTimeout(renderPrint, 400); }
function renderPrint() { $("#printView").innerHTML = planHTML(currentDay, schedule.days[currentDay].blocks, plan); }

function planHTML(day, blocks, p) {
  var title = p.date ? fmtDate(p.date) : DAY_LONG[day] || "Sub plan";
  function box(label, val, cls) { return val ? "<div" + (cls ? ' class="' + cls + '"' : "") + "><b>" + label + "</b><p>" + esc(val) + "</p></div>" : ""; }
  var rows = blocks.map(function (b) {
    var bp = (p.blocks || {})[blockKey(b)] || {};
    var time = esc(b.start) + "–" + esc(b.end);
    if (b.duty) {
      return '<tr class="pv-duty"><td class="pv-time">' + time + '</td><td class="pv-cls"><strong>' + esc(b.subject || "Recess") + '</strong><span class="pv-two">DUTY</span></td><td class="pv-plan"><div class="pv-duty-text">⚠ ' + esc(b.duty) + (b.room ? " — " + esc(b.room) : "") + "</div>" + (bp.notes ? "<div>" + esc(bp.notes) + "</div>" : "") + "</td></tr>";
    }
    if (isMinor(b)) {
      return '<tr class="pv-minor"><td class="pv-time">' + time + "</td><td>" + esc(b.subject || (b.type === "prep" ? "Prep" : "Break")) + "</td><td>" + (bp.notes ? esc(bp.notes) : (b.type === "prep" ? "Prep — no class" : "")) + "</td></tr>";
    }
    var parts = [];
    if (bp.special) parts.push('<div><span class="pv-k">Special activity' + (bp.lesson ? ": " : "") + "</span>" + (bp.lesson ? '<span class="pv-k">' + esc(bp.lesson) + "</span>" : "") + "</div>");
    else if (bp.lesson) parts.push('<div><span class="pv-k">' + esc(bp.lesson) + "</span></div>");
    if (bp.materials) parts.push('<div><span class="pv-k">Materials:</span> ' + esc(bp.materials) + "</div>");
    if (bp.instructions) parts.push('<div><span class="pv-k">Instructions:</span> ' + esc(bp.instructions) + "</div>");
    var ls = linkLines(bp.links);
    if (ls.length) parts.push('<div class="pv-links"><span class="pv-k">Links:</span> ' + ls.map(function (l) {
      var u = safeUrl(l.url);
      var shown = esc(u.replace(/^https?:\/\//, ""));
      return (l.label ? esc(l.label) + " — " : "") + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + shown + "</a>" : esc(l.url));
    }).join(" · ") + "</div>");
    if (bp.notes) parts.push('<div><span class="pv-k">Notes:</span> ' + esc(bp.notes) + "</div>");
    if (!parts.length) parts.push('<div class="pv-empty">No plan entered — use a no-prep backup (see bottom).</div>');
    var cls = '<strong>' + esc(classLabel(b) || b.subject) + "</strong>" +
      (b.with ? '<span class="pv-two">TWO CLASSES · combined in ' + esc((b.room || "gym").toLowerCase()) + "</span>" : "") +
      (b.cls ? esc(b.subject) : "") + (b.room ? " · " + esc(b.room) : "") +
      (origNote(b) ? '<span class="pv-orig">Timetable: ' + esc(origNote(b)) + "</span>" : "");
    return '<tr' + (b.with ? ' class="pv-combined"' : "") + '><td class="pv-time">' + time + '</td><td class="pv-cls">' + cls + '</td><td class="pv-plan">' + parts.join("") + "</td></tr>";
  }).join("");
  var end = p.endNotes
    ? '<div class="pv-end"><span class="pv-label">End-of-day notes</span><p style="white-space:pre-wrap;margin:2px 0 0;">' + esc(p.endNotes) + "</p></div>"
    : '<div class="pv-end"><span class="pv-label">End-of-day notes from the sub (how it went, absences, follow-ups)</span><div class="pv-lines"><div></div><div></div><div></div></div></div>';
  return '<header class="pv-head"><div><div class="pv-label">Substitute plan · SCA</div><h1>' + esc(title) + "</h1></div>" +
    '<div class="pv-who">' + (p.teacher ? "Teacher: <strong>" + esc(p.teacher) + "</strong><br>" : "") + "Sub: <strong>" + (p.sub ? esc(p.sub) : "________________") + "</strong></div></header>" +
    '<section class="pv-grid">' + box("⚠ Duties — please don’t miss", p.duties, "pv-duty-box") + box("Bell times", p.bells) + box("Emergency / fire exit", p.emergency) +
    box("Helpful staff", p.contacts) + box("Students to know about", p.needs) + "</section>" +
    '<table class="pv-table"><thead><tr><th>Time</th><th>Class</th><th>Plan</th></tr></thead><tbody>' + rows + "</tbody></table>" + end +
    '<div class="pv-backup"><span class="pv-label">If a plan falls through</span>' + esc(BACKUP_TEXT) + '</div>' +
    '<div class="pv-note">Thank you! Please leave this sheet on the desk.</div>';
}

/* ---------- PDF / Word downloads (export.js builds the files) ---------- */
var BACKUP_TEXT = "No-gym warm-ups: scaemrfung.github.io/pe-playbook/warmup-nogym.html (Ship Ahoy, Bell Bounce) · Grade 1 Music practice studio: scaemrfung.github.io/Grade-1-Music/studio/";
var BACKUP_SEGS = [
  { t: "No-gym warm-ups: " }, { t: "PE Warm Up Games (Ship Ahoy, Bell Bounce)", url: SITES.warmup.url },
  { t: " · Big-group games: " }, { t: "PE Playbook Big-Group Games", url: BASE + "/pe-playbook/games.html" },
  { t: " · Grade 1 Music: " }, { t: "Practice studio", url: SITES.studio.url }
];
function slug(s) { return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function planModel(day, blocks, p) {
  var title = p.date ? fmtDate(p.date) : DAY_LONG[day] || "Sub plan";
  var rows = blocks.map(function (b) {
    var bp = (p.blocks || {})[blockKey(b)] || {};
    var time = b.start + "–" + b.end;
    if (b.duty) {
      var dp = [{ v: "⚠ " + b.duty.toUpperCase() + (b.room ? " — " + b.room.toUpperCase() : ""), strong: true, color: "red" }];
      if (bp.notes) dp.push({ v: bp.notes });
      return { kind: "duty", time: time, cls: b.subject || "Recess", tags: ["Duty"], plan: dp };
    }
    if (isMinor(b)) {
      return { kind: "minor", time: time, cls: b.subject || (b.type === "prep" ? "Prep" : "Break"), plan: [{ v: bp.notes || (b.type === "prep" ? "Prep — no class" : "") }] };
    }
    var plan = [];
    if (bp.special) plan.push({ v: "Special activity" + (bp.lesson ? ": " + bp.lesson : ""), strong: true });
    else if (bp.lesson) plan.push({ v: bp.lesson, strong: true });
    if (bp.materials) plan.push({ k: "Materials:", v: bp.materials });
    if (bp.instructions) plan.push({ k: "Instructions:", v: bp.instructions });
    var ls = linkLines(bp.links);
    if (ls.length) {
      var segs = [];
      ls.forEach(function (l, i) {
        var u = safeUrl(l.url);
        if (i) segs.push({ t: " · " });
        segs.push({ t: l.label || (u || l.url).replace(/^https?:\/\//, ""), url: u });
      });
      plan.push({ k: "Links:", segs: segs, v: "" });
    }
    if (bp.notes) plan.push({ k: "Notes:", v: bp.notes });
    if (!plan.length) plan.push({ v: "No plan entered — use a no-prep backup (see bottom)." });
    return {
      kind: "class", time: time, cls: classLabel(b) || b.subject || "",
      tags: b.with ? ["Two classes · combined in " + (b.room || "gym").toLowerCase()] : [],
      sub: [(b.cls ? b.subject || "" : "") + (b.room ? (b.cls && b.subject ? " · " : "") + b.room : "")].filter(Boolean),
      orig: origNote(b), combined: !!b.with, plan: plan
    };
  });
  var who = p.teacher || TEACHER;
  return {
    fileBase: ["Sub-Plan", slug(who), p.date || "", DAY_LONG[day] || ""].filter(Boolean).join("-"),
    docTitle: "Sub plan · " + title + " · " + who,
    kicker: "Substitute plan · SCA", title: title, teacher: p.teacher || "", sub: p.sub || "",
    duties: p.duties || "",
    info: [{ label: "Bell times", value: p.bells }, { label: "Emergency / fire exit", value: p.emergency }, { label: "Helpful staff", value: p.contacts }, { label: "Students to know about", value: p.needs }],
    rows: rows, endNotes: p.endNotes || "", backup: BACKUP_SEGS,
    thanks: "Thank you! Please leave this sheet on the desk.",
    footer: "Sub plan · " + title + " · " + who
  };
}
function exportFile(kind, day, blocks, p) {
  if (!window.SubExport) { toast("Download isn’t ready yet — reload the page and try again"); return; }
  try {
    var m = planModel(day, blocks, p);
    if (kind === "pdf") { var n = window.SubExport.pdf(m); toast("Downloaded " + m.fileBase + ".pdf (" + n + (n === 1 ? " page)" : " pages)")); }
    else { window.SubExport.docx(m); toast("Downloaded " + m.fileBase + ".docx"); }
  } catch (e) { toast("Couldn’t make the file: " + e.message); }
}

/* ---------- share links (deflate-raw + base64url in the hash) ---------- */
function b64urlEncode(bytes) {
  var s = "", chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  var bin = atob(str), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function pipeBytes(bytes, stream) {
  return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); });
}
function encodeShare(obj) {
  var json = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "undefined") return Promise.resolve("j" + b64urlEncode(json));
  return pipeBytes(json, new CompressionStream("deflate-raw")).then(function (b) { return "z" + b64urlEncode(b); });
}
function decodeShare(s) {
  var kind = s.charAt(0), bytes = b64urlDecode(s.slice(1));
  var p = kind === "z" ? pipeBytes(bytes, new DecompressionStream("deflate-raw")) : Promise.resolve(bytes);
  return p.then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
}
function sharePayload() {
  var blocks = schedule.days[currentDay].blocks;
  var p = clone(plan), used = {};
  blocks.forEach(function (b) {
    var bp = p.blocks[blockKey(b)];
    if (!bp) return;
    bp.links = linkLines(bp.links);
    ["auto", "autoDefault", "pick", "edited", "prev"].forEach(function (f) { delete bp[f]; });
    var empty = !bp.links.length && !bp.special && BLOCK_FIELDS.every(function (f) { return !bp[f]; });
    if (!empty) used[blockKey(b)] = bp;
  });
  p.blocks = used;
  p.date = currentDate || "";
  return { v: 1, d: currentDay, s: blocks.map(function (b) { return [b.start, b.end, b.cls || "", b.subject || "", b.room || "", b.type || "class", b.with || "", b.orig || "", b.duty || ""]; }), p: p };
}
function openShare() {
  savePlanNow();
  encodeShare(sharePayload()).then(function (code) {
    var url = location.origin + location.pathname + "#share=" + code;
    $("#shareUrl").value = url;
    $("#btnOpenLink").href = url;
    var w = $("#shareWarn");
    if (url.length > 8000) { w.hidden = false; w.textContent = "⚠ This link is very long (" + url.length.toLocaleString() + " characters). Many email and text apps will cut it off. Shorten the plan, or print it instead."; }
    else if (url.length > 2000) { w.hidden = false; w.textContent = "⚠ This link is long (" + url.length.toLocaleString() + " characters). It works in browsers, but some text/email apps may break it. Open it once to test before you send it."; }
    else { w.hidden = true; }
    var dlg = $("#shareDialog");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    $("#shareUrl").select();
  }).catch(function (e) { toast("Couldn’t make a link: " + e.message); });
}
function bindShare() {
  $("#btnCopyLink").addEventListener("click", function () {
    var v = $("#shareUrl").value;
    var done = function () { toast("Link copied"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { $("#shareUrl").select(); document.execCommand("copy"); done(); });
    else { $("#shareUrl").select(); document.execCommand("copy"); done(); }
  });
}

function showReadonly(code) {
  document.body.classList.add("readonly");
  $("#readonlyBar").hidden = false;
  $("#roPrint").onclick = function () { window.print(); };
  $("#roEditor").addEventListener("click", function (e) { e.preventDefault(); location.href = location.pathname; });
  decodeShare(code).then(function (data) {
    if (!data || !data.s || !data.p) throw new Error("bad data");
    var blocks = data.s.map(function (a) { return { start: a[0], end: a[1], cls: a[2], subject: a[3], room: a[4], type: a[5], with: a[6] || "", orig: a[7] || "", duty: a[8] || "" }; });
    data.p.blocks = data.p.blocks || {};
    fixTeacher(data.p); fixPlanLabels(data.p);
    $("#printView").innerHTML = planHTML(data.d, blocks, data.p);
    $("#roPdf").onclick = function () { exportFile("pdf", data.d, blocks, data.p); };
    $("#roDocx").onclick = function () { exportFile("docx", data.d, blocks, data.p); };
    document.title = "Sub plan · " + (data.p.date ? fmtDate(data.p.date) : DAY_LONG[data.d] || "") + " · " + TEACHER;
  }).catch(function () {
    $("#printView").innerHTML = '<h2>This share link is damaged</h2><p>Part of the link may have been cut off when it was sent. Ask for the link again, or ask for a printed copy.</p>';
  });
}
