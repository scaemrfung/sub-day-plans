/* Sub Day Plans — plain JS, no frameworks, no tracking. Data lives in localStorage + share links.
   The app is split into small files that share one script scope, loaded in this order
   (after schedule.js, school-year.js, lesson-catalog.js, autofill.js, export.js, backup-cards.js):
   app-1-state.js, app-2-render.js, app-3-events.js, app-4-print-share.js, app-5-schedule-boot.js.
   This file: day picker, calendar and rendering the block editor. */
"use strict";

/* ---------- day picker ---------- */
function renderDayPicker() {
  $("#dayPicker").innerHTML = DAY_KEYS.map(function (k) {
    return '<button type="button" role="radio" aria-checked="' + (!currentDate && k === currentDay) + '" data-daykey="' + k + '">' + DAY_SHORT[k] + "</button>";
  }).join("");
  var sel = $("#copyFrom");
  sel.innerHTML = '<option value="">Copy from another day…</option>' + DAY_KEYS.filter(function (k) { return currentDate || k !== currentDay; }).map(function (k) {
    return '<option value="' + k + '">Copy from ' + DAY_LONG[k] + (currentDate ? " template" : "") + "</option>";
  }).join("");
}
function selectDay(day, keepDate) {
  if (plan) savePlanNow();
  currentDay = day; currentDate = "";
  lsSet("lastDay", day); lsSet("lastDate", "");
  plan = loadPlan(day);
  plan.date = "";
  renderAll();
}
function selectDate(date) {
  var why = closedReason(date);
  if (why) { toast("No school on " + fmtDate(date) + ": " + why + ". Pick a school day."); return false; }
  if (plan) savePlanNow();
  currentDate = date; currentDay = weekdayKey(date);
  calMonth = date.slice(0, 7);
  lsSet("lastDate", date); lsSet("lastDay", currentDay);
  plan = loadDatePlan(date);
  renderAll();
  return true;
}

/* ---------- month calendar: non-school days greyed out and labelled ---------- */
var calMonth = "", startNote = "";
var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function shortReason(why) { return why === "Weekend" ? "" : why; }
function renderCalendar() {
  var box = $("#dateCal"); if (!box) return;
  if (!calMonth) calMonth = (currentDate || todayIso()).slice(0, 7);
  var y = +calMonth.slice(0, 4), m = +calMonth.slice(5, 7);
  var first = calMonth + "-01", lead = (new Date(first + "T12:00:00").getDay() + 6) % 7;
  var daysIn = new Date(y, m, 0).getDate(), today = todayIso(), cells = [], off = [];
  for (var i = 0; i < lead; i++) cells.push('<span class="cal-cell cal-pad"></span>');
  for (var d = 1; d <= daysIn; d++) {
    var iso = calMonth + "-" + ("0" + d).slice(-2), why = closedReason(iso), wk = weekdayKey(iso);
    var cls = "cal-cell" + (why ? " cal-off" : "") + (why === "Weekend" ? " cal-wkend" : "") + (!why && wk === "wed" ? " cal-short" : "") +
      (iso === currentDate ? " cal-sel" : "") + (iso === today ? " cal-today" : "");
    var title = why ? "No school: " + why : fmtDate(iso) + (wk === "wed" ? " · short day (early dismissal)" : "");
    if (why && why !== "Weekend" && off.every(function (o) { return o.why !== why || o.last !== addDays(iso, -1) && o.last !== addDays(iso, -3); })) off.push({ from: iso, last: iso, why: why });
    else if (why && why !== "Weekend") { var o = off.filter(function (o) { return o.why === why; }).pop(); o.last = iso; }
    cells.push('<button type="button" class="' + cls + '" data-date="' + iso + '" title="' + esc(title) + '" aria-label="' + esc(title) + '"' +
      (why ? ' aria-disabled="true"' : "") + (iso === currentDate ? ' aria-pressed="true"' : "") + ">" + d + "</button>");
  }
  function md(iso) { return MONTH_NAMES[+iso.slice(5, 7) - 1].slice(0, 3) + " " + (+iso.slice(8, 10)); }
  function mdRange(a, b) { return a === b ? md(a) : md(a) + "–" + (a.slice(5, 7) === b.slice(5, 7) ? +b.slice(8, 10) : md(b)); }
  box.innerHTML = '<div class="cal-head"><button type="button" class="icon-btn" data-cal="-1" aria-label="Previous month">‹</button>' +
    '<strong>' + MONTH_NAMES[m - 1] + " " + y + '</strong><button type="button" class="icon-btn" data-cal="1" aria-label="Next month">›</button></div>' +
    '<div class="cal-grid" role="group" aria-label="School days in ' + MONTH_NAMES[m - 1] + '">' +
    ["M", "T", "W", "T", "F", "S", "S"].map(function (x) { return '<span class="cal-dow">' + x + "</span>"; }).join("") + cells.join("") + "</div>" +
    '<div class="cal-legend"><span><i class="cal-key cal-key-off"></i>No school</span><span><i class="cal-key cal-key-short"></i>Wed short day</span></div>' +
    (off.length ? '<ul class="cal-offlist">' + off.map(function (o) {
      return "<li><b>" + mdRange(o.from, o.last) + "</b> " + esc(o.why) + "</li>";
    }).join("") + "</ul>" : "");
}

