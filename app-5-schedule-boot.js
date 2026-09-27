/* Sub Day Plans — plain JS, no frameworks, no tracking. Data lives in localStorage + share links.
   The app is split into small files that share one script scope, loaded in this order
   (after schedule.js, school-year.js, lesson-catalog.js, autofill.js, export.js, backup-cards.js):
   app-1-state.js, app-2-render.js, app-3-events.js, app-4-print-share.js, app-5-schedule-boot.js.
   This file: schedule editor, backup cards, Updated stamp and start-up. */
"use strict";

/* ---------- schedule editor ---------- */
function renderSchedule() {
  $("#schedDayPicker").innerHTML = DAY_KEYS.map(function (k) {
    return '<button type="button" role="tab" aria-selected="' + (k === schedDay) + '" data-sday="' + k + '">' + DAY_SHORT[k] + "</button>";
  }).join("");
  var d = schedule.days[schedDay];
  $("#schedBells").value = d.bells || "";
  $("#schedDuties").value = d.duties || "";
  var types = [["class", "Class"], ["prep", "Prep"], ["break", "Recess/lunch"]];
  $("#schedTable tbody").innerHTML = d.blocks.map(function (b, i) {
    return '<tr data-row="' + i + '">' +
      '<td class="t"><input type="text" data-sf="start" value="' + esc(b.start) + '" aria-label="Start time" /></td>' +
      '<td class="t"><input type="text" data-sf="end" value="' + esc(b.end) + '" aria-label="End time" /></td>' +
      '<td><input type="text" data-sf="cls" value="' + esc(b.cls) + '" aria-label="Class or grade" /></td>' +
      '<td><input type="text" data-sf="with" value="' + esc(b.with) + '" placeholder="—" aria-label="Second class in the gym (shown in brackets)" title="' + esc(b.orig ? "Timetable: " + b.orig : "") + '" /></td>' +
      '<td><input type="text" data-sf="subject" value="' + esc(b.subject) + '" aria-label="Subject" /></td>' +
      '<td><input type="text" data-sf="room" value="' + esc(b.room) + '" aria-label="Room" /></td>' +
      '<td><input type="text" data-sf="duty" value="' + esc(b.duty) + '" placeholder="—" aria-label="Supervision duty" /></td>' +
      '<td><select data-sf="type" aria-label="Type">' + types.map(function (t) { return '<option value="' + t[0] + '"' + (b.type === t[0] ? " selected" : "") + ">" + t[1] + "</option>"; }).join("") + "</select></td>" +
      '<td><select data-sf="link" aria-label="Suggested site"><option value="">—</option>' + SITE_ORDER.map(function (k) { return '<option value="' + k + '"' + (b.link === k ? " selected" : "") + ">" + esc(SITES[k].label) + "</option>"; }).join("") + "</select></td>" +
      '<td class="act"><button type="button" class="icon-btn" data-sact="up" aria-label="Move up">↑</button> <button type="button" class="icon-btn" data-sact="down" aria-label="Move down">↓</button> <button type="button" class="icon-btn" data-sact="del" aria-label="Delete block">✕</button></td></tr>';
  }).join("") || '<tr><td colspan="10" class="hint">No blocks. Use “+ Add block”.</td></tr>';
  var src = schedule.source || (window.DEFAULT_SCHEDULE && window.DEFAULT_SCHEDULE.source);
  $("#scheduleSource").textContent = (lsGet("schedule", null) ? "Edited in this browser. " : "Default from schedule.js. ") + (src ? "Loaded from " + src + "." : "");
}
function scheduleChanged() {
  saveSchedule();
  renderSchedule();
  if (schedDay === currentDay) { renderBlocks(); renderPrint(); }
}
function bindSchedule() {
  $("#schedDayPicker").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sday]"); if (!b) return;
    schedDay = b.getAttribute("data-sday"); renderSchedule();
  });
  var tb = $("#schedTable tbody");
  function onField(e) {
    var el = e.target, f = el.getAttribute("data-sf"); if (!f) return;
    var row = +el.closest("[data-row]").getAttribute("data-row");
    schedule.days[schedDay].blocks[row][f] = el.value;
    saveSchedule();
    $("#scheduleSource").textContent = "Edited in this browser.";
    if (schedDay === currentDay) { renderBlocks(); renderPrintSoon(); }
  }
  tb.addEventListener("change", onField);
  tb.addEventListener("input", function (e) { if (e.target.tagName === "INPUT") onField(e); });
  tb.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sact]"); if (!b) return;
    var list = schedule.days[schedDay].blocks, i = +b.closest("[data-row]").getAttribute("data-row"), a = b.getAttribute("data-sact");
    if (a === "del") { if (!confirm("Delete this block?")) return; list.splice(i, 1); }
    if (a === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
    if (a === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
    scheduleChanged();
  });
  $("#schedBells").addEventListener("input", function () { schedule.days[schedDay].bells = this.value; saveSchedule(); });
  $("#schedDuties").addEventListener("input", function () { schedule.days[schedDay].duties = this.value; saveSchedule(); });
  $("#btnAddBlock").addEventListener("click", function () {
    var list = schedule.days[schedDay].blocks, last = list[list.length - 1];
    list.push({ start: last ? last.end : "8:37", end: "", cls: "", subject: "", room: "", type: "class" });
    scheduleChanged();
    var inputs = $all('#schedTable tbody tr:last-child input'); if (inputs[1]) inputs[1].focus();
  });
  $("#btnResetSchedule").addEventListener("click", function () {
    if (!confirm("Reset the whole weekly schedule to the default in schedule.js? Your plans stay saved.")) return;
    lsDel("schedule"); schedule = clone(window.DEFAULT_SCHEDULE); scheduleChanged(); toast("Schedule reset to default");
  });
  $("#btnExport").addEventListener("click", function () {
    var data = JSON.stringify(schedule, null, 2);
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = "sub-day-plans-schedule.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("Schedule exported as JSON");
  });
  $("#btnImport").addEventListener("click", function () { $("#importText").value = ""; $("#importDialog").showModal(); });
  $("#btnImportFile").addEventListener("click", function () { $("#importFile").click(); });
  $("#importFile").addEventListener("change", function () {
    var f = this.files[0]; if (!f) return;
    f.text().then(function (t) { $("#importText").value = t; });
    this.value = "";
  });
  $("#btnImportApply").addEventListener("click", function () {
    try {
      var raw = $("#importText").value.trim().replace(/^window\.DEFAULT_SCHEDULE\s*=\s*/, "").replace(/;\s*$/, "");
      var obj = JSON.parse(raw);
      if (!obj || !obj.days) throw new Error("No “days” in that JSON");
      DAY_KEYS.forEach(function (k) {
        var d = obj.days[k] || { blocks: [] };
        if (!Array.isArray(d.blocks)) throw new Error(k + ".blocks must be a list");
        d.label = d.label || DAY_LONG[k];
        d.blocks = d.blocks.map(function (b) { return { start: String(b.start || ""), end: String(b.end || ""), cls: String(b.cls || ""), with: String(b.with || ""), orig: String(b.orig || ""), subject: String(b.subject || ""), room: String(b.room || ""), duty: String(b.duty || ""), type: ["class", "prep", "break"].indexOf(b.type) >= 0 ? b.type : "class", link: SITES[b.link] ? b.link : "" }; });
        d.blocks.forEach(fixScheduleBlock);
        obj.days[k] = d;
      });
      schedule = obj; scheduleChanged(); $("#importDialog").close(); toast("Schedule imported");
    } catch (err) { alert("Couldn’t import: " + err.message); }
  });
}

