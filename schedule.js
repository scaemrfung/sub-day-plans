/*
 * Sub Day Plans — DEFAULT WEEKLY SCHEDULE
 * ---------------------------------------
 * Source: "Patrick_Fung_Timetable_2026-2027.docx"
 *         (Google Drive: My Drive/SCAE/2026-2027/Timetable, last modified Aug 26 2026)
 *
 * This is the schedule every new browser starts with. Changes made on the site
 * (Weekly schedule section) are saved in that browser only; use "Export JSON" there and
 * paste the result here to bake it in for everyone.
 *
 * Day fields: label, bells, duties (pre-fills the Duties box on a new plan), blocks.
 *
 * Block fields:
 *   start, end  – "8:37" style, 12-hour clock without am/pm (school day)
 *   cls         – class / grade
 *   with        – optional second class in the gym at the same time (combined PE block).
 *                 The timetable writes these as "6A (5C)", and the site shows them the same way:
 *                 "6A (5C)" as the class name, plus a "combined in gym · 2 classes" badge.
 *   orig        – the label exactly as written in the timetable, kept for reference
 *   subject     – PE, Music, Tech, Health, Social, Library, Prep, Recess, Lunch
 *   room        – location ("Gym" for PE; the timetable doesn't list other rooms)
 *   type        – "class" (gets a full plan form), "prep", or "break"
 *   duty        – optional supervision duty during a break block (shown as DUTY on the plan)
 *   link        – optional suggested lesson site (key from SITES in app.js)
 */