/* ---------- rendering the editor ---------- */
function renderAll() {
  renderDayPicker();
  renderCalendar();
  $("#dayHeading").textContent = currentDate ? DAY_LONG[currentDay] + " · " + fmtDate(currentDate).replace(/^\w+, /, "") : DAY_LONG[currentDay] + " template (no date)";
  var sum = currentDate && AF ? AF.daySummary(currentDate) : "";
  $("#daySummary").innerHTML = currentDate
    ? (currentDay === "wed" ? '<span class="badge short-badge">Short day · early dismissal</span> ' : "") + esc(sum) +
      '<span class="day-summary-note">Music, Health and PE blocks are filled in from the lesson sites for this date. Edit anything; your changes are saved for this date only.</span>'
    : "Weekday template: plans without a date. A new date starts from its weekday template, then Music, Health and PE fill in by themselves. Pick a date above to plan a real day.";
  $("#dateInput").value = currentDate || "";
  $("#dateHint").textContent = currentDate ? "Prints as " + fmtDate(currentDate) + "." : "No date picked: editing the " + DAY_LONG[currentDay] + " template.";
  if (startNote) { $("#dateHint").textContent = startNote + " " + $("#dateHint").textContent; startNote = ""; }
  $("#btnResetAll").hidden = !currentDate;
  $all("[data-day]").forEach(function (el) { el.value = plan[el.getAttribute("data-day")] || ""; });
  renderBlocks();
  renderPrint();
}

function siteOptions(selected) {
  return '<option value="">Add a lesson-site link…</option>' + SITE_ORDER.map(function (k) {
    return '<option value="' + k + '"' + (k === selected ? " selected" : "") + ">" + esc(SITES[k].label) + "</option>";
  }).join("") + '<option value="custom">Other link (type it)…</option>';
}