/* ---------- backup cards ---------- */
function renderBackups() {
  $("#backupCards").innerHTML = BACKUPS.map(function (b, i) {
    return '<div class="card backup-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;"><h3>' + esc(b.title) + '</h3><span class="badge">' + esc(b.badge) + "</span></div>" +
      "<ul>" + b.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<div class="backup-foot"><a href="' + esc(b.url) + '" target="_blank" rel="noopener">Open ' + esc(b.site) + " →</a></div>" +
      (b.extra ? '<div class="backup-foot" style="margin-top:4px;"><a href="' + esc(b.extra.url) + '" target="_blank" rel="noopener">' + esc(b.extra.label) + " →</a></div>" : "") +
      '<div class="backup-foot" style="margin-top:10px;"><select data-backup="' + i + '" aria-label="Use in a block"><option value="">Use in a block…</option></select></div></div>';
  }).join("");
  refreshBackupSelects();
}
function refreshBackupSelects() {
  var opts = schedule.days[currentDay].blocks.map(function (b, i) { return isMinor(b) ? "" : '<option value="' + i + '">' + esc(b.start + " " + classLabel(b) + " " + (b.subject || "")) + "</option>"; }).join("");
  var when = currentDate ? fmtDate(currentDate).replace(/^\w+, /, "").replace(/, \d{4}$/, "") : DAY_SHORT[currentDay];
  $all("[data-backup]").forEach(function (s) { s.innerHTML = '<option value="">Use in a block (' + when + ")…</option>" + opts; });
}
function bindBackups() {
  $("#backupCards").addEventListener("change", function (e) {
    var s = e.target; if (!s.hasAttribute("data-backup") || s.value === "") return;
    var bk = BACKUPS[+s.getAttribute("data-backup")], b = schedule.days[currentDay].blocks[+s.value];
    var bp = blockPlan(plan, b);
    if ((bp.lesson || bp.instructions) && !confirm("That block already has a plan. Replace the lesson and instructions?")) { s.value = ""; return; }
    markEdited(bp); delete bp.special;
    bp.lesson = bk.lesson; bp.instructions = bk.instructions;
    if (!bp.links.some(function (l) { return l.url === bk.url; })) bp.links.push({ label: bk.site, url: bk.url });
    savePlanNow(); renderBlocks(); renderPrint(); s.value = "";
    toast("Added to " + b.start + " " + classLabel(b));
  });
}

