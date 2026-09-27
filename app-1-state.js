/* Sub Day Plans — plain JS, no frameworks, no tracking. Data lives in localStorage + share links.
   The app is split into small files that share one script scope, loaded in this order
   (after schedule.js, school-year.js, lesson-catalog.js, autofill.js, export.js, backup-cards.js):
   app-1-state.js, app-2-render.js, app-3-events.js, app-4-print-share.js, app-5-schedule-boot.js.
   This file: constants, helpers, saved state and plan loading. */
"use strict";

var REPO = "scaemrfung/sub-day-plans";
var LS = "sdp:v1:";
var DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
var DAY_SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri" };
var DAY_LONG = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };
var BASE = "https://scaemrfung.github.io";

var SITES = {
  pe:      { label: "PE Playbook",            url: BASE + "/pe-playbook/" },
  warmup:  { label: "PE Warm Up Games (no gym)", url: BASE + "/pe-playbook/warmup-nogym.html" },
  health:  { label: "Grade 5 Health",         url: BASE + "/grade5health/" },
  imovie:  { label: "Grade 5 iMovie",         url: BASE + "/Grade5-iMovie/" },
  canva:   { label: "Grade 6 Canva",          url: BASE + "/Grade-6-Canva/" },
  music:   { label: "Grade 1 Music",          url: BASE + "/Grade-1-Music/" },
  studio:  { label: "Grade 1 Music · Practice studio", url: BASE + "/Grade-1-Music/studio/" },
  mps:     { label: "Music Practice Studio",  url: BASE + "/music-practice-studio/" },
  scratch: { label: "Grade 6 Scratch",        url: BASE + "/Grade-6-Scratch/" }
};
var SITE_ORDER = ["pe", "warmup", "health", "imovie", "canva", "music", "studio", "mps", "scratch"];

/* Backup cards live in backup-cards.js (loaded before this file). */
var BACKUPS = window.SDP_BACKUP_CARDS || [];

var DAY_FIELDS = ["teacher", "sub", "duties", "bells", "needs", "emergency", "contacts", "endNotes"];
var BLOCK_FIELDS = ["lesson", "materials", "instructions", "notes"];

/* ---------- helpers ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function lsGet(k, fb) { try { var v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { toast("Couldn’t save — storage full or blocked"); return false; } }
function lsDel(k) { try { localStorage.removeItem(LS + k); } catch (e) {} }
function blockKey(b) { return (b.start || "") + "-" + (b.end || ""); }
function isMinor(b) { return b.type === "prep" || b.type === "break"; }
function safeUrl(u) { u = String(u || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; return /^https?:\/\/[^\s]+$/i.test(u) ? u : ""; }
var toastTimer;
function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200); }
function fmtDate(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
function weekdayKey(iso) {
  var d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return null;
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
}
/* Combined PE blocks: a second class in the gym at the same time. Shown exactly like the timetable: "6A (5C)". */
function classLabel(b) { return b.with ? b.cls + " (" + b.with + ")" : (b.cls || ""); }
// Only show the "Timetable: …" line when it says something the class label doesn't.
function origNote(b) { return b.orig && b.orig.replace(/\s+/g, " ").trim() !== classLabel(b) ? b.orig : ""; }
function combinedNote(b) { return b.with ? "Combined in " + (b.room || "gym").toLowerCase() + " · 2 classes" : ""; }
function linkLines(links) { return (links || []).filter(function (l) { return l && l.url; }); }

/* ---------- state ---------- */
var schedule = lsGet("schedule", null) || clone(window.DEFAULT_SCHEDULE || { days: {} });
DAY_KEYS.forEach(function (k) { if (!schedule.days[k]) schedule.days[k] = { label: DAY_LONG[k], bells: "", blocks: [] }; });
var currentDay = lsGet("lastDay", null);
if (DAY_KEYS.indexOf(currentDay) < 0) {
  var today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  currentDay = DAY_KEYS.indexOf(today) >= 0 ? today : "mon";
}
var schedDay = currentDay;
var plan = null;
/* Plans are saved per date ("date:YYYY-MM-DD"). The weekday plans ("day:mon" …) are templates:
   a new date starts from its weekday template, then Music, Health and PE blocks auto-fill. */