function renderBlocks() {
  var blocks = schedule.days[currentDay].blocks;
  if (!blocks.length) {
    $("#blocks").innerHTML = '<div class="card">No blocks for this day yet. Add some in <a href="#schedule">Weekly schedule</a>.</div>';
    return;
  }
  $("#blocks").innerHTML = blocks.map(function (b, i) {
    var bp = blockPlan(plan, b);
    var subj = esc(b.subject || "");
    var side = '<div class="block-side"><div class="block-time">' + esc(b.start) + "–" + esc(b.end) + "</div>" +
      '<div class="block-class">' + (b.cls ? esc(classLabel(b)) : subj) + "</div>" +
      (b.with ? '<div class="block-combined"><span class="badge combined-badge">' + esc(combinedNote(b)) + "</span></div>" : "") +
      (b.duty ? '<div class="block-subject"><span class="badge duty-badge">DUTY</span></div>' : "") +
      (b.cls && subj ? '<div class="block-subject"><span class="badge subj-' + subj.replace(/\W/g, "") + '">' + subj + "</span></div>" : "") +
      (b.room ? '<div class="block-room">📍 ' + esc(b.room) + "</div>" : "") +
      (origNote(b) ? '<div class="block-orig">Timetable: ' + esc(origNote(b)) + "</div>" : "") + "</div>";
    if (b.duty) {
      return '<div class="block minor duty" data-idx="' + i + '">' + side + '<div class="block-body">' +
        '<div class="duty-flag">⚠ DUTY: ' + esc(b.duty) + (b.room ? " · " + esc(b.room) : "") + "</div>" +
        '<label class="field"><span>Duty note for the sub</span><input type="text" data-bf="notes" value="' + esc(bp.notes) + '" placeholder="e.g. Head to the Library as soon as the recess bell goes" /></label></div></div>';
    }
    if (isMinor(b)) {
      return '<div class="block minor" data-idx="' + i + '">' + side + '<div class="block-body">' +
        '<label class="field"><span>' + (b.type === "prep" ? "Note (prep — no class)" : "Note (e.g. supervision duty)") + '</span><input type="text" data-bf="notes" value="' + esc(bp.notes) + '" placeholder="' + (b.type === "prep" ? "Nothing needed — prep time" : "e.g. Outside supervision, back field") + '" /></label></div></div>';
    }
    var src = AF && currentDate ? AF.srcOf(b) : null;
    var bar = "";
    if (currentDate) {
      var badges = bp.special ? '<span class="badge st-special">Special activity</span>' : "";
      if (src && !bp.special) badges += bp.edited ? '<span class="badge st-edited">Edited</span>' : bp.pick ? '<span class="badge st-swapped">Swapped</span>' : bp.auto ? '<span class="badge st-auto">Auto-filled</span>' : "";
      var cur = bp.auto ? (bp.special ? "Replaces: " : "From the site: ") + esc(bp.auto) + (bp.pick && bp.autoDefault && bp.autoDefault !== bp.auto ? " (planned: " + esc(bp.autoDefault) + ")" : "") : (src ? "" : "Manual block — no lesson site");
      var pick = "";
      if (src && !bp.special) {
        var def = AF.resolve(currentDate, b, schedule.days);
        var r = bp.pick ? AF.pickRef(def, src, bp.pick) : def;
        if (r && r.kind && r.kind !== "lesson") r = { src: src, week: r.week, cls: 1 };
        if (r) pick = '<details class="swap"' + '><summary>Swap lesson</summary><div class="swap-row">' + AF.pickerHTML(src, r, esc) +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="usepick">Use this lesson</button></div></details>';
      }
      bar = '<div class="auto-bar"><div class="auto-status">' + badges + '<span class="auto-cur">' + cur + "</span></div>" + pick +
        '<div class="auto-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="special" aria-pressed="' + !!bp.special + '">' + (bp.special ? "✓ Special activity" : "Mark as special activity") + "</button>" +
        (src && (bp.edited || bp.pick || bp.special) || (!src && bp.special) ? '<button type="button" class="btn btn-ghost btn-sm" data-act="reset">↺ Reset' + (src ? " to auto-fill" : "") + "</button>" : "") + "</div></div>";
    }
    var links = bp.links.map(function (l, j) {
      return '<div class="link-row" data-link="' + j + '"><input type="text" data-lf="label" value="' + esc(l.label) + '" placeholder="Label" aria-label="Link label" />' +
        '<input type="url" data-lf="url" value="' + esc(l.url) + '" placeholder="https://…" aria-label="Link URL" />' +
        '<button type="button" class="icon-btn" data-act="rmlink" aria-label="Remove link">✕</button></div>';
    }).join("");
    return '<div class="block' + (bp.special ? " is-special" : bp.edited ? " is-edited" : "") + '" data-idx="' + i + '">' + side + '<div class="block-body">' + bar +
      '<label class="field full"><span>' + (bp.special ? "Special activity" : "Lesson / activity") + '</span><input type="text" data-bf="lesson" value="' + esc(bp.lesson) + '" placeholder="' + (bp.special ? "e.g. Remembrance Day assembly in the gym, then back to class" : "e.g. Football week 5: flag pulling tag, then routes") + '" /></label>' +
      '<label class="field"><span>Materials &amp; where to find them</span><textarea data-bf="materials" rows="' + Math.min(4, Math.max(2, Math.ceil(String(bp.materials || "").length / 55))) + '" placeholder="e.g. Flags and pinnies in the blue bin, equipment room">' + esc(bp.materials) + "</textarea></label>" +
      '<label class="field"><span>Instructions for the sub</span><textarea data-bf="instructions" rows="' + Math.min(7, Math.max(2, Math.ceil(String(bp.instructions || "").length / 55))) + '" placeholder="Step by step. Where to pick up and drop off the class.">' + esc(bp.instructions) + "</textarea></label>" +
      '<div class="field full"><span>Links</span><div class="links-editor">' + links +
      '<div class="link-add"><select data-act="addsite" aria-label="Add a lesson-site link">' + siteOptions("") + "</select>" +
      (b.link && SITES[b.link] && !bp.links.some(function (l) { return l.url === SITES[b.link].url; }) ? '<button type="button" class="icon-btn" data-act="suggest" data-site="' + b.link + '">+ ' + esc(SITES[b.link].label) + "</button>" : "") +
      "</div></div></div>" +
      '<label class="field full"><span>Notes</span><textarea data-bf="notes" rows="2" placeholder="Anything else: early finishers, who helps, what to skip.">' + esc(bp.notes) + "</textarea></label>" +
      "</div></div>";
  }).join("");
}

function currentBlock(el) {
  var card = el.closest("[data-idx]");
  return card ? schedule.days[currentDay].blocks[+card.getAttribute("data-idx")] : null;
}
function currentBlockPlan(el) {
  var card = el.closest("[data-idx]");
  if (!card) return null;
  var b = schedule.days[currentDay].blocks[+card.getAttribute("data-idx")];
  return b ? blockPlan(plan, b) : null;
}
