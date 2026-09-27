/* Auto-fill for Sub Day Plans: which Music, Health and PE lesson is taught on a date.
   Uses school-year.js (calendar), the PE Playbook's school-year.js (PE week plan) and
   lesson-catalog.js (lesson titles from the sites).
   Only Grade 1 Music, Grade 5 Health and PE blocks are filled. Tech, Social and
   Library stay manual. Every filled block can still be edited, swapped or reset. */
(function () {
  "use strict";
  var BASE = "https://scaemrfung.github.io";
  var WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var SY = function () { return window.SCHOOL_YEAR; };
  /* PE week plan: read from the PE Playbook's own school-year.js (loaded first in index.html,
     it sets window.PE_SCHOOL_YEAR), so both sites always agree. Falls back to the copy here. */
  var PEY = function () { var P = window.PE_SCHOOL_YEAR; return P && P.peWeek ? P : SY(); };
  /* PE refs: month/w = the lesson set taught (the PE plan's month and week, used for the lesson
     content); calMonth/calW = the school week's month and week on the PE site. A week belongs to
     the month it starts in, so Week 5 (Sept 28–Oct 1) is "September W5" and teaches the October
     plan's first set. Where a lesson set is on the PE site: the school week that teaches it, or
     the month page's extra lessons when no school week does this year. */
  function peWhere(ref) {
    if (ref.calMonth) return { month: ref.calMonth, w: ref.calW, name: ref.name || "", hash: "#week-" + ref.calW, tag: ref.calMonth + " W" + ref.calW };
    var P = PEY(), list = P.peWeekList ? P.peWeekList() : [], x = null;
    for (var i = 0; i < list.length; i++) if (!list[i].startup && list[i].planMonth === ref.month && list[i].planW === ref.w) { x = list[i]; break; }
    if (x) return { month: x.month, w: x.w, name: x.name, hash: "#week-" + x.w, tag: x.month + " W" + x.w };
    return { month: ref.month, w: 0, name: "", hash: "#extra-" + ref.w, tag: ref.month + " extra lessons" };
  }
  /* "Week 5 · Football (September W5)". */
  function peName(ref) {
    if (ref.startup) return (ref.name ? ref.name + " (" : "") + ref.calMonth + " W" + ref.calW + ", start-up week" + (ref.name ? ")" : "");
    var at = peWhere(ref);
    return at.name ? at.name + " (" + at.tag + ")" : at.tag;
  }
  var CAT = function () { return window.LESSON_CATALOG || { health: {}, music: {}, pe: {} }; };
  var MONTHS = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
  var BAND = { g12: "Grade 1–2", g34: "Grade 3–4", g56: "Grade 5–6" };

  function wd(iso) { return WD[new Date(iso + "T12:00:00").getDay()]; }
  function srcOf(b) {
    if (!b || b.type !== "class" || b.duty) return null;
    var s = String(b.subject || "").trim().toLowerCase();
    if (s === "music" && /^1[A-D]$/i.test(b.cls || "")) return "music";
    if (s === "health" && /^5/.test(b.cls || "")) return "health";
    if (s === "pe") return "pe";
    return null;
  }
  function band(cls) {
    var g = String(cls || "").charAt(0).toUpperCase();
    if (g === "K" || g === "1" || g === "2") return "g12";
    if (g === "3" || g === "4") return "g34";
    return "g56";
  }
  /* The n-th class of this subject for this class in the school week (school days only). */
  function nthInWeek(date, week, b, days) {
    var subj = String(b.subject || "").toLowerCase(), list = [];
    (week.days || []).forEach(function (d) {
      var dd = days[wd(d)];
      (dd && dd.blocks || []).forEach(function (x) {
        if (String(x.subject || "").toLowerCase() === subj && x.cls === b.cls && x.type === "class") list.push(d + " " + x.start);
      });
    });
    var me = list.indexOf(date + " " + b.start);
    return { n: me < 0 ? 1 : me + 1, of: Math.max(list.length, 1) };
  }
  function short(week) { return week && week.note ? week.note : ""; }

  /* Default lesson reference for this block on this date (null = manual block). */
  function resolve(date, b, days) {
    var src = srcOf(b), S = SY();
    if (!src || !date || !S || S.closedReason(date)) return null;
    var st = S.status(date), week = st.week;
    if (!week) return null;
    if (src === "pe") {
      var p = PEY().peWeek(date);
      if (!p || !p.month) return null;
      var pos = nthInWeek(date, week, b, days);
      return { src: "pe", month: p.planMonth || p.month, w: p.planMonth ? p.planW : p.w, calMonth: p.month, calW: p.w, startup: p.planMonth ? !!p.startup : !p.w,
        name: p.name || (p.schoolWeek ? "Week " + p.schoolWeek : ""), c: Math.min(pos.n, 4), n: pos.n, of: pos.of, planNote: p.planNote || "", weekNote: short(week), range: week.range };
    }
    var ref = { src: src, kind: st.kind, week: st.lesson || 1, weekNote: short(week), range: week.range, message: st.message || "" };
    if (src === "music") {
      var mp = nthInWeek(date, week, b, days);
      ref.cls = Math.min(mp.n, 3); ref.of = mp.of;
    }
    return ref;
  }

  function musicContent(ref, b) {
    var M = CAT().music[ref.week] || {}, url = BASE + "/Grade-1-Music/week/" + ref.week + "/";
    var link = { label: "Grade 1 Music · Week " + ref.week, url: url };
    if (ref.kind === "catchup" || ref.kind === "yearend") {
      return { lesson: (ref.kind === "yearend" ? "Last day of school" : "Catch-up week") + " — Grade 1 Music (no new lesson)",
        materials: "Nothing new. The songs are in the Studio (Copycat songs).",
        instructions: (ref.message ? ref.message + " " : "") + "Sing songs the class knows from Week " + ref.week + " and earlier (Studio → Copycat songs), then play a favourite singing game.",
        links: [link, { label: "Grade 1 Music · Copycat songs", url: BASE + "/Grade-1-Music/studio/#copycat" }] };
    }
    var k = ref.cls || 1, of = ref.of || 3, C = (M.c || [])[k - 1];
    var rule = of >= 3 ? "Class " + k + " of 3" : of === 2 ? "Class " + k + " of 2 (short week: skip Class 3)" : "Class 1 only (1 music class this week)";
    var steps = C ? C.i.map(function (x) { return x[1] + " (" + x[0] + " min)"; }).join(" → ") : "";
    return {
      lesson: "Grade 1 Music · Week " + ref.week + (M.t ? ": " + M.t : "") + " — " + rule,
      materials: C && C.b ? C.b : "See the week page.",
      instructions: "Open the Week " + ref.week + " page on the projector and go to “This week in 3 classes” → Class " + k + "." + (steps ? " Plan: " + steps + "." : "") +
        (ref.weekNote ? " " + ref.weekNote + "." : ""),
      links: [link]
    };
  }
  function healthContent(ref) {
    var H = CAT().health[ref.week] || [], url = BASE + "/grade5health/week/" + ref.week + "/";
    var link = { label: "Grade 5 Health · Week " + ref.week, url: url };
    if (ref.kind === "catchup" || ref.kind === "yearend") {
      return { lesson: (ref.kind === "yearend" ? "Last day of school" : "Catch-up week") + " — Grade 5 Health (no new lesson)",
        materials: "Nothing new.",
        instructions: (ref.message ? ref.message + " " : "") + "Review Week " + ref.week + " from the site: re-read the key ideas together and let students finish the worksheet.",
        links: [link] };
    }
    return {
      lesson: "Grade 5 Health · Week " + ref.week + (H[0] ? ": " + H[0] : ""),
      materials: "Week " + ref.week + " worksheet (print it from the week page) and the projector.",
      instructions: (H[1] ? "Focus: " + H[1] + ". " : "") + "Open the Week " + ref.week + " page on the projector and follow the lesson steps in order, then the worksheet." + (ref.weekNote ? " " + ref.weekNote + "." : ""),
      links: [link]
    };
  }
  function peContent(ref, b) {
    var M = CAT().pe[ref.month] || { w: {} };
    var at = ref.startup ? { month: ref.calMonth, hash: "#week-" + ref.calW, tag: ref.calMonth + " W" + ref.calW } : peWhere(ref);
    var url = BASE + "/pe-playbook/month-" + at.month.toLowerCase() + ".html" + at.hash;
    var link = { label: "PE Playbook · " + at.tag, url: url };
    if (ref.startup || !ref.w) {
      return { lesson: "PE · " + (ref.name ? ref.name + " · " : "") + "Start-up week: gym routines, signals and name games",
        materials: "Pinnies and soft balls from the equipment room.",
        instructions: (ref.planNote ? ref.planNote + " " : "") + "Practise the freeze signal, lining up and safe spacing, then play a name or tag game from the PE Playbook Big-Group Games page.",
        links: [link, { label: "PE Playbook · Big-Group Games", url: BASE + "/pe-playbook/games.html" }] };
    }
    var L = (M.w[ref.w] || {})[ref.c];
    if (!L) return { lesson: "PE · " + peName(ref) + " · Class " + ref.c, materials: "", instructions: "See the month page.", links: [link] };
    var bd = band(b.cls), bd2 = b.with ? band(b.with) : null, gi = { g12: 6, g34: 7, g56: 8 };
    var ver = (L[gi[bd]] ? BAND[bd] + ": " + L[gi[bd]] + ". " : "") + (bd2 && bd2 !== bd && L[gi[bd2]] ? BAND[bd2] + " (" + b.with + "): " + L[gi[bd2]] + ". " : "");
    var of = ref.of || 4, cnote = of < 4 && of > 1 ? " (" + of + " PE classes this week)" : "";
    return {
      lesson: "PE · " + peName(ref) + " · Class " + ref.c + cnote + " — " + L[0] + (L[1] ? " (" + L[1] + ")" : ""),
      materials: "Equipment is listed on the lesson card (PE Playbook month page).",
      instructions: "Warm-up: " + L[2] + " Skill: " + L[3] + " Game: " + L[4] + " Cool-down: " + L[5] + (ver ? " " + ver : "") +
        (ref.planNote ? " Note: " + ref.planNote + "." : "") + (ref.weekNote ? " " + ref.weekNote + "." : ""),
      links: [link]
    };
  }
  function content(ref, b) {
    if (!ref) return null;
    var c = ref.src === "music" ? musicContent(ref, b) : ref.src === "health" ? healthContent(ref, b) : peContent(ref, b);
    c.lesson = c.lesson.replace(/\.\./g, "."); c.instructions = c.instructions.replace(/\.\.+/g, ".").replace(/\s+/g, " ").trim();
    return c;
  }
  function refLabel(ref) {
    if (!ref) return "";
    if (ref.src === "pe") return peName(ref) + (ref.startup ? "" : " · Class " + ref.c);
    if (ref.kind === "catchup") return "Catch-up (after Week " + ref.week + ")";
    if (ref.kind === "yearend") return "Last day";
    return "Week " + ref.week + (ref.src === "music" ? " · Class " + (ref.cls || 1) : "");
  }
  /* Swap: build a reference from picker values, keeping the date's context notes. */
  function pickRef(def, src, v) {
    var r = { src: src, weekNote: def && def.weekNote || "", range: def && def.range || "" };
    if (src === "pe") {
      var set = v.pw ? String(v.pw).split("|") : [v.month, v.w]; // v.month/v.w: picks saved before Sept 27, 2026 (plan month and week)
      r.month = set[0]; r.w = +set[1] || 1; r.c = +v.c || 1; r.of = 4; r.planNote = "";
    }
    else { r.kind = "lesson"; r.week = +v.week; if (src === "music") { r.cls = +v.cls; r.of = 3; } }
    return r;
  }
  function pickerHTML(src, ref, esc) {
    function sel(name, opts, cur, label) {
      return '<select data-pick="' + name + '" aria-label="' + label + '">' + opts.map(function (o) {
        var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("") + "</select>";
    }
    var weeks = []; for (var i = 1; i <= 36; i++) {
      var t = src === "music" ? (CAT().music[i] || {}).t : (CAT().health[i] || [])[0];
      weeks.push([i, "Week " + i + (t ? ": " + (t.length > 34 ? t.slice(0, 33) + "…" : t) : "")]);
    }
    if (src === "music") return sel("week", weeks, ref.week, "Music week") + sel("cls", [[1, "Class 1"], [2, "Class 2"], [3, "Class 3"]], ref.cls || 1, "Music class");
    if (src === "health") return sel("week", weeks, ref.week, "Health week");
    /* PE: pick the lesson set by school week (as on the PE site), then any extra sets. */
    var P = PEY(), sets = [], seen = {};
    (P.peWeekList ? P.peWeekList() : []).forEach(function (x) {
      var k = x.planMonth + "|" + x.planW;
      if (x.startup || seen[k]) return; seen[k] = 1;
      sets.push([k, x.name + " (" + x.month + " W" + x.w + ")"]);
    });
    MONTHS.forEach(function (m) {
      (P.peExtras ? P.peExtras(m) : []).forEach(function (ex) {
        var k = ex.planMonth + "|" + ex.planW;
        if (!seen[k]) { seen[k] = 1; sets.push([k, m + " extra lessons"]); }
      });
    });
    return sel("pw", sets, (ref.month || "") + "|" + (ref.w || 1), "PE week") +
      sel("c", [[1, "Class 1"], [2, "Class 2"], [3, "Class 3"], [4, "Class 4"]], ref.c || 1, "PE class");
  }
  /* One line about the date for the day heading. */
  function daySummary(date) {
    var S = SY(); if (!S || !date) return "";
    var closed = S.closedReason(date);
    if (closed) return "No school: " + closed;
    var st = S.status(date), p = PEY().peWeek(date), w = st.week, parts = [];
    if (!w) return "";
    parts.push("School week " + w.n + " (" + w.range + ")");
    if (st.kind === "lesson") parts.push("Music & Health: Week " + st.lesson);
    else if (st.kind === "catchup") parts.push("Music & Health: catch-up week (no new lesson)");
    else if (st.kind === "yearend") parts.push("Last day of school");
    if (p && p.month) parts.push("PE: " + peName({ month: p.planMonth, w: p.planW, calMonth: p.month, calW: p.w, startup: !!p.startup, name: p.name || "" }));
    if (w.note) parts.push(w.note);
    return parts.join(" · ");
  }
  window.SubAutofill = { srcOf: srcOf, resolve: resolve, content: content, refLabel: refLabel, pickRef: pickRef, pickerHTML: pickerHTML, daySummary: daySummary };
})();