var currentDate = "";
var AF = window.SubAutofill || null, SY = window.SCHOOL_YEAR || null;
function closedReason(iso) { return SY ? SY.closedReason(iso) : (/^(sun|sat)$/.test(weekdayKey(iso) || "") ? "Weekend" : null); }
function addDays(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function todayIso() { return SY ? SY.todayISO() : addDays(new Date().toISOString().slice(0, 10), 0); }
function nextSchoolDay(iso) { for (var i = 0; i < 120; i++) { var d = addDays(iso, i); if (!closedReason(d)) return d; } return ""; }

// Teacher name. Older saves used a misspelled default (the name without the final "g");
// it is fixed on load, but only when the Teacher field is exactly that old default.
var TEACHER = "Mr. Fung", OLD_TEACHER = TEACHER.slice(0, -1);
function emptyPlan(day) {
  var sd = schedule.days[day] || {};
  return { date: "", teacher: TEACHER, sub: "", duties: sd.duties || "", bells: (schedule.days[day] && schedule.days[day].bells) || "", needs: "", emergency: "", contacts: "", endNotes: "", blocks: {} };
}
function fixTeacher(o) { if (o && o.teacher === OLD_TEACHER) { o.teacher = TEACHER; return true; } return false; }
(function migrateTeacher() {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf(LS) !== 0) continue;
      var name = k.slice(LS.length);
      if (name.indexOf("day:") !== 0 && name.indexOf("date:") !== 0 && name !== "template") continue;
      var o = lsGet(name, null);
      if (fixTeacher(o)) lsSet(name, o);
    }
  } catch (e) {}
})();
/* Combined classes used to be written "6A + 5C". Put them back in timetable form "6A (5C)"
   in the saved schedule, saved plans and the template (safe to run on every load). */
