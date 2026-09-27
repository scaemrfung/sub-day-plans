/* Sub Day Plans — plain JS, no frameworks, no tracking. Data lives in localStorage + share links.
   The app is split into small files that share one script scope, loaded in this order
   (after schedule.js, school-year.js, lesson-catalog.js, autofill.js, export.js, backup-cards.js):
   app-1-state.js, app-2-render.js, app-3-events.js, app-4-print-share.js, app-5-schedule-boot.js.
   This file: editor events and copying plans. */
"use strict";

/* ---------- editor events ---------- */
function bindEditor() {
  $("#dayPicker").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-daykey]");
    if (!btn) return;
    selectDay(btn.getAttribute("data-daykey"));
  });
  $("#dateInput").addEventListener("change", function () {
    var v = this.value;
    if (!v) { selectDay(currentDay); return; }
    if (!selectDate(v)) this.value = currentDate || "";
  });
  $("#dateCal").addEventListener("click", function (e) {
    var nav = e.target.closest("[data-cal]");
    if (nav) {
      var y = +calMonth.slice(0, 4), m = +calMonth.slice(5, 7) - 1 + (+nav.getAttribute("data-cal"));
      var d = new Date(y, m, 1); calMonth = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2);
      renderCalendar(); return;
    }
    var c = e.target.closest("[data-date]");
    if (c) selectDate(c.getAttribute("data-date"));
  });
  $("#btnToday").addEventListener("click", function () { var d = nextSchoolDay(todayIso()); if (d) selectDate(d); else toast("No school days coming up — it’s summer."); });
  $all("[data-day]").forEach(function (el) {
    el.addEventListener("input", function () { plan[el.getAttribute("data-day")] = el.value; savePlanSoon(); renderPrintSoon(); });
  });
  var blocksEl = $("#blocks");
  blocksEl.addEventListener("input", function (e) {
    var el = e.target, bp = currentBlockPlan(el);
    if (!bp) return;
    var f = el.getAttribute("data-bf");
    if (f) bp[f] = el.value;
    else if (el.hasAttribute("data-lf")) { var j = +el.closest("[data-link]").getAttribute("data-link"); bp.links[j][el.getAttribute("data-lf")] = el.value; }
    else return;
    if (f !== "notes" && currentDate && !bp.edited && !bp.special && (bp.auto || bp.pick)) { markEdited(bp); refreshBar(el); }
    savePlanSoon(); renderPrintSoon();
  });
  blocksEl.addEventListener("change", function (e) {
    var el = e.target;
    if (el.getAttribute("data-act") !== "addsite" || !el.value) return;
    var bp = currentBlockPlan(el);
    markEdited(bp);
    if (el.value === "custom") bp.links.push({ label: "", url: "" });
    else bp.links.push({ label: SITES[el.value].label, url: SITES[el.value].url });
    savePlanNow(); renderBlocks(); renderPrint();
  });
  blocksEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn || btn.tagName === "SELECT") return;
    var bp = currentBlockPlan(btn);
    if (!bp) return;
    var act = btn.getAttribute("data-act"), b = currentBlock(btn);
    if (act === "rmlink") { markEdited(bp); bp.links.splice(+btn.closest("[data-link]").getAttribute("data-link"), 1); }
    else if (act === "suggest") { markEdited(bp); var s = SITES[btn.getAttribute("data-site")]; bp.links.push({ label: s.label, url: s.url }); }
    else if (act === "usepick") {
      var v = {};
      $all("[data-pick]", btn.closest(".swap")).forEach(function (sel) { v[sel.getAttribute("data-pick")] = sel.value; });
      if (bp.edited && !confirm("Replace your edits in this block with the chosen lesson?")) return;
      delete bp.edited; bp.pick = v;
      autoBlock(plan, b, currentDate);
      toast("Swapped to " + bp.auto);
    }
    else if (act === "special") {
      if (!bp.special) {
        bp.prev = { lesson: bp.lesson, materials: bp.materials, instructions: bp.instructions, links: clone(bp.links), edited: !!bp.edited };
        bp.special = true; bp.lesson = ""; bp.materials = ""; bp.instructions = ""; bp.links = [];
      } else {
        var pv = bp.prev; delete bp.special; delete bp.prev;
        if (pv) { bp.lesson = pv.lesson; bp.materials = pv.materials; bp.instructions = pv.instructions; bp.links = pv.links || []; if (pv.edited) bp.edited = true; }
        if (!bp.edited) autoBlock(plan, b, currentDate);
      }
    }
    else if (act === "reset") {
      if ((bp.edited || bp.special) && !confirm("Reset this block? Your changes to it will be lost (notes stay).")) return;
      resetBlock(b);
      toast("Block reset");
    }
    else return;
    savePlanNow(); renderBlocks(); renderPrint();
    if (act === "special" && bp.special) { var card = $('#blocks [data-idx="' + schedule.days[currentDay].blocks.indexOf(b) + '"] [data-bf="lesson"]'); if (card) card.focus(); }
  });
  // Update the badges of one block without re-rendering (keeps the cursor where it is).
  function refreshBar(el) {
    var card = el.closest("[data-idx]"), st = card && card.querySelector(".auto-status .badge");
    if (st && !card.classList.contains("is-special")) { st.className = "badge st-edited"; st.textContent = "Edited"; card.classList.add("is-edited"); }
    var acts = card && card.querySelector(".auto-actions");
    if (acts && !acts.querySelector('[data-act="reset"]')) acts.insertAdjacentHTML("beforeend", '<button type="button" class="btn btn-ghost btn-sm" data-act="reset">↺ Reset to auto-fill</button>');
  }
  $("#btnResetAll").addEventListener("click", function () {
    if (!currentDate) return;
    if (!confirm("Reset every Music, Health and PE block on " + fmtDate(currentDate) + " to the auto-filled lesson? Edits, swaps and special activities in those blocks are removed. Notes and the rest of the day stay.")) return;
    schedule.days[currentDay].blocks.forEach(function (b) { var bp = (plan.blocks || {})[blockKey(b)]; if (bp && (AF && AF.srcOf(b) || bp.special)) resetBlock(b); });
    savePlanNow(); renderBlocks(); renderPrint();
    toast("All blocks reset to auto-fill");
  });

  $("#btnPrint").addEventListener("click", function () { savePlanNow(); renderPrint(); window.print(); });
  $("#btnPdf").addEventListener("click", function () { savePlanNow(); exportFile("pdf", currentDay, schedule.days[currentDay].blocks, plan); });
  $("#btnDocx").addEventListener("click", function () { savePlanNow(); exportFile("docx", currentDay, schedule.days[currentDay].blocks, plan); });
  $("#btnShare").addEventListener("click", openShare);
  $("#copyFrom").addEventListener("change", function () {
    var from = this.value; this.value = "";
    if (!from) return;
    if (!confirm("Replace " + (currentDate ? fmtDate(currentDate) : DAY_LONG[currentDay]) + "’s plan with a copy of the " + DAY_LONG[from] + " template? (The date stays." + (currentDate ? " Auto-filled Music, Health and PE lessons stay; their notes are copied." : "") + ")")) return;
    var src = loadPlan(from);
    copyPlanInto(src, from, { overwrite: true });
    toast("Copied from " + DAY_LONG[from]);
  });
  $("#btnSaveTemplate").addEventListener("click", function () {
    savePlanNow();
    var t = clone(plan); t.date = ""; t.sub = ""; t.endNotes = "";
    t.fromDay = currentDay;
    Object.keys(t.blocks || {}).forEach(function (k) { var x = t.blocks[k]; ["auto", "autoDefault", "pick", "edited", "special", "prev"].forEach(function (f) { delete x[f]; }); });
    lsSet("template", t);
    toast("Saved as your template (without date, sub name and end-of-day notes)");
  });
  $("#btnApplyTemplate").addEventListener("click", function () {
    var t = lsGet("template", null);
    if (!t) { toast("No template yet. Fill in a day, then “Save as template”."); return; }
    copyPlanInto(t, t.fromDay, { overwrite: false });
    toast("Filled empty fields from your template");
  });
  $("#btnClear").addEventListener("click", function () {
    var name = currentDate ? fmtDate(currentDate) : "the " + DAY_LONG[currentDay] + " template";
    if (!confirm("Clear everything on " + name + "? This can’t be undone." + (currentDate ? " The day starts again from its weekday template and auto-fill." : ""))) return;
    if (currentDate) { lsDel("date:" + currentDate); plan = loadDatePlan(currentDate); }
    else { lsDel("day:" + currentDay); plan = emptyPlan(currentDay); }
    savePlanNow(); renderAll();
    toast("Cleared");
  });
}

