/* No-prep backup cards for Sub Day Plans (shown under "No-prep emergency plans").
   Only activities that exist on the linked sites (checked Sept 2026).
   Loaded before app.js; app.js reads window.SDP_BACKUP_CARDS. */
(function () {
  "use strict";
  var BASE = "https://scaemrfung.github.io";
  window.SDP_BACKUP_CARDS = [
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
      title: "Big-group PE games", badge: "PE · gym", site: "PE Playbook → Big-Group Games",
      url: BASE + "/pe-playbook/games.html",
      extra: { label: "PE Playbook · New Games", url: BASE + "/pe-playbook/new-games.html" },
      items: [
        "Searchable Big-Group Games cards with how-to steps and equipment",
        "Works when two classes are combined in the gym",
        "Pick one game the class already knows; keep everyone moving"
      ],
      lesson: "Big-group game from the PE Playbook (Big-Group Games page)",
      instructions: "Open the Big-Group Games page and search for a game the class knows. Equipment and steps are listed on each card."
    },
    {
      title: "Grade 1 Music · Practice studio", badge: "Music · Gr. 1", site: "Grade 1 Music → Studio",
      url: BASE + "/Grade-1-Music/studio/",
      extra: { label: "Music Practice Studio (same tools, own page)", url: BASE + "/music-practice-studio/" },
      items: [
        "Rhythm maker — tap boxes to make ta / ti-ti / rest, press Play",
        "Classroom piano — so, mi and la marked; tap to hear and echo-sing",
        "Guess the instrument — play a mystery sound, the class names it"
      ],
      lesson: "Music Studio on the projector: Rhythm maker, Classroom piano, Guess the instrument",
      instructions: "Open the Studio on the projector. Open Rhythm maker, make a rhythm and have students clap it back. Then play Guess the instrument."
    },
    {
      title: "Grade 1 Music · Copycat songs", badge: "Music · Gr. 1", site: "Grade 1 Music → Studio → Copycat songs",
      url: BASE + "/Grade-1-Music/studio/#copycat?song=hello",
      items: [
        "The class songs, sung phrase by phrase with the words lit up",
        "e.g. Hello Everybody (greeting song on so–mi)",
        "e.g. Rain, Rain, Go Away"
      ],
      lesson: "Sing-along with Copycat songs in the Studio (Hello Everybody, Rain, Rain, Go Away)",
      instructions: "Open Copycat songs in the Studio. Press Play, the class echoes each phrase, then Build it up and sing the whole song together. Pick another song from the list."
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
})();