var PLUS_LABEL = /\b([K1-6][A-Z])\s*\+\s*([K1-6][A-Z])\b/g;
function fixLabelText(v) { return typeof v === "string" ? v.replace(PLUS_LABEL, "$1 ($2)") : v; }
function fixPlanLabels(o) {
  if (!o || typeof o !== "object") return false;
  var before = JSON.stringify(o);
  DAY_FIELDS.forEach(function (f) { if (typeof o[f] === "string") o[f] = fixLabelText(o[f]); });
  Object.keys(o.blocks || {}).forEach(function (k) {
    var bp = o.blocks[k]; if (!bp) return;
    BLOCK_FIELDS.forEach(function (f) { if (typeof bp[f] === "string") bp[f] = fixLabelText(bp[f]); });
    (bp.links || []).forEach(function (l) { if (l && typeof l.label === "string") l.label = fixLabelText(l.label); });
  });
  return JSON.stringify(o) !== before;
}
function fixScheduleBlock(b) {
  var m = !b.with && typeof b.cls === "string" && b.cls.trim().match(/^([K1-6][A-Z])\s*\+\s*([K1-6][A-Z])$/);
  if (m) { b.cls = m[1]; b.with = m[2]; b.orig = fixLabelText(b.orig || "") || m[1] + " (" + m[2] + ")"; return true; }
  if (typeof b.orig === "string" && PLUS_LABEL.test(b.orig)) { PLUS_LABEL.lastIndex = 0; b.orig = fixLabelText(b.orig); return true; }
  PLUS_LABEL.lastIndex = 0;
  return false;
}
(function migrateLabels() {
  try {
    var changed = false;
    DAY_KEYS.forEach(function (k) { (schedule.days[k].blocks || []).forEach(function (b) { if (fixScheduleBlock(b)) changed = true; }); });
    if (changed && lsGet("schedule", null)) lsSet("schedule", schedule);
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || key.indexOf(LS) !== 0) continue;
      var name = key.slice(LS.length);
      if (name.indexOf("day:") !== 0 && name.indexOf("date:") !== 0 && name !== "template") continue;
      var o = lsGet(name, null);
      if (fixPlanLabels(o)) lsSet(name, o);
    }
  } catch (e) {}
})();
function loadPlan(day) {
  var p = lsGet("day:" + day, null);
  if (p && fixTeacher(p)) lsSet("day:" + day, p);
  if (!p) p = emptyPlan(day);
  if (!p.blocks) p.blocks = {};
  return p;
}
/* A date's plan: saved one, or a new one started from the weekday template. */
function loadDatePlan(date) {
  var wk = weekdayKey(date);
  var p = lsGet("date:" + date, null);
  if (p) { fixTeacher(p); if (!p.blocks) p.blocks = {}; p.date = date; }
  else {
    var base = lsGet("day:" + wk, null), sameDay = base && base.date === date;
    p = emptyPlan(wk); p.date = date;
    if (base) {
      DAY_FIELDS.forEach(function (f) { if (sameDay || (f !== "sub" && f !== "endNotes")) p[f] = base[f] || p[f] || ""; });
      (schedule.days[wk].blocks || []).forEach(function (b) {
        var from = (base.blocks || {})[blockKey(b)];
        if (!from) return;
        var auto = AF && AF.srcOf(b);
        var t = blockPlan(p, b);
        t.notes = from.notes || "";
        // Blocks with a lesson site auto-fill, unless the old weekday plan was written for exactly this date.
        if (!auto || sameDay) { ["lesson", "materials", "instructions"].forEach(function (f) { t[f] = from[f] || ""; }); t.links = clone(from.links || []); if (auto && (t.lesson || t.instructions)) t.edited = true; }
      });
    }
  }
  applyAuto(p, date, wk);
  return p;
}
/* Fill Music / Health / PE blocks that the teacher hasn't edited. Notes are never touched. */
function applyAuto(p, date, wk) {
  if (!AF || !date) return;
  (schedule.days[wk].blocks || []).forEach(function (b) { autoBlock(p, b, date); });
}
function autoBlock(p, b, date) {
  var src = AF && AF.srcOf(b);
  if (!src || !date) return;
  var bp = blockPlan(p, b);
  if (bp.edited || bp.special) return;
  var def = AF.resolve(date, b, schedule.days);
  if (!def) return;
  var ref = bp.pick ? AF.pickRef(def, src, bp.pick) : def;
  var c = AF.content(ref, b);
  bp.lesson = c.lesson; bp.materials = c.materials; bp.instructions = c.instructions; bp.links = c.links;
  bp.auto = AF.refLabel(ref); bp.autoDefault = AF.refLabel(def);
}
function resetBlock(b) {
  var bp = blockPlan(plan, b);
  delete bp.edited; delete bp.special; delete bp.pick; delete bp.prev;
  if (AF && AF.srcOf(b)) autoBlock(plan, b, currentDate);
}
function markEdited(bp) { if (bp && !bp.special && (bp.auto || bp.pick)) bp.edited = true; }
function blockPlan(p, b) {
  var k = blockKey(b);
  if (!p.blocks[k]) p.blocks[k] = { lesson: "", materials: "", instructions: "", notes: "", links: [] };
  if (!p.blocks[k].links) p.blocks[k].links = [];
  return p.blocks[k];
}
var saveTimer;
function savePlanSoon() {
  $("#saveState").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(savePlanNow, 250);
}
function savePlanNow() {
  clearTimeout(saveTimer);
  if (lsSet(currentDate ? "date:" + currentDate : "day:" + currentDay, plan)) {
    var t = new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
    $("#saveState").textContent = "Saved in this browser · " + t;
  }
}
function saveSchedule() { lsSet("schedule", schedule); }
