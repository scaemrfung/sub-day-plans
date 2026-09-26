# Sub Day Plans

Live: https://scaemrfung.github.io/sub-day-plans/

A one-page tool for Mr. Fung (SCA, K–6). You pick a day, see that day's timetable as blocks, fill in the plan for each block, and then **print** it for a substitute or **share** a read-only link.

Plain HTML/CSS/JS. No frameworks, no sign-in, no tracking, no server.

## Files
| File | What it is |
|---|---|
| `index.html` | The page (editor, read-only share view, print layout) |
| `schedule.js` | **Default weekly timetable.** Edit this to change the schedule for everyone |
| `app.js` | All behaviour: autosave, copy/template, print, share links, schedule editor |
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

## Downloads
**Download PDF** and **Download Word** sit next to Print, and in the read-only share view too. Files are named like `Sub-Plan-Mr-Fung-2026-10-05-Monday.pdf` / `.docx`; if no date is set, the date is left out. Both include the day header, the boxed duties warning, the day fields, and a Time / Class / Plan table with the combined-class tags and the DUTY row. **Every link is clickable** in both files: lesson-site links show their friendly name (e.g. "PE Playbook") as blue, underlined link text, the "if a plan falls through" backup links are live, and any web address typed into a field (starting with `http://`, `https://` or `www.`) is detected and turned into a link automatically. The PDF uses real link annotations; the Word file uses real hyperlinks (Hyperlink style), so they open with a click or Ctrl+click. In the PDF, long plans wrap and continue onto the next page, and the table header repeats. Emoji can't be shown with the built-in PDF fonts, so they're left out of the PDF (⚠ prints as "!"); the Word file keeps them.

## Where data is kept
- Plans save automatically in the browser's `localStorage` (keys start with `sdp:v1:`), one plan per weekday. There's also one template and your edited schedule.
- **Share online** packs the day's plan into the link itself: deflate-raw (CompressionStream) plus base64url after `#share=`. The part after `#` never reaches a server. Opening the link shows a read-only plan.
- Don't put private student information here. Share links and printouts can travel.
