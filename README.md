# Sub Day Plans

Live: https://scaemrfung.github.io/sub-day-plans/

A one-page tool for Mr. Fung (SCA, K–6). You pick a date, see that day's timetable as blocks (Music, Health and PE already filled in from the lesson sites), change anything you like, and then **print** it for a substitute or **share** a read-only link.

Plain HTML/CSS/JS. No frameworks, no sign-in, no tracking, no server.

## Files
| File | What it is |
|---|---|
| `index.html` | The page (editor, read-only share view, print layout). Carries the baked `site-updated` meta that feeds the "Updated … MT" stamp |
| `schedule.js` | **Default weekly timetable.** Edit this to change the schedule for everyone |
| `backup-cards.js` | The **No-prep emergency plans** cards (titles, links, the lesson text "Use in a block" adds). Edit this to change a backup card |
| `app-1-state.js` … `app-5-schedule-boot.js` | All behaviour, split into five small files loaded in order (one shared script scope): state and plan loading; rendering the editor; editor events; print, PDF/Word and share links; schedule editor, backup cards, stamp and start-up. `SITES` (lesson-site links) is in `app-1-state.js` |
| `school-year.js` | **School-year settings (review each August).** The EIPS 2026–27 calendar: school days, holidays, PL days, breaks and closures, the 36 lesson weeks with the three catch-up weeks (Dec 14–18, Feb 1–3, June 21–25), and a fallback copy of the PE week plan. Same settings as `school-year.js` on Grade 1 Music, Grade 5 Health and the PE Playbook. Add `?today=YYYY-MM-DD` to the page address to test a date |
| `lesson-catalog.js` | Lesson titles and steps copied from Grade 1 Music, Grade 5 Health and the PE Playbook, used for auto-fill. Regenerate after big lesson changes |
| `autofill.js` | Works out which lesson each Music, Health and PE block gets on a date |
| `export.js` | **Download PDF / Download Word.** Builds a real Letter-size PDF (built-in Helvetica) and a real .docx (hand-written OOXML zip) in the browser. No libraries, no CDN |
| `styles.css`, `palette.css` | Same look as the other lesson sites (colour bar, cards, "Updated … MT" stamp) |

## Where the default schedule comes from
`schedule.js` is built from **Patrick_Fung_Timetable_2026-2027.docx** (Google Drive → My Drive/SCAE/2026-2027/Timetable).
- Monday, Tuesday, Thursday and Friday follow the regular bell times. Wednesday has its own modified times, as the timetable shows.
- A bracket in the timetable, e.g. `6A (5C)`, means a second class is in the gym at the same time (a combined PE block). `schedule.js` stores it as `cls: "6A", with: "5C"` and keeps the original label in `orig`. The class name reads exactly like the timetable, **6A (5C)**, everywhere (editor, print, PDF, Word, share view), with a "combined in gym · 2 classes" badge and a "TWO CLASSES · combined in gym" print tag as extra info. Older saves that used "6A + 5C" are switched back to "6A (5C)" automatically.
- PE blocks have `room: "Gym"`. Wednesday's 6A Library is "Library". The timetable doesn't list other rooms.
- Recess and lunch are shown as break blocks.
- **Library supervision duty** is during the middle recess Tuesday to Friday (none on Monday): 11:55–12:15, or 11:52–12:17 on Wednesday. It's set on that recess block (`duty`, room "Library") and in each day's `duties`, which fills in the Duties box on a new plan. Printouts show it in a boxed "Duties" note at the top and a bold DUTY row.

To bake in changes made on the site: **Weekly schedule → Export JSON**, then paste the JSON after `window.DEFAULT_SCHEDULE =` in `schedule.js`.

## Dates and auto-fill
- **Pick a date** with the date box or the month calendar. Non-school days (weekends, holidays, PL days, breaks, closures, summer) are greyed out and listed under the calendar, and they can't be picked. Wednesdays have a dot and a "Short day · early dismissal" tag.
- The page opens on today, or the next school day (a note says so when today is a holiday or break). `?today=YYYY-MM-DD` pretends it's that date.
- For the chosen date, each block fills in by itself:
  - **Grade 1 Music (1A–1D):** that week's lesson and the class number. The class number is which music class of the week this is for that class, counting only school days. Short weeks follow the site rule: 2 classes means Class 1 and 2 (skip Class 3); 1 class means Class 1 only. Links to the week page.
  - **Grade 5 Health (5B):** that week's lesson, linked to the week page.
  - **PE:** the PE Playbook week plan for that school week, read straight from the PE Playbook's `school-year.js` (so both sites always agree), labelled like **Week 5 · Football (October W1)**, and Class 1–4 by which PE class of the week it is for that class. Warm-up, skill, game, cool-down and the grade-band version are filled in. Links to the month page at that week.
  - **Catch-up weeks and the last day:** a "no new lesson, finish or review" plan instead of a new lesson.
  - **Tech, Social and Library stay manual.** They are never auto-filled.
- **Everything stays editable.** Type in any field and the block gets an **Edited** badge. Auto-fill won't overwrite it again. **Swap lesson** picks a different week or class (**Swapped** badge). **Mark as special activity** (assemblies, field trips) clears the block for your own text and prints it as "Special activity". **Reset to auto-fill** undoes one block. **Reset all to auto-fill** undoes all Music, Health and PE blocks for that date. Notes are never overwritten.
- **Weekday templates:** the Mon–Fri buttons edit plans without a date. A new date starts from its weekday template (day details, Tech/Social/Library plans and block notes), then auto-fill does the rest.
- Print, PDF, Word and share links always use what's on screen, including your edits.

## Downloads
**Download PDF** and **Download Word** sit next to Print, and in the read-only share view too. Files are named like `Sub-Plan-Mr-Fung-2026-10-05-Monday.pdf` / `.docx`; if no date is set, the date is left out. Both include the day header, the boxed duties warning, the day fields, and a Time / Class / Plan table with the combined-class tags and the DUTY row. **Every link is clickable** in both files: lesson-site links show their friendly name (e.g. "PE Playbook") as blue, underlined link text, the "if a plan falls through" backup links are live, and any web address typed into a field (starting with `http://`, `https://` or `www.`) is detected and turned into a link automatically. The PDF uses real link annotations; the Word file uses real hyperlinks (Hyperlink style), so they open with a click or Ctrl+click. In the PDF, long plans wrap and continue onto the next page, and the table header repeats. Emoji can't be shown with the built-in PDF fonts, so they're left out of the PDF (⚠ prints as "!"); the Word file keeps them.

## Where data is kept
- Plans save automatically in the browser's `localStorage` (keys start with `sdp:v1:`): one plan per date (`date:YYYY-MM-DD`) plus one template per weekday (`day:mon` …). There's also one saved template and your edited schedule.
- **Share online** packs the day's plan into the link itself: deflate-raw (CompressionStream) plus base64url after `#share=`. The part after `#` never reaches a server. Opening the link shows a read-only plan.
- Don't put private student information here. Share links and printouts can travel.

**Standing rule (Oct 3, 2026): no other-sites footer.** Do not add a "Mr. Fung's sites" footer or any list of links to Mr. Fung's other sites at the bottom of any page (removed at the request of Mr. Fung; the footer markup and `.mf-sites` styles are gone). The `SITES` list in `app-1-state.js` is only for auto-fill/lesson links inside plans, not a footer. Navigation links inside this site are fine.
