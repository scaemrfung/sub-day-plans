# Sub Day Plans

Live: https://scaemrfung.github.io/sub-day-plans/

A one-page tool for Mr. Fun (SCA, K–6). You pick a day, see that day's timetable as blocks, fill in the plan for each block, and then **print** it for a substitute or **share** a read-only link.

Plain HTML/CSS/JS. No frameworks, no sign-in, no tracking, no server.

## Files
| File | What it is |
|---|---|
| `index.html` | The page (editor, read-only share view, print layout) |
| `schedule.js` | **Default weekly timetable.** Edit this to change the schedule for everyone |
| `app.js` | All behaviour: autosave, copy/template, print, share links, schedule editor |
| `styles.css`, `palette.css` | Same look as the other lesson sites (colour bar, cards, "Updated … MT" stamp) |

## Where the default schedule comes from
`schedule.js` is built from **Patrick_Fung_Timetable_2026-2027.docx** (Google Drive → My Drive/SCAE/2026-2027/Timetable).
- Monday, Tuesday, Thursday and Friday follow the regular bell times. Wednesday has its own modified times, as the timetable shows.
- A bracket in the timetable, e.g. `6A (5C)`, means a second class is in the gym at the same time (a combined PE block). `schedule.js` stores it as `cls: "6A", with: "5C"` and keeps the original label in `orig`. The site and printouts show **6A + 5C** with a "TWO CLASSES · combined in gym" tag.
- PE blocks have `room: "Gym"`. Wednesday's 6A Library is "Library". The timetable doesn't list other rooms.
- Recess and lunch are shown as break blocks. Supervision duties aren't in the timetable, so add them in the day's **Duties** box or in that block's note.

To bake in changes made on the site: **Weekly schedule → Export JSON**, then paste the JSON after `window.DEFAULT_SCHEDULE =` in `schedule.js`.

## Where data is kept
- Plans save automatically in the browser's `localStorage` (keys start with `sdp:v1:`), one plan per weekday. There's also one template and your edited schedule.
- **Share online** packs the day's plan into the link itself: deflate-raw (CompressionStream) plus base64url after `#share=`. The part after `#` never reaches a server. Opening the link shows a read-only plan.
- Don't put private student information here. Share links and printouts can travel.
