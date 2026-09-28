# The presentation website: brief, plan and data

Status on 28 September 2026, 19:20: brief agreed with Elias, data exported, nothing coded yet. Review I is Wednesday 30 September; the site is the presentation (about 15 minutes), the PDF is the submission.

Published 29 September 2026 at https://elie-nasr-11.github.io/ordinary-departures/ from the public repository https://github.com/Elie-Nasr-11/ordinary-departures (this folder is that repository; commit and push here to update the live site).

Status on 29 September 2026, morning (Claude Code): **libraries vendored.** `lib/three.min.js` (r128), `lib/gsap.min.js`, `lib/ScrollTrigger.min.js`, `lib/ScrollToPlugin.min.js` (3.12.5) are local and `index.html` loads them from there; the spine's labels avoid each other with a per-frame collision pass. The fonts are local too: `css/fonts.css` declares Inter (300/400/500/600, with the optical-size axis) and JetBrains Mono (400/500) from twelve woff2 files in `fonts/` (Latin and Latin Extended). The folder now makes no network request at all; it runs offline from `python3 -m http.server`.

Status on 29 September 2026, morning (Claude Code): second round of tweaks in. The map now comes in as two diagonals (Meaning to Value, Value to Form) then the whole, the future and the claims, about five screens; the spine is wider and longer with the images pulled toward it and a stronger haze; every card is rounded and borderless and opens in place (a term or image opens a small card next to the click, a case card grows to show its sketch and texts); the framework's ring is drawn in the scene with faint labels; the premise is one line then two paragraphs side by side then the question; the closing note is gone; references are numbered with bold authors; the dictionary keeps one definition open with bold white letters.

Status on 29 September 2026, early hours (Claude Code): the design pass after Elias's feedback is in. Header is a row of dashes with the current step's title (hover a dash for its word), arrows at the bottom, no progress bar, no captions; the landing line reads "Elias Nasr · Architecture Thesis I · Fall 2026"; images reveal their name on hover; the map beats are slower with bigger dots, fainter lines and quieter claims; each question opens on the dimmed map with its route lit and the question beside it, then its terms lift onto the track and flow through a haze of the layers' colours (map hidden); cases are cards beside their step (sketch first, click for the full case); the framework's labels show on hover of a mark; the discussion is a text slide, the graph rising panel by panel, then "What follows"; the note, then "To be continued". The dictionary is a dense inline text (click a term to open its definition in white); references are a dense page. Old case-panel module `js/cases.js` is no longer loaded.

Status on 28 September 2026, night (Claude Code): all three stages built and running; Elias asked for the whole thing first, then changes. Files: `index.html`, `css/site.css`, `js/site.js` (stage 1: landing, premise, the wall, the map rising), `js/ride.js` (stage 2: the six spines on a curved track, the cases at their steps, the framework, findings, position, proposition, the discussion beats, the note and the credits), `js/cases.js` + `css/cases.css` (the case panels), `js/discussion.js` + `css/discussion.css` (the discussion screens with the pencil graph), `js/overlays.js` + `css/overlays.css` (dictionary with search, references). `lib/sketch.js` now exposes `window.sketchSVGs(root)`. The ride is 155 screens long with 122 stops; arrows and space step through them; the header's Cases and Questions menus, Discussion, Dictionary and References all work. Cases sit inside the questions: 01 at the end of Q1, 03 at Q2 "Procession", 07 at Q2 "Walkout" and Q5 "Routine", 05 at Q3 "Testimony", 04 at Q4 "Transmission of skills", 06 at Q5 "Non-place", 02 at Q6 "Anthropological place". Still to do: vendor three.js and GSAP into `lib/` for the offline copy (needs Elias's go-ahead to download), and his round of changes.

Status on 28 September 2026, evening (Claude Code): stage 1 built, shown to Elias. Files: `index.html`, `css/site.css`, `js/site.js`. Serve with `python3 -m http.server 8765 --directory site` (or the `site` entry in `../.claude/launch.json`) and open http://localhost:8765. What runs: landing, the four premise screens, the wall of 123 images rising era by era along a gentle arc, the whole wall, the loosening onto the map (the eight images that are on the map fly to their exact place), the timeline and events rail, the four layers in the map's order with their captions, the connections, the future column with its echoes, the 68 claim markers and the argument along the base. Header jump links for Thesis, Images and Map; arrows and space step between stops; every term, event, echo, claim and tile opens the black overlay. `window.OD` exposes the ride for checks (`OD.scrollToT(t, 0)`, `OD.T`, `OD.STOPS`). Libraries still come from cdnjs (three r128, GSAP 3.12.5); vendor them into `lib/` for the offline copy in stage 3. The `#scroll` spacer is `T.total` screens tall and a resize keeps the viewer at the same stop.

