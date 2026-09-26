/* Sub Day Plans — plain JS, no frameworks, no tracking. Data lives in localStorage + share links. */
(function () {
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
    scratch: { label: "Grade 6 Scratch",        url: BASE + "/Grade-6-Scratch/" }
  };
  var SITE_ORDER = ["pe", "warmup", "health", "imovie", "canva", "music", "studio", "scratch"];

  /* Backup plans: only activities that exist on the linked sites (checked Sept 2026). */
  var BACKUPS = [
    {
      title: "No-gym PE warm-ups", badge: "PE · any grade", site: "PE Playbook → Warm Up Games",
      url: BASE + "/pe-playbook/warmup-nogym.html",
      items: [
        "Ship Ahoy — no equipment; captain calls commands (classroom, gym or outside)",
        "Bell Bounce — no equipment; a move every time the bell goes (classroom)",
        "Roll the Dice! — dice + 6 agreed exercises (gym, outside, classroom)",
        "Corners — music or a whistle and numbered cards"
      ],
      lesson: "No-gym warm-up games: Ship Ahoy, then Roll the Dice! (PE Playbook → Warm Up Games)",
      instructions: "Open the Warm Up Games page. Start with Ship Ahoy (no equipment, teach 3–4 commands first, then speed up). If there’s time, play Roll the Dice!"
    },
    {
      title: "Big-group PE games", badge: "PE · gym", site: "PE Playbook → Games & Large Group Games",
      url: BASE + "/pe-playbook/games.html",
      extra: { label: "Large Group PE Games handbook", url: BASE + "/pe-playbook/large-group-pe-games.html" },
      items: [
        "Searchable games library with how-to steps and equipment",
        "Large Group PE Games handbook for when classes are combined",
        "Pick one game the class already knows; keep everyone moving"
      ],
      lesson: "Big-group game from the PE Playbook games library",
      instructions: "Open the Games page and search for a game the class knows. Equipment and steps are listed on each card."
    },
    {
      title: "Grade 1 Music · Practice studio", badge: "Music · Gr. 1", site: "Grade 1 Music → Practice studio",
      url: BASE + "/Grade-1-Music/studio/",
      items: [
        "Rhythm pad — tap boxes to make ta / ti-ti / rest, press Play",
        "So–mi–la piano — tap to hear and echo-sing",
        "Name the sound — mystery sound: drum, shaker, bell or rhythm sticks"
      ],
      lesson: "Music Studio on the projector: rhythm pad, so–mi–la piano, name the sound",
      instructions: "Open the Practice studio on the projector. Make a rhythm on the rhythm pad and have students clap it back. Then play Name the sound."
    },
    {
      title: "Grade 1 Music · Song scores", badge: "Music · Gr. 1", site: "Grade 1 Music → Song scores",
      url: BASE + "/Grade-1-Music/scores/",
      items: [
        "Public-domain folk songs with a Play button",
        "e.g. Hello Everybody (greeting game on so–mi)",
        "e.g. Rain, Rain, Go Away"
      ],
      lesson: "Sing-along from Song scores (Hello Everybody, Rain, Rain, Go Away)",
      instructions: "Open Song scores. Press Play, echo each line, then sing it together. Hello Everybody has a greeting game on the page."
    },
    {
      title: "Grade 6 Tech · keep going", badge: "Tech · Gr. 6", site: "Grade 6 Canva / Scratch",
      url: BASE + "/Grade-6-Canva/",
      extra: { label: "Grade 6 Scratch", url: BASE + "/Grade-6-Scratch/" },
      items: [
        "Click-by-click lessons students can follow from the page",
        "Students continue the lesson or project they are on",
        "Early finishers: tidy and finish their hand-in project"
      ],
      lesson: "Continue current Canva / Scratch lesson from the course map",
      instructions: "Students open the course map and continue the lesson they are on. They can follow the click-by-click steps on their own."
    },
    {
      title: "Grade 5 iMovie / Health", badge: "Gr. 5", site: "Grade 5 iMovie · Grade 5 Health",
      url: BASE + "/Grade5-iMovie/",
      extra: { label: "Grade 5 Health", url: BASE + "/grade5health/" },
      items: [
        "iMovie: continue the current lesson or hand-in project",
        "Health: open the year map and continue the current week",
        "Keep it to review. Don’t start a new unit with a sub"
      ],
      lesson: "Review: continue current iMovie / Health week from the site",
      instructions: "Open the site and continue the current lesson. Stick to review; don’t start new material."
    }
  ];

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
        if (name.indexOf("day:") !== 0 && name !== "template") continue;
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
        if (name.indexOf("day:") !== 0 && name !== "template") continue;
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
    if (lsSet("day:" + currentDay, plan)) {
      var t = new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
      $("#saveState").textContent = "Saved in this browser · " + t;
    }
  }
  function saveSchedule() { lsSet("schedule", schedule); }

  /* ---------- day picker ---------- */
  function renderDayPicker() {
    $("#dayPicker").innerHTML = DAY_KEYS.map(function (k) {
      return '<button type="button" role="radio" aria-checked="' + (k === currentDay) + '" data-daykey="' + k + '">' + DAY_SHORT[k] + "</button>";
    }).join("");
    var sel = $("#copyFrom");
    sel.innerHTML = '<option value="">Copy from another day…</option>' + DAY_KEYS.filter(function (k) { return k !== currentDay; }).map(function (k) {
      return '<option value="' + k + '">Copy from ' + DAY_LONG[k] + "</option>";
    }).join("");
  }
  function selectDay(day, keepDate) {
    if (plan) savePlanNow();
    currentDay = day;
    lsSet("lastDay", day);
    plan = loadPlan(day);
    renderAll();
  }

  /* ---------- rendering the editor ---------- */
  function renderAll() {
    renderDayPicker();
    $("#dayHeading").textContent = DAY_LONG[currentDay] + (plan.date ? " · " + fmtDate(plan.date).replace(/^\w+, /, "") : "");
    $("#dateInput").value = plan.date || "";
    $("#dateHint").textContent = plan.date ? "Prints as " + fmtDate(plan.date) + "." : "Pick a date and the weekday selects itself.";
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
      var links = bp.links.map(function (l, j) {
        return '<div class="link-row" data-link="' + j + '"><input type="text" data-lf="label" value="' + esc(l.label) + '" placeholder="Label" aria-label="Link label" />' +
          '<input type="url" data-lf="url" value="' + esc(l.url) + '" placeholder="https://…" aria-label="Link URL" />' +
          '<button type="button" class="icon-btn" data-act="rmlink" aria-label="Remove link">✕</button></div>';
      }).join("");
      return '<div class="block" data-idx="' + i + '">' + side + '<div class="block-body">' +
        '<label class="field full"><span>Lesson / activity</span><input type="text" data-bf="lesson" value="' + esc(bp.lesson) + '" placeholder="e.g. Football week 5: flag pulling tag, then routes" /></label>' +
        '<label class="field"><span>Materials &amp; where to find them</span><textarea data-bf="materials" rows="2" placeholder="e.g. Flags and pinnies in the blue bin, equipment room">' + esc(bp.materials) + "</textarea></label>" +
        '<label class="field"><span>Instructions for the sub</span><textarea data-bf="instructions" rows="2" placeholder="Step by step. Where to pick up and drop off the class.">' + esc(bp.instructions) + "</textarea></label>" +
        '<div class="field full"><span>Links</span><div class="links-editor">' + links +
        '<div class="link-add"><select data-act="addsite" aria-label="Add a lesson-site link">' + siteOptions("") + "</select>" +
        (b.link && SITES[b.link] && !bp.links.some(function (l) { return l.url === SITES[b.link].url; }) ? '<button type="button" class="icon-btn" data-act="suggest" data-site="' + b.link + '">+ ' + esc(SITES[b.link].label) + "</button>" : "") +
        "</div></div></div>" +
        '<label class="field full"><span>Notes</span><textarea data-bf="notes" rows="2" placeholder="Anything else: early finishers, who helps, what to skip.">' + esc(bp.notes) + "</textarea></label>" +
        "</div></div>";
    }).join("");
  }

  function currentBlockPlan(el) {
    var card = el.closest("[data-idx]");
    if (!card) return null;
    var b = schedule.days[currentDay].blocks[+card.getAttribute("data-idx")];
    return b ? blockPlan(plan, b) : null;
  }

  /* ---------- editor events ---------- */
  function bindEditor() {
    $("#dayPicker").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-daykey]");
      if (!btn) return;
      selectDay(btn.getAttribute("data-daykey"));
    });
    $("#dateInput").addEventListener("change", function () {
      var v = this.value;
      if (!v) { plan.date = ""; savePlanNow(); renderAll(); return; }
      var wk = weekdayKey(v);
      if (DAY_KEYS.indexOf(wk) < 0) { toast("That date is a weekend. Pick a school day."); this.value = plan.date || ""; return; }
      if (wk !== currentDay) { savePlanNow(); currentDay = wk; lsSet("lastDay", wk); plan = loadPlan(wk); }
      plan.date = v; savePlanNow(); renderAll();
    });
    $all("[data-day]").forEach(function (el) {
      el.addEventListener("input", function () { plan[el.getAttribute("data-day")] = el.value; savePlanSoon(); renderPrintSoon(); });
    });
    var blocksEl = $("#blocks");
    blocksEl.addEventListener("input", function (e) {
      var el = e.target, bp = currentBlockPlan(el);
      if (!bp) return;
      if (el.hasAttribute("data-bf")) bp[el.getAttribute("data-bf")] = el.value;
      else if (el.hasAttribute("data-lf")) { var j = +el.closest("[data-link]").getAttribute("data-link"); bp.links[j][el.getAttribute("data-lf")] = el.value; }
      else return;
      savePlanSoon(); renderPrintSoon();
    });
    blocksEl.addEventListener("change", function (e) {
      var el = e.target;
      if (el.getAttribute("data-act") !== "addsite" || !el.value) return;
      var bp = currentBlockPlan(el);
      if (el.value === "custom") bp.links.push({ label: "", url: "" });
      else bp.links.push({ label: SITES[el.value].label, url: SITES[el.value].url });
      savePlanNow(); renderBlocks(); renderPrint();
    });
    blocksEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn || btn.tagName === "SELECT") return;
      var bp = currentBlockPlan(btn);
      if (!bp) return;
      var act = btn.getAttribute("data-act");
      if (act === "rmlink") bp.links.splice(+btn.closest("[data-link]").getAttribute("data-link"), 1);
      else if (act === "suggest") { var s = SITES[btn.getAttribute("data-site")]; bp.links.push({ label: s.label, url: s.url }); }
      else return;
      savePlanNow(); renderBlocks(); renderPrint();
    });

    $("#btnPrint").addEventListener("click", function () { savePlanNow(); renderPrint(); window.print(); });
    $("#btnPdf").addEventListener("click", function () { savePlanNow(); exportFile("pdf", currentDay, schedule.days[currentDay].blocks, plan); });
    $("#btnDocx").addEventListener("click", function () { savePlanNow(); exportFile("docx", currentDay, schedule.days[currentDay].blocks, plan); });
    $("#btnShare").addEventListener("click", openShare);
    $("#copyFrom").addEventListener("change", function () {
      var from = this.value; this.value = "";
      if (!from) return;
      if (!confirm("Replace " + DAY_LONG[currentDay] + "’s plan with a copy of " + DAY_LONG[from] + "’s? (The date stays.)")) return;
      var src = loadPlan(from);
      copyPlanInto(src, from, { overwrite: true });
      toast("Copied from " + DAY_LONG[from]);
    });
    $("#btnSaveTemplate").addEventListener("click", function () {
      savePlanNow();
      var t = clone(plan); t.date = ""; t.sub = ""; t.endNotes = "";
      t.fromDay = currentDay;
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
      if (!confirm("Clear everything on " + DAY_LONG[currentDay] + "? This can’t be undone.")) return;
      lsDel("day:" + currentDay);
      plan = emptyPlan(currentDay);
      savePlanNow(); renderAll();
      toast(DAY_LONG[currentDay] + " cleared");
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
      if (!from) { if (opts.overwrite) delete plan.blocks[k]; return; }
      var target = blockPlan(plan, b);
      BLOCK_FIELDS.forEach(function (f) { if (opts.overwrite || !target[f]) target[f] = from[f] || ""; });
      if (opts.overwrite || !target.links.length) target.links = clone(from.links || []);
    });
    plan.date = keepDate;
    savePlanNow(); renderAll();
  }

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
      if (bp.lesson) parts.push('<div><span class="pv-k">' + esc(bp.lesson) + "</span></div>");
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
      if (bp.lesson) plan.push({ v: bp.lesson, strong: true });
      if (bp.materials) plan.push({ k: "Materials:", v: bp.materials });
      if (bp.instructions) plan.push({ k: "Instructions:", v: bp.instructions });
      var ls = linkLines(bp.links);
      if (ls.length) plan.push({ k: "Links:", v: ls.map(function (l) { var u = safeUrl(l.url) || l.url; return (l.label ? l.label + " — " : "") + u.replace(/^https?:\/\//, ""); }).join(" · ") });
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
      rows: rows, endNotes: p.endNotes || "", backup: BACKUP_TEXT,
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
      var empty = !bp.links.length && BLOCK_FIELDS.every(function (f) { return !bp[f]; });
      if (!empty) used[blockKey(b)] = bp;
    });
    p.blocks = used;
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
    $all("[data-backup]").forEach(function (s) { s.innerHTML = '<option value="">Use in a block (' + DAY_SHORT[currentDay] + ")…</option>" + opts; });
  }
  function bindBackups() {
    $("#backupCards").addEventListener("change", function (e) {
      var s = e.target; if (!s.hasAttribute("data-backup") || s.value === "") return;
      var bk = BACKUPS[+s.getAttribute("data-backup")], b = schedule.days[currentDay].blocks[+s.value];
      var bp = blockPlan(plan, b);
      if ((bp.lesson || bp.instructions) && !confirm("That block already has a plan. Replace the lesson and instructions?")) { s.value = ""; return; }
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
    plan = loadPlan(currentDay);
    bindEditor(); bindShare(); bindSchedule(); bindBackups();
    renderAll(); renderSchedule(); renderBackups();
    var origRenderAll = renderAll;
    renderAll = function () { origRenderAll(); refreshBackupSelects(); };
    window.addEventListener("beforeprint", function () { if (plan) { savePlanNow(); renderPrint(); } });
    window.addEventListener("hashchange", function () { if (/^#share=/.test(location.hash)) location.reload(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