window.DEFAULT_SCHEDULE = {
  source: "Patrick_Fung_Timetable_2026-2027.docx (My Drive/SCAE/2026-2027/Timetable)",
  days: {
    mon: {
      label: "Monday",
      duties: "",
      bells: "8:37 start · Recess 10:16–10:31 · Lunch 11:37–11:55 · Recess 11:55–12:15 · Recess 1:59–2:14 · Dismissal 3:19",
      blocks: [
        { start: "8:37",  end: "9:10",  cls: "6A", with: "5C", orig: "6A (5C)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "9:10",  end: "9:43",  cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "9:43",  end: "10:16", cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "10:16", end: "10:31", cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "10:31", end: "11:04", cls: "KC", with: "1C", orig: "KC (1C)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:04", end: "11:37", cls: "1A", with: "1B", orig: "1A (1B)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:37", end: "11:55", cls: "",        subject: "Lunch",  room: "", type: "break" },
        { start: "11:55", end: "12:15", cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "12:20", end: "12:53", cls: "5B", with: "4B", orig: "5B (4B)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "12:53", end: "1:26",  cls: "1B",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "1:26",  end: "1:59",  cls: "3C",      subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "1:59",  end: "2:14",  cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "2:14",  end: "2:47",  cls: "1A",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "2:47",  end: "3:19",  cls: "4A",      subject: "Tech",   room: "", type: "class", link: "g4tech" }
      ]
    },
    tue: {
      label: "Tuesday",
      duties: "Library supervision duty during the middle recess, 11:55–12:15, in the Library.",
      bells: "8:37 start · Recess 10:16–10:31 · Lunch 11:37–11:55 · Recess 11:55–12:15 · Recess 1:59–2:14 · Dismissal 3:19",
      blocks: [
        { start: "8:37",  end: "9:10",  cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "9:10",  end: "9:43",  cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "9:43",  end: "10:16", cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "10:16", end: "10:31", cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "10:31", end: "11:04", cls: "KD", with: "1C", orig: "KD (1C)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:04", end: "11:37", cls: "1A", with: "1B", orig: "1A (1B)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:37", end: "11:55", cls: "",        subject: "Lunch",  room: "", type: "break" },
        { start: "11:55", end: "12:15", cls: "",        subject: "Recess", room: "Library", type: "break", duty: "Library supervision duty" },
        { start: "12:20", end: "12:53", cls: "5B", with: "4B", orig: "5B (4B)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "12:53", end: "1:26",  cls: "1D",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "1:26",  end: "1:59",  cls: "3C", with: "4A", orig: "3C (4A)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "1:59",  end: "2:14",  cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "2:14",  end: "2:47",  cls: "4B",      subject: "Tech",   room: "", type: "class", link: "g4tech" },
        { start: "2:47",  end: "3:19",  cls: "5B",      subject: "Health", room: "", type: "class", link: "health" }
      ]
    },
    wed: {
      label: "Wednesday",
      duties: "Library supervision duty during the middle recess, 11:52–12:17, in the Library.",
      bells: "Modified Wednesday times · 8:37 start · Recess 9:58–10:13 · Lunch 11:31–11:52 · Recess 11:52–12:17 · Recess 1:11–1:26 · Last block ends 2:19",
      blocks: [
        { start: "8:37",  end: "9:04",  cls: "6A", with: "5C", orig: "6A (5C)", subject: "PE",      room: "Gym", type: "class", link: "pe" },
        { start: "9:04",  end: "9:31",  cls: "6A",       subject: "Library", room: "Library", type: "class" },
        { start: "9:31",  end: "9:58",  cls: "4C",       subject: "Tech",    room: "", type: "class", link: "g4tech" },
        { start: "9:58",  end: "10:13", cls: "",         subject: "Recess",  room: "", type: "break" },
        { start: "10:13", end: "10:40", cls: "KA/KB",    subject: "Social",  room: "", type: "class" },
        { start: "10:40", end: "11:07", cls: "KC/KD",    subject: "Social",  room: "", type: "class" },
        { start: "11:07", end: "11:31", cls: "5B",       subject: "PE",      room: "Gym", type: "class", link: "pe" },
        { start: "11:31", end: "11:52", cls: "",         subject: "Lunch",   room: "", type: "break" },
        { start: "11:52", end: "12:17", cls: "",         subject: "Recess",  room: "Library", type: "break", duty: "Library supervision duty" },
        { start: "12:17", end: "12:44", cls: "1D",       subject: "Music",   room: "", type: "class", link: "music" },
        { start: "12:44", end: "1:11",  cls: "3C", with: "4A", orig: "3C (4A)", subject: "PE",      room: "Gym", type: "class", link: "pe" },
        { start: "1:11",  end: "1:26",  cls: "",         subject: "Recess",  room: "", type: "break" },
        { start: "1:26",  end: "1:53",  cls: "1B",       subject: "Music",   room: "", type: "class", link: "music" },
        { start: "1:53",  end: "2:19",  cls: "1C",       subject: "Music",   room: "", type: "class", link: "music" }
      ]
    },
    thu: {
      label: "Thursday",
      duties: "Library supervision duty during the middle recess, 11:55–12:15, in the Library.",
      bells: "8:37 start · Recess 10:16–10:31 · Lunch 11:37–11:55 · Recess 11:55–12:15 · Recess 1:59–2:14 · Dismissal 3:19",
      blocks: [
        { start: "8:37",  end: "9:10",  cls: "6A",      subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "9:10",  end: "9:43",  cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "9:43",  end: "10:16", cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "10:16", end: "10:31", cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "10:31", end: "11:04", cls: "KA", with: "1C", orig: "KA (1C)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:04", end: "11:37", cls: "1A",      subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:37", end: "11:55", cls: "",        subject: "Lunch",  room: "", type: "break" },
        { start: "11:55", end: "12:15", cls: "",        subject: "Recess", room: "Library", type: "break", duty: "Library supervision duty" },
        { start: "12:20", end: "12:53", cls: "1B",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "12:53", end: "1:26",  cls: "1C",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "1:26",  end: "1:59",  cls: "1A",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "1:59",  end: "2:14",  cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "2:14",  end: "2:47",  cls: "Gr. 6",   subject: "Tech",   room: "", type: "class" },
        { start: "2:47",  end: "3:19",  cls: "Gr. 6",   subject: "Tech",   room: "", type: "class" }
      ]
    },
    fri: {
      label: "Friday",
      duties: "Library supervision duty during the middle recess, 11:55–12:15, in the Library.",
      bells: "8:37 start · Recess 10:16–10:31 · Lunch 11:37–11:55 · Recess 11:55–12:15 · Recess 1:59–2:14 · Dismissal 3:19",
      blocks: [
        { start: "8:37",  end: "9:10",  cls: "6A", with: "5C", orig: "6A (5C)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "9:10",  end: "9:43",  cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "9:43",  end: "10:16", cls: "",        subject: "Prep",   room: "", type: "prep" },
        { start: "10:16", end: "10:31", cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "10:31", end: "11:04", cls: "KB",      subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:04", end: "11:37", cls: "1A", with: "1B", orig: "1A (1B)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "11:37", end: "11:55", cls: "",        subject: "Lunch",  room: "", type: "break" },
        { start: "11:55", end: "12:15", cls: "",        subject: "Recess", room: "Library", type: "break", duty: "Library supervision duty" },
        { start: "12:20", end: "12:53", cls: "5B", with: "4B", orig: "5B (4B)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "12:53", end: "1:26",  cls: "1D",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "1:26",  end: "1:59",  cls: "3C", with: "4A", orig: "3C (4A)", subject: "PE",     room: "Gym", type: "class", link: "pe" },
        { start: "1:59",  end: "2:14",  cls: "",        subject: "Recess", room: "", type: "break" },
        { start: "2:14",  end: "2:47",  cls: "1A",      subject: "Music",  room: "", type: "class", link: "music" },
        { start: "2:47",  end: "3:19",  cls: "1C",      subject: "Music",  room: "", type: "class", link: "music" }
      ]
    }
  }
};

/*
 * Date-bound supervision changes (on top of the weekly schedule, also for a schedule edited on the site).
 * Mr. Fung, Oct 30 2026: last-recess duty swapped "until Christmas of this year", and he is NOT in the
 * Library at the middle recess on those days. Applies to dates from `from` up to the day before the
 * school-year.js closure named in `untilBefore` (Christmas Break starts Mon Dec 21, so the last swap
 * day is Fri Dec 18). After that the regular Tue/Fri Library duty shows again.
 *   remove – start time of the break block whose duty is dropped
 *   add    – start time of the break block that gets this duty (with room)
 *   duties – replaces the default Duties text on a plan for that date
 */
window.DUTY_SWAPS = [
  { day: "tue", from: "2026-10-30", untilBefore: "Christmas Break", remove: "11:55", add: "1:59",
    room: "Grade 1–2 area", duty: "Supervision duty (covering for Kate)",
    duties: "Supervision duty during the last recess, 1:59–2:14, in the Grade 1–2 area (covering for Kate). No Library supervision at the middle recess (until the Christmas Break)." },
  { day: "fri", from: "2026-10-30", untilBefore: "Christmas Break", remove: "11:55", add: "1:59",
    room: "Grade 3–4 area", duty: "Supervision duty (covering for Darren)",
    duties: "Supervision duty during the last recess, 1:59–2:14, in the Grade 3–4 area (covering for Darren). No Library supervision at the middle recess (until the Christmas Break)." }
];
