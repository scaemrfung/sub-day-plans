/* ==========================================================================
   SCHOOL-YEAR SETTINGS — Sub Day Plans (review each August)
   The EIPS 2026–27 calendar: which days are school days (non-school days are
   greyed out in the date picker), which lesson week each date falls in
   (Grade 1 Music and Grade 5 Health: Weeks 1–36 with three catch-up weeks),
   and which PE month week is taught in each school week (same plan as the
   PE Playbook). Keep in step with school-year.js on those sites.
   Test any date with ?today=YYYY-MM-DD in the page URL.
   ========================================================================== */
(function (root) {
  "use strict";
  /* ---- School calendar (EIPS Division Calendar 2026-27) ------------------
     Source: https://www.eips.ca/download/480909  (verified Sept 27, 2026)
     To roll over to a new year: change the dates in CAL below. Everything
     else (school weeks, lesson numbers, short-week notes) is worked out
     from these dates.
     Test any date with ?today=YYYY-MM-DD in the page URL.            */
  var CAL = {
    label: "2026–2027",
    timeZone: "America/Edmonton",
    firstDay: "2026-08-31",        // Classes begin (Mon)
    lastDay: "2027-06-28",         // Last instructional day (Mon)
    semester2: "2027-02-01",
    lessons: 36,
    // Catch-up weeks (Monday of the week). No new lesson; finish or review.
    catchUp: ["2026-12-14", "2027-02-01", "2027-06-21"],
    catchUpWhy: {
      "2026-12-14": "Catch-up week before Christmas (concerts, finish Week 14 or review)",
      "2027-02-01": "Catch-up week (Teachers' Convention Thu–Fri; semester 2 starts)",
      "2027-06-21": "Catch-up week (year-end: finish Week 36 or review)"
    },
    // Weekday non-school days: [first, last, reason]
    closed: [
      ["2026-09-07", "2026-09-07", "Labour Day"],
      ["2026-09-30", "2026-09-30", "Truth and Reconciliation Day"],
      ["2026-10-02", "2026-10-02", "PL day"],
      ["2026-10-12", "2026-10-12", "Thanksgiving"],
      ["2026-11-09", "2026-11-13", "November Break"],
      ["2026-12-21", "2027-01-01", "Christmas Break"],
      ["2027-01-29", "2027-01-29", "PL day"],
      ["2027-02-04", "2027-02-05", "Teachers' Convention"],
      ["2027-02-15", "2027-02-15", "Family Day"],
      ["2027-03-05", "2027-03-05", "PL day"],
      ["2027-03-19", "2027-03-19", "School closure"],
      ["2027-03-22", "2027-03-26", "Spring Break"],
      ["2027-03-29", "2027-03-29", "Easter Monday"],
      ["2027-05-07", "2027-05-07", "PL day"],
      ["2027-05-20", "2027-05-21", "School closure"],
      ["2027-05-24", "2027-05-24", "Victoria Day"],
      ["2027-06-29", "2027-06-29", "Operational day (no students)"]
    ],
    earlyDismissal: 3 // Wednesday: one hour early every week
  };

  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DAY = 864e5;

  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function dow(t) { return new Date(t).getUTCDay(); }
  function mondayOf(t) { var d = dow(t); return t - ((d + 6) % 7) * DAY; }
  function short(t) { var d = new Date(t); return MON[d.getUTCMonth()] + " " + d.getUTCDate(); }
  function dayLabel(t) { return DOW[dow(t)] + " " + short(t); }
  function range(a, b) {
    if (a === b) return dayLabel(a);
    var da = new Date(a), db = new Date(b);
    return short(a) + "–" + (da.getUTCMonth() === db.getUTCMonth() ? db.getUTCDate() : short(b));
  }

  var CLOSED = {};
  CAL.closed.forEach(function (c) {
    for (var t = parse(c[0]); t <= parse(c[1]); t += DAY) CLOSED[iso(t)] = c[2];
  });
  var FIRST = parse(CAL.firstDay), LAST = parse(CAL.lastDay);

  /* Build every week from the first Monday to the last day. */
  var WEEKS = [], BREAKS = [];
  (function build() {
    var lesson = 0, n = 0;
    for (var mon = mondayOf(FIRST); mon <= LAST; mon += 7 * DAY) {
      var days = [], off = [];
      for (var i = 0; i < 5; i++) {
        var t = mon + i * DAY, k = iso(t);
        if (t < FIRST || t > LAST) continue;
        if (CLOSED[k]) off.push({ date: k, why: CLOSED[k], label: dayLabel(t) });
        else days.push(k);
      }
      if (!days.length) {
        var why = off.length ? off[0].why : "No school";
        var prev = BREAKS[BREAKS.length - 1];
        if (prev && prev.name === why && parse(prev.end) + 3 * DAY >= mon) prev.end = iso(mon + 4 * DAY), prev.range = range(parse(prev.start), mon + 4 * DAY);
        else BREAKS.push({ name: why, start: iso(mon), end: iso(mon + 4 * DAY), range: range(mon, mon + 4 * DAY) });
        continue;
      }
      n++;
      var w = { n: n, monday: iso(mon), start: days[0], end: days[days.length - 1], days: days, off: off,
        range: range(parse(days[0]), parse(days[days.length - 1])) };
      if (CAL.catchUp.indexOf(iso(mon)) >= 0) { w.kind = "catchup"; w.lesson = null; w.why = CAL.catchUpWhy[iso(mon)] || "Catch-up week"; }
      else if (lesson >= CAL.lessons) { w.kind = "yearend"; w.lesson = null; w.why = "Last day of school"; }
      else { lesson++; w.kind = "lesson"; w.lesson = lesson; }
      var partialStart = mon < FIRST, partialEnd = mon + 4 * DAY > LAST;
      if (days.length < 5) {
        var bits = off.map(function (o) { return o.label + " off (" + o.why + ")"; });
        if (partialEnd && !off.length) w.note = days.length + "-day week: last day of school " + dayLabel(parse(days[days.length - 1]));
        else if (partialStart && !off.length) w.note = days.length + "-day week: first day of school " + dayLabel(parse(days[0]));
        else w.note = days.length + "-day week: " + bits.join(", ");
      } else w.note = "";
      WEEKS.push(w);
    }
  })();

  function weekOfLesson(n) { for (var i = 0; i < WEEKS.length; i++) if (WEEKS[i].lesson === n) return WEEKS[i]; return null; }
  function weekOfDate(k) {
    var mon = iso(mondayOf(parse(k)));
    for (var i = 0; i < WEEKS.length; i++) if (WEEKS[i].monday === mon) return WEEKS[i];
    return null;
  }
  function nextWeekAfter(k) { for (var i = 0; i < WEEKS.length; i++) if (WEEKS[i].start > k) return WEEKS[i]; return null; }
  function nextLessonWeekFrom(w) {
    for (var i = WEEKS.indexOf(w); i >= 0 && i < WEEKS.length; i++) if (WEEKS[i].lesson) return WEEKS[i];
    return null;
  }
  function breakOf(k) {
    for (var i = 0; i < BREAKS.length; i++) if (BREAKS[i].start <= k && k <= BREAKS[i].end) return BREAKS[i];
    return null;
  }

  /** Today's date (school time zone) as "YYYY-MM-DD". ?today=YYYY-MM-DD wins. */
  function todayISO() {
    try {
      var o = root && root.SCHOOL_TODAY;
      if (!o && root && root.location) o = new URLSearchParams(root.location.search).get("today");
      if (o && parse(o) != null) return o;
    } catch (e) { /* ignore */ }
    try {
      var p = new Intl.DateTimeFormat("en-CA", { timeZone: CAL.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      var g = function (t) { return p.find(function (x) { return x.type === t; }).value; };
      return g("year") + "-" + g("month") + "-" + g("day");
    } catch (e) { var d = new Date(); return iso(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
  }

  /** What to show for a date (default: today).
      kind: lesson | catchup | break | closed | before | summer | yearend
      lesson: the lesson number to feature; week: the school week it belongs to. */
  function status(k) {
    k = k || todayISO();
    var t = parse(k), d = dow(t), out = { date: k };
    if (t < FIRST) {
      var w1 = WEEKS[0];
      return { date: k, kind: "before", label: "First lesson", lesson: 1, week: w1,
        message: "School starts " + DOW_LONG[dow(parse(w1.start))] + " " + short(parse(w1.start)) + ". Week 1 is ready." };
    }
    if (t > LAST) {
      return { date: k, kind: "summer", label: "Start here", lesson: 1, week: null,
        message: "The " + CAL.label + " school year is over. Week 1 is here so you can plan for next year." };
    }
    // Weekend: look at the week that starts next Monday.
    var probe = k;
    if (d === 6 || d === 0) probe = iso(t + (d === 6 ? 2 : 1) * DAY);
    var w = weekOfDate(probe);
    if (!w) {
      var br = breakOf(probe) || { name: "No school", range: "" };
      var nx = nextWeekAfter(probe), nl = nx && nextLessonWeekFrom(nx);
      return { date: k, kind: "break", label: "Next lesson", lesson: nl ? nl.lesson : 36, week: nl,
        message: br.name + (br.range ? " (" + br.range + ")" : "") + " — no school." +
          (nx ? " Back " + DOW_LONG[dow(parse(nx.start))] + " " + short(parse(nx.start)) + (nl ? " with Week " + nl.lesson + "." : ".") : "") };
    }
    out.week = w;
    if (w.kind === "catchup") {
      var prevL = 0; for (var i = 0; i < WEEKS.length && WEEKS[i] !== w; i++) if (WEEKS[i].lesson) prevL = WEEKS[i].lesson;
      var nl2 = nextLessonWeekFrom(w);
      out.kind = "catchup"; out.label = "Catch-up week"; out.lesson = prevL || 1;
      out.message = "Catch-up week (" + w.range + "): no new lesson. Finish Week " + prevL + " or review." +
        (nl2 ? " Week " + nl2.lesson + " starts " + short(parse(nl2.start)) + "." : "") + (w.note ? " " + w.note + "." : "");
      return out;
    }
    if (w.kind === "yearend") {
      out.kind = "yearend"; out.label = "Last day"; out.lesson = CAL.lessons;
      out.message = "Last day of school: " + dayLabel(parse(w.start)) + ". Week " + CAL.lessons + " was the last lesson.";
      return out;
    }
    out.kind = "lesson"; out.label = "This week’s lesson"; out.lesson = w.lesson;
    if (CLOSED[k]) out.message = "No school today (" + CLOSED[k] + "). " + (w.note || "");
    else out.message = w.note || "";
    return out;
  }

  function weekInfo(n) {
    var w = weekOfLesson(n);
    if (!w) return null;
    return { lesson: n, week: w.n, range: w.range, note: w.note, start: w.start, end: w.end, days: w.days, off: w.off };
  }
  /** "Sept 28–Oct 1 · 3-day week: Wed Sept 30 off (...)" */
  function lessonLine(n) {
    var w = weekOfLesson(n);
    return w ? w.range + (w.note ? " · " + w.note : "") : "";
  }
  /** Is a date a school day? Returns null if yes, else the reason. */
  function closedReason(k) {
    var t = parse(k); if (t == null) return "Not a date";
    var d = dow(t);
    if (d === 0 || d === 6) return "Weekend";
    if (t < FIRST) return "Before the first day of school";
    if (t > LAST) return CLOSED[k] || "Summer (after the last day of school)";
    return CLOSED[k] || null;
  }

  /* ---- PE month plan on the real calendar ---------------------------------
     Two things per school week (Week 1 = Aug 31–Sept 4, counted from Aug 31):
     1. Which month it belongs to: the month it STARTS in (its Monday), so
        Mon Sept 28–Fri Oct 2 is September. Aug 31 counts as September. Inside a
        month the weeks are W1, W2, … in order, and the month page has one section
        per week (month-september.html#week-5 = Week 5).
     2. What it teaches: PE_WEEKS below points each school week at a lesson set
        in data.js ([plan month, plan week]), which is where the lessons are kept.
        The lesson sequence follows the weekly plans; it does not have to match
        the calendar month (Week 5 in September teaches the October football set).
     Fallback copy only: autofill.js reads the PE Playbook's school-year.js
     (window.PE_SCHOOL_YEAR) when it loads, so the PE site is the source.
     [school week, plan month, plan week, note, theme]  (plan week 0 = start-up week;
     theme is optional and shown next to the week name, e.g. "Week 4 · Football") */
  var PE_WEEKS = [
    [1, "September", 0, "Start-up week: gym routines, signals and name games. Soccer starts Sept 8 (Week 2)."],
    [2, "September", 1, "", "Soccer"], [3, "September", 2, "Terry Fox run Fri Sept 18", "Soccer"],
    [4, "September", 3, "Football intro", "Football"],
    // Week 5 teaches the October football set (matches the weekly plans), so the
    // October and November sets run one week early; December W2 (an extra set
    // before) absorbs the shift. From January on nothing moves.
    [5, "October", 1, "", "Football"], [6, "October", 2, "", "Football"], [7, "October", 3], [8, "October", 4],
    [9, "November", 1], [10, "November", 2], [11, "November", 3], [12, "November", 4],
    [13, "December", 1], [14, "December", 2], [15, "December", 4, "Last week before Christmas: festival stations and closers"],
    [16, "January", 1], [17, "January", 2], [18, "January", 3], [19, "January", 4],
    [20, "February", 1], [21, "February", 2], [22, "February", 3], [23, "February", 4],
    [24, "March", 1], [25, "March", 2], [26, "March", 3], [27, "March", 4, "Right after Spring Break"],
    [28, "April", 1], [29, "April", 2], [30, "April", 3], [31, "April", 4],
    [32, "May", 1], [33, "May", 2], [34, "May", 3], [35, "May", 4],
    [36, "June", 1, "Track and Field Day week"], [37, "June", 2], [38, "June", 3], [39, "June", 4],
    [40, "June", 4, "Last class of the year"]
  ];
  // Lesson sets with no school week this year (shown as extras on that month's page).
  var PE_EXTRA = {
    "September": { 4: "Soccer and football review — no school week for this set this year. Use it any time." },
    "December": { 3: "Extra games — no school week for this set this year. Use it any time." }
  };
  var PE_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var PE_SCHOOL_MONTHS = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];

  /* Month and in-month week number for every school week (start-month rule). */
  var PE_CAL = {};
  (function () {
    var count = {};
    WEEKS.forEach(function (w) {
      var m = PE_MONTHS[+w.monday.slice(5, 7) - 1];
      if (PE_SCHOOL_MONTHS.indexOf(m) < 0) m = +w.monday.slice(5, 7) >= 7 ? "September" : "June";
      count[m] = (count[m] || 0) + 1;
      PE_CAL[w.n] = { month: m, w: count[m] };
    });
  })();

  function peEntry(n) {
    for (var i = 0; i < PE_WEEKS.length; i++) if (PE_WEEKS[i][0] === n) return PE_WEEKS[i];
    return null;
  }
  /* month/w = where the week belongs (month page and section); planMonth/planW = its lesson set. */
  function peFromWeek(w, kind) {
    var e = w && peEntry(w.n), c = w && PE_CAL[w.n];
    if (!e || !c) return null;
    return { kind: kind || "week", schoolWeek: w.n, month: c.month, w: c.w, planMonth: e[1], planW: e[2], startup: e[2] === 0,
      range: w.range, start: w.start, end: w.end, days: w.days, off: w.off, note: w.note, planNote: e[3] || "", theme: e[4] || "",
      name: "Week " + w.n + (e[4] ? " · " + e[4] : ""), plan: c.month + " W" + c.w };
  }
  /** PE week for a date (default today). kind: week | break (next school week) | summer | before */
  function peWeek(k) {
    var st = status(k);
    if (st.kind === "summer") return { kind: "summer" };
    var w;
    if (st.kind === "break") w = nextWeekAfter(st.date);
    else if (st.kind === "before") w = WEEKS[0];
    else w = st.week;
    var out = peFromWeek(w, st.kind === "break" ? "break" : st.kind === "before" ? "before" : "week");
    if (out && st.kind === "break") out.message = st.message.replace(/ with Week \d+\.$/, ".");
    if (out && CLOSED[st.date]) out.today = "No school today (" + CLOSED[st.date] + ")";
    return out;
  }
  /** Every school week, in order. */
  function peWeekList() { return WEEKS.map(function (w) { return peFromWeek(w); }).filter(Boolean); }
  /** School weeks that belong to a month (start-month rule), in order. */
  function peWeeksForMonth(name) { return peWeekList().filter(function (x) { return x.month === name; }); }
  /** Lesson sets of a plan month with no school week: [{planMonth, planW, text}]. */
  function peExtras(name) {
    var ex = PE_EXTRA[name] || {};
    return Object.keys(ex).map(function (k) { return { planMonth: name, planW: +k, text: ex[k] }; });
  }
  /** Section heading data for a month page: the week(s) in section wk of that month. */
  function peWeekLabel(name, wk) {
    var list = peWeeksForMonth(name).filter(function (x) { return x.w === wk; });
    if (!list.length) return { extra: true, text: "Not scheduled this year" };
    return { extra: false, weeks: list, text: list.map(function (x) {
      return x.range + (x.note ? " · " + x.note : "") + (x.planNote ? " · " + x.planNote : "");
    }).join(" + ") };
  }

  var API = { config: CAL, weeks: WEEKS, breaks: BREAKS, todayISO: todayISO, status: status, closedReason: closedReason,
    weekOfLesson: weekOfLesson, weekOfDate: function (k) { return weekOfDate(k); }, lessonLine: lessonLine,
    range: function (a, b) { return range(parse(a), parse(b || a)); }, dayLabel: function (k) { return dayLabel(parse(k)); },
    peWeeks: PE_WEEKS, peWeek: peWeek, peWeeksForMonth: peWeeksForMonth, peWeekLabel: peWeekLabel,
    peWeekList: peWeekList, peExtras: peExtras };
  if (root) root.SCHOOL_YEAR = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : null);