/* ---------- "Updated … MT" stamp (same as the other lesson sites) ---------- */
function ensureUpdatedStamp(repo) {
  if (document.querySelector(".site-updated-stamp")) return;
  var el = document.createElement("div");
  el.className = "site-updated-stamp no-print";
  el.setAttribute("aria-label", "Site last updated");
  el.textContent = "Updated …";
  document.body.insertBefore(el, document.body.firstChild);
  function formatStamp(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) d = new Date();
    return "Updated " + new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d) + " MT";
  }
  /* Baked in at publish time (meta name="site-updated"), so no network call is needed. */
  var meta = document.querySelector('meta[name="site-updated"]');
  el.textContent = formatStamp((meta && meta.content) || document.lastModified || new Date().toISOString());
}

/* ---------- boot ---------- */
function boot() {
  ensureUpdatedStamp(REPO);
  var m = location.hash.match(/^#share=([A-Za-z0-9_-]+)/);
  if (m) { showReadonly(m[1]); return; }
  var last = lsGet("lastDate", null), start = "";
  if (last && !closedReason(last) && last >= todayIso()) start = last;
  else if (last === null || last) start = SY ? nextSchoolDay(todayIso()) : "";
  if (/[?&]today=/.test(location.search) && SY) start = nextSchoolDay(todayIso());
  if (start && closedReason(start)) start = "";
  var t0 = todayIso(), why0 = closedReason(t0);
  if (start && start !== t0 && why0 && why0 !== "Weekend" && start === nextSchoolDay(t0)) startNote = "Today (" + fmtDate(t0).replace(/, \d{4}$/, "") + ") is not a school day: " + why0 + ". Showing the next school day.";
  if (start) { currentDate = start; currentDay = weekdayKey(start); calMonth = start.slice(0, 7); plan = loadDatePlan(start); }
  else { plan = loadPlan(currentDay); plan.date = ""; calMonth = todayIso().slice(0, 7); }
  bindEditor(); bindShare(); bindSchedule(); bindBackups();
  renderAll(); renderSchedule(); renderBackups();
  var origRenderAll = renderAll;
  renderAll = function () { origRenderAll(); refreshBackupSelects(); };
  window.addEventListener("beforeprint", function () { if (plan) { savePlanNow(); renderPrint(); } });
  window.addEventListener("hashchange", function () { if (/^#share=/.test(location.hash)) location.reload(); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
