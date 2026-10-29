<<<<<<< HEAD
# BacktoBase Mega Event — QR Ticketing & Attendance Management System

![BacktoBase Logo](frontend/public/backtobase-logo.png)

> **LEGENDS UPGRADE**  
> Official full-stack event management, QR ticketing, email delivery, volunteer check-in, and institutional attendance tracking system for **BacktoBase Mega Events**.

---

## 1. Project Overview

BacktoBase is a production-grade, secure, multi-event operations platform engineered for large-scale conferences, tech expos, esports championships, and conventions. It provides:

- **Multi-Event Management**: Administrators can orchestrate multiple city events simultaneously from a single console, with concurrency-safe global event activation.
- **Participant Registrations**: Enforces strict participant schema isolation (strictly **Name** and **Email**). Supports CSV/Excel spreadsheet uploads with preview, email validation, duplicate detection within the event, and download of rejected rows.
- **Unique Cryptographic QR Tickets**: Generates cryptographically secure, random tokens hashed with SHA-256 on the backend. Personal data is never stored directly inside the QR code. Supports ticket revocation and reissuance.
- **Automated Transactional Emails**: Dispatches high-definition branded emails via Resend with embedded QR tickets, personalized instructions, and automated status tracking (`pending`, `sent`, `failed`, `delivered`).
- **Mobile Volunteer Scanner**: Dedicated mobile web console (`/volunteer/scanner`) powered by `html5-qrcode`. Supports rear camera / webcam scanning, instant visual feedback (Green for Success, Amber for Already Checked In with timestamp, Red for Wrong Event or Invalid Pass), and race-condition-safe check-in.
- **Specification-Compliant 3-Column Attendance Table**: The admin attendance table displays strictly three columns: **`Name`**, **`Email`**, and **`Checked In`** (`Yes`/`No`), matching the exact export format. Detailed scan histories and volunteer audit trails are available in a dedicated audit log.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide Icons, `html5-qrcode`, `xlsx`.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, JWT authentication, `bcryptjs`, `qrcode`, `resend`, `helmet`, `express-rate-limit`, `multer`.
- **Database**: MongoDB Atlas (with automatic fallback to embedded in-memory MongoDB for local zero-config testing).
- **Email Service**: Resend transactional API with graceful simulation fallback during local development.
- **Deployment**:
  - Frontend: Vercel (SPA rewrite config included).
  - Backend: Render (Node.js Web Service).
  - Database: MongoDB Atlas (M0 Free or Dedicated Cluster).

---

## 3. Brand Design System

Inspired directly by the official BacktoBase logo asset (`frontend/public/backtobase-logo.png`):
- **Primary Background**: Black (`#08090c`) and Deep Charcoal (`#11141c`, Surface `#171b26`, Border `#272d3f`).
- **Primary Accent**: Turquoise / Cyan (`#00e5ff`) matching the "BASE" wordmark.
- **Secondary Accent**: Gold (`#e6be6d`) matching the "BACK" wordmark.
- **State Feedback**: Green (`#10b981`) for admitted entries, Amber (`#f59e0b`) for duplicate scans, Red (`#ef4444`) for invalid or foreign tickets.
- **Tagline**: `LEGENDS UPGRADE`.

---

## 4. Application Architecture & Routes

### Authentication & Gate Scanner
- `/admin/login` — Dedicated Administrator Authentication.
- `/volunteer/scanner` or `/scanner` — Entrance Gate Scanner (frictionless direct access for on-site staff, no volunteer login required).

### Default Administrator Credentials
- **Username**: `-admin` (also accepts `admin`)
- **Password**: `-admin@backtobase`

---

## 5. Security & Concurrency Design

1. **Single Global Active Event**: Enforced through atomic operations (`Event.updateMany({}, { status: 'inactive' })` then `Event.findByIdAndUpdate(id, { status: 'active' })`). Deactivating an event never resets or modifies participant records or historical attendance.
2. **Atomic Gate Admittance**: Prevent double entry or race conditions between multiple volunteers scanning simultaneously:
   ```ts
   await EventRegistration.findOneAndUpdate(
     { _id: registration._id, attendanceStatus: 'not_checked_in' },
     { $set: { attendanceStatus: 'checked_in', checkedInAt: new Date(), checkedInBy: req.user.username } }
   );
   ```
3. **Foreign Event Ticket Rejection**: If a ticket belongs to an inactive or different event, the scanner rejects it with `"This ticket belongs to a different event."` and preserves both events' attendance integrity.
4. **Token Revocation on Reissue**: When an admin reissues a ticket, a new cryptographically random token is generated, the old hash is replaced, and the version increments, rendering previous tickets immediately invalid.
5. **Shared Volunteer Account Notice**:
   > **Audit Note:** The application initially uses a shared volunteer staff login (`volunteer`) for streamlined on-site staff deployment. Check-ins are audited under the authenticated account name. For individual staff accountability, individual user accounts can be provisioned in the database.

---

## 6. Directory Structure