/* Copy day-level fields + block plans. Blocks match by class+subject first, then by time. */
function copyPlanInto(src, srcDay, opts) {
  var keepDate = plan.date;
  DAY_FIELDS.forEach(function (f) {
    if ((f === "bells" || f === "duties") && srcDay && srcDay !== currentDay) return; // bells and duties differ per day
    if (opts.overwrite || !plan[f]) plan[f] = src[f] || (opts.overwrite ? "" : plan[f]);
  });
  if (opts.overwrite && srcDay !== currentDay) {
    plan.bells = plan.bells || schedule.days[currentDay].bells || "";
    plan.duties = plan.duties || schedule.days[currentDay].duties || "";
  }
  var srcBlocks = (schedule.days[srcDay] && schedule.days[srcDay].blocks) || [];
  var used = {};
  schedule.days[currentDay].blocks.forEach(function (b) {
    var k = blockKey(b), from = null;
    if (b.cls) {
      var m = srcBlocks.filter(function (s) { return s.cls === b.cls && (s.with || "") === (b.with || "") && s.subject === b.subject && !used[blockKey(s)]; })[0];
      if (m) { from = src.blocks[blockKey(m)]; used[blockKey(m)] = 1; }
    }
    if (!from && src.blocks[k] && !used[k]) { from = src.blocks[k]; }
    if (!from) { if (opts.overwrite && !(currentDate && AF && AF.srcOf(b))) delete plan.blocks[k]; return; }
    var target = blockPlan(plan, b);
    if (currentDate && AF && AF.srcOf(b) && !target.special && !target.edited) {
      if (opts.overwrite || !target.notes) target.notes = from.notes || "";
      return;
    }
    BLOCK_FIELDS.forEach(function (f) { if (opts.overwrite || !target[f]) target[f] = from[f] || ""; });
    if (opts.overwrite || !target.links.length) target.links = clone(from.links || []);
  });
  plan.date = keepDate;
  savePlanNow(); renderAll();
}