## 1. What Elias asked for, in his words

From his messages of 28 September (see `../conversation-log.md`, 15:14 onward):

- "one page that changes rather than multiple. we can give it a nice scroll to progress effect rather than clicking alone."
- "maybe you can scroll along a spine in 3d rather than just a 2d pan. nothing should be a 2d pan. it should all be and feel like an entity in space. not with a free orbit, but with a guided series of views."
- "start on a very blank landing with just centered text of the title and eyebrow and whatever else. as i scroll down, the start is just super minimal plain text with nothing else, until we pass the thesis question."
- Then the map: "elements of it rising one by one, first the timeline, then the … layers … and each time a little bit of text on what and why it is there and it gets populated as i scroll. connections then start forming as i keep scrolling until departure is fully mapped, and then … the future stuff projected appear periodically and connect as i scroll."
- His revision: "what if departure in images came before departure mapped and images in the grid disappeared, rearranged, and faded into place as departure mapped appeared sequentially."
- The questions: "the main spines being 3 dimensional and flowing from the outside right side of the screen into the screen and up through the top left, almost as if we were watching it from a rollercoaster looking backwards. then, we go through each question stopping at points and flowing smoothly."
- Then "the position and proposition again in very minimal form, with a discussion on scope and a finale end credits."
- "header should contain click-to-scroll to thesis, images, map, cases, questions (in dropdown menu as well), discussion, dictionary, and references."
- "every node should be clickable for a definition and/or image to appear and overlay the screen in black fade. it should be super interactive, smooth, and guided."

His answers to the four open questions (19:03):
1. Cases: "cases come inside the questions wherever they occur." Each case appears during the ride of the question it belongs to (mapping in §4). After Q6 the framework gathers them: the map faded, all seven marks in place, lines to the "?", then the findings.
2. Layer order when the map rises: the map's order: Meaning, Value, Practice, Form (after the timeline).
3. The ride: the step you are at is near, bottom right; the ones you have passed trail away to the top left. "give it room for organic variance and just a natural flow."
4. Internet in the review room: yes.

## 2. The ride, in order (agreed)

1. **Landing.** Black. Eyebrow ("Architecture Thesis I · Fall 2026"), title, subtitle, name, centred. A scroll hint.
2. **Premise.** A few plain lines, one at a time, ending on the central question (texts in §5).
3. **In images.** The wall of 123 images rises in space, era by era, with the era names. Camera travels along it with a slow turn, never a flat pan.
4. **Mapped.** The wall loosens: each image drifts to its era column and its layer row on the map and fades. The timeline (nine eras, the events rail) draws first. Then the four layers rise one by one, Meaning, Value, Practice, Form, each with one line on what it is and why it is there; the terms fill in. Then the connections draw. Then the Future column projects and its echoes connect. Then the argument's numbered claims along the map.
5. **Six questions.** For each: its terms lift off the map and line up as the spine; the camera drops onto the spine and rides it (near right → far top-left), stopping at each step; the branches sit to either side; the question's images appear beside their terms. Cases appear at the step they belong to (two images, the sketch, the four texts). At the end of a question, a breath back up at the map, then the next.
6. **Framework and findings.** The map faded, the seven case marks in place, the practice lines to the future, the "?" thesis mark; the two findings along the base.
7. **Position** and **proposition**, minimal, centred.
8. **Discussion.** Routine is not one pace: the three rhythms and the measured graph (the data is in `data/cases.json` → `discussion`).
9. **Closing note** and credits: the references roll.

Header (fixed): Ordinary Departures · Thesis · Images · Map · Cases · Questions ▾ (Q1–Q6) · Discussion · Dictionary · References. Dictionary and References open as overlays. Keyboard: arrows and space jump to the next stop; scroll moves continuously.

## 3. Architecture planned (a recommendation, not a constraint)