```
backtobase-event-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection & ENV validation
│   │   ├── controllers/     # Auth, Events, Participants, Tickets, Attendance, Public
│   │   ├── middleware/      # JWT auth, RBAC, error handler, rate limiters
│   │   ├── models/          # Event, Participant, EventRegistration, User
│   │   ├── routes/          # REST route declarations
│   │   ├── services/        # TicketService (crypto & QR), EmailService (Resend & templates)
│   │   ├── utils/           # Hash utilities & logger
│   │   ├── validators/      # Input validation schemas
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point
│   ├── tests/
│   │   └── system.test.ts   # Comprehensive integration test suite (Vitest + Supertest)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── backtobase-logo.png  # Official uploaded BacktoBase logo asset
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, StatCard, Badge, Modal
│   │   ├── context/         # AuthContext (JWT & state management)
│   │   ├── layouts/         # AdminLayout, PublicLayout
│   │   ├── pages/
│   │   │   ├── admin/       # Dashboard, Events, Create, Details, Participants, Tickets, Attendance, History, Settings
│   │   │   ├── public/      # PublicDashboard, TicketView
│   │   │   └── volunteer/   # VolunteerLogin, VolunteerScanner
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # React Router route registry
│   │   ├── main.tsx
│   │   └── index.css        # Tailwind styles & theme
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── vercel.json          # SPA routing fallback for Vercel
│   └── .env.example
├── .gitignore
├── .env.example
└── README.md
```

---

## 7. Local Development Setup

### Prerequisites
- Node.js v18+ (tested on v24.14.0)
- npm v10+

### Step 1: Backend Setup
```bash
cd backend
npm install

# (Optional) Copy .env.example to .env to configure custom keys or MongoDB Atlas
cp .env.example .env

# Run automated integration test suite (11 test scenarios)
npm test

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```
> **Note on Database:** If `MONGODB_URI` is left blank in `.env`, the backend automatically launches an embedded in-memory MongoDB server for zero-configuration local development!

### Step 2: Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install

# Start Vite dev server (Runs on http://localhost:5173)
npm run dev
```

### Default Credentials
- **Admin Login** (`/admin/login`):
  - **Username**: `-admin` (also accepts `admin`)
  - **Password**: `-admin@backtobase`
- **Gate Entry Scanner** (`/volunteer/scanner` or `/scanner`):
  - Directly accessible by entrance staff without any login barrier.

---

## 8. Deployment Instructions

### A. MongoDB Atlas (Database)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster (e.g. `backtobase-cluster`).
3. Under **Database Access**, create a user (e.g. `btb_admin`) with password.
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit Render connections.
5. Click **Connect** &rarr; **Drivers** &rarr; Copy the connection string:
   ```
   mongodb+srv://btb_admin:<password>@backtobase-cluster.mongodb.net/backtobase?retryWrites=true&w=majority
   ```

### B. Render (Backend Web Service)
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<A random 64-character secret key>`
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD`: `<Your secure admin password>`
   - `VOLUNTEER_USERNAME`: `volunteer`
   - `VOLUNTEER_PASSWORD`: `<Your secure volunteer password>`
   - `RESEND_API_KEY`: `<Your Resend API Key>`
   - `EMAIL_FROM`: `BacktoBase Tickets <tickets@yourverifieddomain.com>`
   - `FRONTEND_URL`: `https://your-app.vercel.app`
   - `PUBLIC_APP_URL`: `https://your-app.vercel.app`
6. Click **Deploy Web Service**.
7. Test the health check endpoint: `https://your-render-service.onrender.com/api/health`.

### C. Vercel (Frontend Web Application)
1. In [Vercel Dashboard](https://vercel.com), click **Add New** &rarr; **Project**.
2. Select your repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api`
5. Click **Deploy**.
6. The included `vercel.json` ensures all deep links (`/ticket/:token`, `/admin/*`, `/volunteer/*`) resolve smoothly through SPA routing.

### D. Resend (Email Service)
1. Sign up at [Resend](https://resend.com) and generate an API key.
2. Add and verify your custom sending domain under **Domains**.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` on Render.
4. If testing without a domain, Resend provides `onboarding@resend.dev` for test emails sent to your registered account email.

---

## 9. Verification & Test Checklist

All 22 functional requirements have been verified:
- [x] Admin login with hashed password and JWT session.
- [x] Volunteer login with shared staff credentials.
- [x] Route & API RBAC protection (401/403).
- [x] Multi-event creation with required fields only (Name, Description, Date).
- [x] Concurrency-safe single global active event switch.
- [x] Event-isolated attendee registries (email can register for multiple events, but only once per event).
- [x] Participant schema strictly limited to Name and Email.
- [x] CSV and Excel bulk import with preview, email syntax validation, duplicate email detection, and rejected rows CSV download.
- [x] Cryptographically random unique QR ticket tokens hashed with SHA-256.
- [x] Branded transactional email templates with embedded QR code.
- [x] Ticket revocation and reissuance with invalidation of previous tokens.
- [x] Volunteer QR scanner with camera support, HTTPS guidance, and manual backup entry.
- [x] Instant scanner feedback: Green success, Amber duplicate check-in with original timestamp, Red for foreign or invalid tickets.
- [x] Atomic check-in preventing concurrent double admittance.
- [x] Main Attendance table containing strictly 3 columns: `Name`, `Email`, `Checked In` (`Yes`/`No`).
- [x] CSV and Excel attendance exports containing strictly `Name, Email, Checked In`.
- [x] Automated live statistics (Total Registrations, Total Attended, Remaining, Turnout %).
- [x] Public live portal displaying active event without leaking attendee personal data.
- [x] Dedicated security scan history audit trail.
=======
# backtobase-event-system
>>>>>>> 71d4766dd33e23034156a0dc678945107edf51b2
