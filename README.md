# Save Paws

An animal-rescue platform with a small pet-supplies shop attached. Volunteers
form teams by area and post rescue reports with photos; anyone can browse and
buy pet supplies using in-app credit called PetPoints. An admin manages the
catalogue and sees orders, revenue and profit.

This started as a personal project and I came back to it after graduating to
finish it properly: see [What I changed on the second pass](#what-i-changed-on-the-second-pass).

## Stack

| Layer | What I used |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7, Axios, react-toastify, lucide-react |
| State | React Context (app state, search, dark mode): no Redux |
| Backend | Node, Express 5 (ESM), Mongoose 8 |
| Auth | JWT in an httpOnly cookie, bcryptjs |
| Uploads | Multer, stored on disk under `backend/uploads/` |
| Email | Nodemailer via Brevo (welcome mail only) |
| Tests | Vitest against a real server process + `mongodb-memory-server` |

## Features

- **Accounts**: register, log in, log out. Three roles: donor, volunteer, admin.
- **Shop**: product list with category tabs and search, product detail pages,
  a cart that survives logout, checkout paid in PetPoints, order history.
- **PetPoints**: a simulated top-up (there is no real payment gateway), and
  donations that transfer points from one account to a volunteer.
- **Volunteers**: public volunteer directory filtered by area, volunteer
  profiles with their rescue photos.
- **Rescue reports**: upload a photo with a caption; images are served from
  `/uploads`.
- **Teams**: create a team by area and category, search teams, invite other
  volunteers, accept or reject invitations.
- **Admin**: product CRUD with stock control, order list with status updates,
  volunteer directory, and a dashboard with revenue, cost of goods and profit.
- **Dark mode** across the admin screens, remembered between visits.

## Running it on Windows

You need **Node 20+** and a **MongoDB** you can connect to: either a local
install or a free MongoDB Atlas cluster.

```bash
git clone <your-repo-url>
cd "Save Paws"
```

**1. Backend**

```bash
cd backend
npm install
copy .env.example .env
```

Open `backend/.env` and set `MONGODB_URI` and `JWT_SECRET`. For the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2. Load the demo data** (optional, but the shop is empty without it)

```bash
npm run seed
```

This clears and repopulates users, products, orders and teams, and prints the
logins it created:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@savepaws.com` | `Admin@1234` |
| Volunteer | `nabila@savepaws.com` | `Volunteer@123` |
| Donor | `mehedi@savepaws.com` | `Donor@1234` |

**3. Start the API**

```bash
npm run dev
```

It listens on <http://localhost:4000>. Start it from inside `backend/`: the
Multer upload path is relative to the working directory.

**4. Frontend** (new terminal)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open <http://localhost:5173>.

## Tests

```bash
cd backend
npm test
```

44 tests covering authorization, order totals, cart persistence and point
transfers. They spawn the real `server.js` against an in-memory MongoDB, so the
route mounting in `server.js` is exercised rather than an app object exported
only for tests. No `.env` is needed: the harness supplies its own values.

## Project layout

```
backend/
  controllers/   one file per feature area
  routes/        express routers, mounted in server.js
  models/        mongoose schemas
  middleware/    userAuth (JWT + role lookup), adminAuth (role check)
  utils/         multer config, regex escaping
  tests/         vitest suites + the server/mongo harness
  seed.js        demo data
frontend/
  src/pages/       route-level screens
  src/components/  shared UI and the admin screens
  src/context/     AppContext, SearchContext, DarkmodeContext
```

## What I changed on the second pass

I audited this cold before touching it and found more than I expected. The
things worth listing:

- **No admin authorization existed.** `adminAuth` read `req.user.role`, but
  `userAuth` only ever set `req.userId`, and the router using it was never
  mounted. Product create/update/delete were reachable without logging in, and
  every order route was reachable by any registered user.
- **Any user could make themselves an admin.** The profile update passed
  `req.body` straight into `findByIdAndUpdate`, so `{"role":"admin"}` worked.
- **Multi-item orders only charged for the last item**: the total was assigned
  in the loop instead of accumulated, which also silently dropped donations.
- **Negative quantities credited the buyer** and inflated stock, because nothing
  enforced a minimum.
- **The saved cart never worked.** The schema and the payload disagreed on field
  names, so Mongoose dropped everything but the quantity, and the read path
  looked for a key the response did not contain.
- **Admin profit always equalled revenue**, because the cost lookup used the
  order line's own id as a product id and 404'd every time. Orders now store the
  cost per line.
- **Dark mode did nothing**: Tailwind 4 needs `@custom-variant dark` to follow
  a class instead of the OS setting.
- **Removed rather than finished:** the OTP email verification (its guard was
  inverted and there was no UI for it anywhere), socket.io (created but never
  attached to the app, and never imported by the frontend), a "coming soon"
  payment page, and a second set of team-invite endpoints that duplicated the
  working ones: one of which let any user add themselves to any team.

## Known limitations

- **Top-ups are simulated.** `add-points` credits the account without a payment
  gateway. It validates and caps the amount, but it is not a real transaction.
- **No rate limiting on login.** Worth adding before this faced real users.
- **`npm run lint` reports errors**: mostly unused variables in the admin
  revenue page, which is the messiest file in the project.
- **Product images are stored as data URIs** by the admin form, which bloats the
  documents. The Multer pipeline used for rescue photos would be the better fit.
- **The frontend bundle is one ~600 kB chunk**: no code splitting yet.
- Tests cover the backend only; there are no component tests.