- One `index.html` with the CSS and JS inline, `data/*.json` fetched at load, `img/` alongside. Serve with `python3 -m http.server` (no build step). It must also run offline from a folder.
- three.js (r128 UMD from cdnjs is the simplest non-module build) for the scene; GSAP 3 with ScrollTrigger (scrub ≈ 0.8) and ScrollToPlugin for the stops. A tall scroll spacer (one "screen" of scroll per stage step, about 40 screens in total) drives one master timeline with labels; camera position and target are tweened between keyframes; "stops" are plateaus where nothing moves and the text sits.
- Labels as DOM elements (one div per term), positioned every frame by projecting the world position with the camera (`vector.project(camera)`); hide labels behind the camera; scale font size with distance; show only weight ≥ 3 labels when far, all when near. That gives hover and click for free. About 460 labels (353 terms, 43 echoes, 57 events, 8 image captions) is fine.
- Term dots as sprites (shared circle texture, per-sprite scale and colour); connections as `THREE.Line` cubic curves (24 segments), one per relation; draw them progressively with `drawRange` staggered left to right.
- Row bands as planes with the row tints; era columns as thin lines; the events rail near the top.
- The image wall: 123 textured planes (4:3) in a 17-column grid grouped by era; on the map stage each tile tweens to its era column and layer row and fades out as the terms fade in.
- The spines: for each question the layout is exported (`data/spines.json`): steps along x, branches above and below (y), images. In 3D, lay the spine on a curve that starts near the camera at bottom-right and recedes to the top-left; move the spine along the curve as the user scrolls so the current step is always near; add a slow breathing drift (small sine offsets on the camera) for the organic variance he asked for; ease every camera move.
- Camera: perspective, fov ≈ 40. The map is 6078 × 3031 px; at 1/60 scale it is ≈ 101 × 50 units, so a distance of ≈ 140 units frames it. World: x = px/60 − 50.6, y = −py/60 + 25.3, z = 0 on the map plane.
- Overlays: a black fade with the term's label, layer, person, definition, source, and an image when one exists (a board tile with the same name, or the term's spine image). Dictionary: all terms alphabetically with search. References: the list.
- Performance: render continuously with requestAnimationFrame; keep textures ≤ 640 px; no post-processing needed.

Stage plan that was agreed: (1) landing → premise → images → map rising, shown to Elias before going on; (2) spines with cases, framework, findings, position, proposition, discussion; (3) polish, dictionary, references, offline copy, a run-through with him.

## 4. Where the cases sit inside the questions

| Case | Question | Suggested step on that spine |
|---|---|---|
| 01 Kennedy LC-39 | all six; show it at the end of Q1 (or at the launch complex step of Q2) | "The launch complex" |
| 03 Babylon | Q2 | "Procession" / the processional route step |
| 07 Spaceport America | Q2 (the route in) and Q5 (routine) | Q2 "Threshold" or the last steps; Q5 "Non-place"/"Routine" |
| 05 Vietnam Veterans Memorial | Q3 | the testimony/witness steps |
| 04 Ise Jingu | Q4 | the rebuilding/transmission steps |
| 06 TWA to Roissy | Q5 | "Non-place" |
| 02 Baikonur | Q6 | the rituals steps (also fits Q4) |

Use `data/spines.json` `steps[].label` to pick the exact step; the case's `q` field is in `data/cases.json`.

## 5. Texts for the screens

**Landing.** Eyebrow: Architecture Thesis I · Fall 2026. Title: Ordinary Departures. Subtitle: The launch complex as leaving the Earth becomes routine. Name: Elias Nasr.

**Premise** (from page 1 of the PDF):
1. "How people have made meaning of leaving, what they valued, how they practised it and what they built for it, from the first rites of passage to a projected future."
2. "Across history, people have made leaving mean something, weighed what it was worth, practised it together and built for it: the seclusion lodge, the processional way, the pilgrim road, the harbour quay, the departure hall. Each gave form to a threshold that mattered because it was rare, risky or irreversible. Each time departure became frequent, safe and technical, the rite shrank and the form was handed to the machine. Procession became processing, and the cathedral became the non-place."
3. "The launch complex is the extreme case of this history. It serves the most irreversible departure humans make, it was engineered almost entirely around the vehicle, and it is becoming routine now."
4. Central question (large): "As leaving the Earth becomes routine, where does the meaning of departure move, and how can the launch complex give it form?"

