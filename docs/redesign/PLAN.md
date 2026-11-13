# Pother Bondhu redesign plan

Status: waiting for your choice of direction (A, B or C). No app code has changed yet.

Samples: serve the repo root (`python -m http.server 5199`) and open `http://127.0.0.1:5199/docs/redesign/samples/`. Screenshots of every sample at 360 px and 1280 px, light and dark, are in `docs/redesign/samples/shots/`. Before screenshots are in `docs/redesign/before/`.

## Who uses it and their top three tasks

1. Someone who has just seen a hurt animal on a Dhaka street, phone in hand: report it in under a minute, then see what happened to it.
2. A volunteer: see what needs help in their area, go, and move the case along to safe.
3. A supporter: follow cases, send PetPoints, buy supplies, ask to adopt. Secondary to 1 and 2.

## Pages: the one main task and what changes

| Page | Main task | Changes |
|---|---|---|
| Rescue desk (signed in `/`) | See cases near me that need help | Greeting banner and four equal tiles go. Report becomes one button: sidebar top on desktop, fixed bottom bar on a phone. Then "Needs help near you" for the user's area, then "Your reports" with status (filtered client side from the existing list), then invitation, teams, and Support (PetPoints and shop as one line). The thank-you volunteer list moves behind a link to Volunteers. |
| Report form | Send a report fast | Own focused screen. Photo, place, what is wrong, Send. Status moves into a "How urgent is it?" disclosure that defaults to Urgent. Send shows a spinner while pending. |
| Rescue board `/rescues` | Scan and filter cases | Same card or row as the desk. Area as one picker, board and map toggle kept. The form leaves the top of this page; `/rescues#post` opens the report screen. |
| Landing `/` | Understand and act | Motto, four line title, lead, two actions (Report an animal, Join as a volunteer), one real photo. Then How it works (three real steps). Then Needs help now (three cases). The teams strip and the dark end section leave the landing; that information stays on Teams and sign up. |
| Navigation | Get to rescue work | Rescue items first. Shop, cart and PetPoints grouped lower under Support (A, C) or after the main tabs (B). |
| Adopt, Vets, Teams, Volunteers, Profile, Shop, Cart, Checkout, Admin | Same jobs | New neutrals, radius and status badges apply. Vets becomes a plain list with call links next to the map. Admin keeps its dense tables. Done page by page after the four screens above. |

## Layout idea

A community noticeboard: the photo of each case leads, status and area are the scanning handles, and Report is always one tap away.

```
Phone, desk (A)                 Desktop, desk (A)
+----------------------+        +--------+-------------------------+-----------+
| = Pother Bondhu  bn  |        | Logo   | Needs help near you     | Your      |
| Needs help near you  |        |[Report]| [Dhanmondi v] [Board|Map]| reports   |
| [Dhanmondi v][Board] |        | Desk   | +--------+ +--------+   |-----------|
| +------------------+ |        | Board  | | photo  | | photo  |   | Invitation|
| | photo  [Urgent]  | |        | Adopt  | |[Urgent]| |[Helped]|   |-----------|
| | Dhanmondi  5 h   | |        | Vets   | | area   | | area   |   | Teams     |
| | note, 2 lines    | |        | Teams  | +--------+ +--------+   |-----------|
| +------------------+ |        | ...    |                         | Support   |
| [ Report an animal ] |        | Support|                         |           |
+----------------------+        +--------+-------------------------+-----------+
```

B swaps the card feed for three status lanes (needs help, being helped, resolved) with compact rows, and a top tab bar. C keeps A's desk plan with print-style cards and keeps the original hero on the landing.

## Tokens (brand colours unchanged)

