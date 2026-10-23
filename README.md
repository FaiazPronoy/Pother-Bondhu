# Pother Bondhu (পথের বন্ধু)

**An animal rescue network for the streets of Dhaka.**

*ওরা কথা বলতে পারে না, আমরা পারি।* They can't speak. We can.

Pother Bondhu means "a friend of the street". People post a photo of a street
animal in trouble, and volunteers nearby go and help. Supporters fund the work
with PetPoints and a small supplies shop.

| | |
|---|---|
| **Type** | Personal project (not for a course) |
| **Made by** | Faiaz Abrar Zaman Pronoy and Sinthia Khandoker |
| **Versions** | [v1.0, the first version, and v2.0, the rebuild](../../releases) |
| **Old name** | The first version was called **Save Paws**. It is **Pother Bondhu** from v2.0. |
| **Languages** | Bangla and English, with a dark mode |

| English | বাংলা |
|---|---|
| ![The landing page in English](docs/landing.jpg) | ![The landing page in Bangla](docs/landing-bn.jpg) |

---

## Features

**Rescue board**
- Post a photo of an animal in trouble, with the area and a short note
- Filter posts by area
- Every post links to the person who posted it

**Teams**
- Volunteers start a team for their area (feeding route, night rescue, vaccination camp)
- Invite other volunteers, who can accept or decline
- Post updates to the team log

**Volunteers**
- A public list of volunteers, searchable by area
- Each volunteer has a profile, a bio and their rescue posts
- Send PetPoints to a volunteer to support their work

**Rescue desk**
- After signing in, the home page becomes your dashboard
- Quick actions, the latest posts, your teams and waiting invitations

**Wallet and shop**
- Top up PetPoints (an in-app credit)
- Shop for food, bowls, beds and toys, paid in PetPoints
- Add an optional donation for rescues at checkout
- See your orders in your profile

**Admin panel**
- Add and edit products, and manage stock
- Update order status
- See the volunteer list
- Revenue, cost and profit, for all time, this week and this month

**Also**
- One button switches every screen between Bangla and English
- Light and dark mode
- Works on phones
- Every text colour passes the WCAG AA contrast check

| | |
|---|---|
| ![Rescue desk](docs/rescue-desk.jpg) | ![Teams](docs/teams.jpg) |

![On a phone](docs/phone.jpg)

---

## Built with

| Part | Tools |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7 |
| Extras | Axios, react-toastify, lucide-react icons |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB (photos are stored in it too) |
| Login | JWT in a secure cookie, bcrypt, lockout after 5 wrong passwords |
| Uploads | Multer, with each photo checked by its real file type |
| Tests | Vitest with an in-memory MongoDB, Playwright |

Fonts: Fraunces, Figtree and Tiro Bangla.

---

## Demo logins

The sign in page has a one-tap button for each.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@potherbondhu.com` | `Admin@1234` |
| Volunteer | `nabila@potherbondhu.com` | `Volunteer@123` |
| Supporter | `mehedi@potherbondhu.com` | `Donor@1234` |

Nabila has a team invitation waiting, so you can try the invite flow right away.

---

## Run it

You need **Node 20+** and **MongoDB** (local, or a free Atlas cluster).

- **Windows:** double-click `RUN-PotherBondhu.bat`. It sets everything up and opens <http://localhost:5175>.
- **By hand**, the backend:

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

- Then the frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. In `backend/.env`, set `MONGODB_URI` and `JWT_SECRET`.

---

## Settings

Copy `backend/.env.example` to `backend/.env`. The `.env` file is never committed.

| Variable | What it is |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | A long random string that signs the login cookie |
| `PORT` | Port for the API (default `4000`) |
| `CLIENT_URL` | The site allowed to call the API |
| `NODE_ENV` | `development` or `production` |
| `SMTP_USER`, `SMTP_PASS`, `SENDER_EMAIL` | Optional, for the welcome email |

---

## Tests

- `cd backend && npm test` runs **70 tests** against the real server and an in-memory database
- They cover who can do what, orders, stock and points when many requests come at once, photo uploads, teams and the login lockout
- `tools/browser_checks.py` signs in as each role, opens every page, and checks contrast in both themes, both languages and on a phone

---

## Folder layout

```
backend/
  controllers/   one file per feature
  routes/        API routes
  models/        database schemas
  middleware/    login and admin checks
  tests/         the test suites
  seed.js        demo data
frontend/src/
  pages/         one file per screen
  components/    layout, shared pieces and admin screens
  context/       app state, theme and language
  i18n/          Bangla and English text
tools/           browser checks
```

---

## Notes

- Top ups are simulated. No real payment happens.
- Product images are links typed into the admin form, not uploads.

## Photo credits

All photos are from [Unsplash](https://unsplash.com) under the Unsplash License.
Thanks to @sian_labay_official, @mpd33p, @alexandermassph, @rafatulux,
@mainulbmd, @tarikulxraana, @emon224, @theaminalizadeh, @parastoo_gh,
@jtrinh_artwork, @hemangpatel, @kristinwilson, @raditahmed6, @kolithaheshan,
@aalochak, @hypethat, @okeykat, @mattycoulton, @koalink, @jordanbigs,
@brettwharton, @goldencoastlife, @feliciamontenegro, @pozva, @moob, @alfredl
and @neakasa.

---

## Authors

- **Faiaz Abrar Zaman Pronoy** (ফাইয়াজ আবরার জামান প্রনয়), lead developer
- **Sinthia Khandoker** (সিনথিয়া খন্দকার)

## Licence

Copyright 2026 Faiaz Abrar Zaman Pronoy and Sinthia Khandoker. All rights reserved.
You may read the code and run it to try it out. You may not copy it, hand it in
as your own work, or publish it. See [LICENSE](LICENSE).