**Layers, one line each** (draft; Elias may edit):
- Timeline: "Nine eras, from the first rites to a projected future. Time runs left to right."
- Meaning: "How people make sense of leaving. A departure is an idea before it is a place."
- Value: "What makes it count. Routine is a change in value before it is a change in form."
- Practice: "How meaning and value are exercised. Rites are where meaning survives routine."
- Form: "What gets built for it. This is where the thesis has to act."
- Connections: "Terms that build on, oppose or become one another."
- Future: "The same vocabulary, projected."

**Position, proposition, findings, discussion, closing note:** in `data/cases.json` (`framework`, `discussion`). The six questions: in `data/spines.json` (`question`, `end`). The talk's timing and speaker notes: `../deck/src/project/slides/*.html` (`<aside>` in each).

## 6. Data files

`data/map.json` (from the page-1 layout, pixel coordinates on a 6078 × 3031 sheet):
- `terms[]`: id, label, tier (M/V/P/F), person (L/W/M/A), lens, d (definition), src, era (1–8, 9 = future), x, y, w (weight 1–4; 4 is largest).
- `echoes[]`: terms projected into the Future column: id (`<src>~f`), src (the term id), label, tier, person, x, y.
- `imgs[]`: the eight images on the map: file (`img/map/<file>.jpg`), label, dt, tier, era, x, y, w, h.
- `events[]`: the events rail: id, label, txt (label with year), year, era, d, src, x, y.
- `rels[]`: s, t (term ids), k: `ali` (alike/builds on), `opp` (opposes), `bec` (becomes), `ten` (tension). Draw as cubic curves, colours: ali #9a9ea8, opp #c9ccd3 dashed, bec #f29273 dashed, ten #b3a3f0 dashed.
- `args[]`: the 68 numbered claims (num, n = movement N1–N8/NM, claim, src, terms, anchor); `notePos[]`: num, x, y of each claim's marker on the map. `narr`: the movement names.
- `flows`: the six question flows (steps with tied events, the question text, the end).
- `layout`: W, H, SB (map bottom), RAIL0/RAILH (events rail), colX/colW (era columns by era index), scX/SCW (Future column), SX0, rowY/ROWH (row bands by tier), ERAS, TIERS, TFILL (row tints), RTINT.

`data/board.json`: 123 tiles in board order: i, name, date, p (person), layer, era (board era name), file (`img/tiles/<file>`), credit. Board eras map to the map's: Preliterate→1, Ancient→2, Pilgrimage→3, Sail→4, Industry and flight→5, Heroic space age→6, Reckoning→7, Now→8, Futures, in film→the Future column.

`data/spines.json`: per question Q1–Q6: question, end, flow, `steps[]` (id, label, tier, n, x, y = 0, ev), `terms[]` (every placed term: id, label, tier, d = graph distance from the spine 0–5, root = the step it hangs from, tied, x, y; the spine runs left to right on a 6024-px sheet, y negative is above the spine), `edges` (the four layer boundaries as polylines, j = 0..4), `imgs[]` (the five images placed on the sheet: href → `img/spines/<href>`, x, y, w, h), `images` (label, tile id, caption, date), W, HT, OFF, L0, R0.

`data/cases.json`: `cases[]` (key, n, name, meta, q, people, layers, imgs → `img/cases/<key>.jpg` with captions, theory, method, outcome, take, src, sketch_svg = the clean SVG of the pencil diagram; run it through `lib/rough.js` + `lib/sketch.js` inside a `.dg` container to get the pencil look); `framework` (sub, text[3], position, proposition); `discussion` (all page texts, the yearly data ALL/CREW/PEOPLE, BEO, NATIONS, FIRMS, SRC, NOTE).

`data/refs.json`: the 119 references.

`img/tiles/` 123 board tiles, 640 × 480, tinted. `img/cases/` 14 case images, 960 × 720. `img/map/` 8 map images, 440 × 330. `img/spines/` 96 spine images, 400 × 300.

`lib/rough.js`, `lib/sketch.js` (the pencil pipeline; sketch.js processes every `.dg svg` on load and sets `document.body.dataset.sketched`), `lib/d3.min.js` (not required for the site; the map layout is already exported).