- Kept exactly: `--sb-clay` #B4441F light and #E0754F dark, `--sb-clay-hi`, `--sb-clay-lo`, `--sb-on-clay`, moss and sun.
- Neutrals move off the default cream. A: page #F6F3EF, surface #FFFFFF, line #E1DAD2, ink #221B16, ink-2 #5C5149. B: cooler, page #F8F7F5. C: lighter cream #F7F1EA. Dark neutrals adjusted to match.
- Type: Fraunces for page titles and the hero, Figtree for the interface, Tiro Bangla for Bangla. Scale 14, 16, 18, 20, 24, 32, 44 to 58 px. Body lines under 75 characters.
- Spacing: 4, 8, 12, 16, 24, 32, 48, 56 px.
- Radius by role: controls 10 px, cards 14 px, photos 10 px, status badges 6 px. Pills stay only in C.
- Shadow: only the fixed Report bar on a phone and C's photo prints. Cards use a 1 px line.
- Status: icon plus word plus colour. Urgent (alert icon, red fill), Needs vet (stethoscope, sun tint), Being helped (walking person, moss tint), Resolved (check, neutral). The red left stripe on urgent cards goes; the filled badge carries it.

## Motion

- Page transition: View Transitions API cross fade, 200 ms, through React Router 7 (`viewTransition` on links and navigate). Off under reduced motion.
- Shared element: a case photo grows from the board into a case view with `view-transition-name`. The backend has no single case endpoint, so the case view would be built client side from the existing list. Only if you want that page.
- Signature moment: when a case is set to Resolved, the badge settles in (scale and opacity, 240 ms) and "Marked safe. Thank you." appears. Urgent cases get no motion. Try it with "Mark as safe" in the samples.
- `rise`, the `shimmer` animation and the polaroid hover tilt go.

## What the browser check needs (kept as is)

- `#loginEmail`, `#loginPassword`, sign in with Enter, redirect away from `/login`
- a `<main>` on every page with at least 40 characters of text
- `button[aria-label='বাংলায় দেখুন']`; after a click `html[lang=bn]` and "একটু যত্ন" inside the `h1` on `/`
- "Page not found" inside `main` on unknown routes
- a visitor on `/admindashboard` is sent to `/login`
- no console errors, AA contrast in both themes, no sideways scroll at 390 px, in English and Bangla
- screenshot paths `/`, `/login`, `/rescues`, `/teams`, `/products`, `/volunteers`, `/admindashboard`
- the mottos stay word for word in `HomePage.jsx`, `Layout.jsx`, `Login.jsx`, and `landing.title1`, `title2a`, `title2b`, `mottoGloss` in both language files

## The recipe items found here and how each goes

| Found | Fix |
|---|---|
| Two fixed radial glows on the body (`index.css` 338 to 343), blurred clay circle behind the hero, `.paw-trail` texture | Removed. Flat page colour. |
| `.card` with one 18 px radius and one soft shadow everywhere | Radius by role, lines instead of shadows. |
| `.btn`, `.chip`, `.tag` all at 999 px | 10 px controls, 6 px badges (A, B). C keeps pills by choice. |
| Last two hero lines in clay italic with `.squiggle` | Title in ink. C keeps the italics, no squiggle. |
| `.eyebrow` labels above headings | Removed everywhere. |
| "Good afternoon, Nabila" plus four equal tiles | Cases near you, your reports, then the rest. |
| `rise` and `shimmer` keyframes | Removed. |
| No page transition | View Transitions cross fade. |
| Copy repeated (desk subtitle, motto twice on the desk, the board explained three times) | Each said once. |

## Checks run so far

- Impeccable detector on `frontend/src`: 2 findings, both a coloured side stripe (`.polaroid.is-urgent` in `index.css`, and a stripe in `AdminDashboard.jsx` line 73). Both go in the redesign.
- unslop sign list: glow washes, uppercase tracked labels, greeting headline, every control a pill, italic for emphasis. All covered above.
- Samples: no sideways scroll at 360 px, no broken images, no em or en dash in any sample file.

## Decisions for you

1. Which direction: A, B or C, or a mix (for example C's landing with A's desk).
2. Your old DESIGN.md says you prefer the original hero with the stair title and polaroids. The new prompt says to cut them back. C keeps them, A and B do not.
3. Should a single case page exist (client side only)? It enables the photo grow transition.
4. B adds an "I am going" button that sets status to Being helped through the existing status endpoint. Keep it in whichever direction you pick?
