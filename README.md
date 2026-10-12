# IntelliMatch — AI-Based Internship & Skill Gap Analysis System

**IntelliMatch** is a web platform that connects university students with organizations offering internships. It reads a student's CV, understands their skills, and ranks every internship by how well it fits them, while showing exactly which skills are missing. Companies get a shortlist of the best-matched candidates instead of a pile of unsorted applications.

🌐 **Live website:** [intellimatch-886.netlify.app](https://intellimatch-886.netlify.app)

Anyone can browse internships on the homepage without an account. Signing in (email or Google) unlocks match scores, applications and dashboards.

---

## ✨ Features

### For students
- **AI skill matching**: every internship gets a personal match score based on skills, skill weights, verified badges and CGPA.
- **Skill gap analysis**: see which required skills you are missing and what to learn next.
- **CV parsing**: upload a PDF CV and skills are extracted automatically (Affinda).
- **GitHub skill import**: pull skills from your public GitHub repositories.
- **Verified skill badges**: get skills verified to boost credibility with recruiters.
- **One-click applications** with a full status and interview timeline.
- **Insights & feedback**: personal analytics plus a feedback portal for completed internships.

### For companies
- **Post internships** with required skills, skill weights, minimum CGPA, department and deadline.
- **Reusable templates**: save, duplicate and re-post internships quickly.
- **Auto-shortlisting**: rank applicants by match score automatically.
- **Interview management**: schedule interviews, update statuses and download reports.
- **Company insights**: analytics on postings and applicants.

### For university & system admins
- Approve or reject company accounts and moderate users.
- Activity logs, system settings and recommendation-weight tuning.
- Interview reports across the platform.

### Platform
- Public landing page with live internship listings, search and department filters
- **Sign in with Google** or email/password (JWT authentication)
- Role-based access: `student`, `company`, `university_admin`, `system_admin`
- In-app notifications and optional email notifications (Gmail)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT, bcrypt, Google Identity Services |
| Integrations | Affinda (CV parsing), GitHub API, Nodemailer (Gmail) |
| Hosting | Netlify (static frontend + Express API as a Netlify Function) |

---

## 🏗 How it's deployed

```
Browser ──► intellimatch-886.netlify.app
              ├── /*      → React app (static files on Netlify CDN)
              └── /api/*  → Netlify Function (Express app) ──► MongoDB Atlas
```

- The frontend and API share one domain, so no CORS setup is needed.
- `backend/app.js` holds the Express app. It is used both by `backend/server.js` (local development) and `backend/functions/api.js` (Netlify serverless).
- Build and routing settings live in [`netlify.toml`](netlify.toml).

---

## 🚀 Run it locally

**Requirements:** Node.js 20+ and MongoDB (local or Atlas).

```bash
git clone -b develop https://github.com/Ahnafhere/intelliMatch.git
cd intelliMatch
```

**1. Backend**

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/intellimatch
JWT_SECRET=any-long-random-string

# Optional features
GOOGLE_CLIENT_ID=            # Google sign-in
AFFINDA_API_KEY=             # CV parsing
AFFINDA_WORKSPACE_ID=
GITHUB_API_TOKEN=            # GitHub skill import
GMAIL_USER=                  # Email notifications
GMAIL_APP_PASSWORD=
GMAIL_FROM_NAME=IntelliMatch
```

```bash
npm run dev        # API on http://localhost:5000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev        # App on http://localhost:5173
```

Vite proxies `/api` requests to the backend automatically.

---

## ☁️ Deploying your own copy (free)

1. Create a free **MongoDB Atlas** M0 cluster. Under Network Access allow `0.0.0.0/0`, then copy the connection string.
2. Install the Netlify CLI and log in:
   ```bash
   npm install -g netlify-cli
   netlify login
   ```
3. From the project root:
   ```bash
   netlify sites:create
   netlify env:set MONGO_URI "<your-atlas-connection-string>"
   netlify env:set JWT_SECRET "<long-random-string>"
   netlify deploy --prod --build
   ```
4. *(Optional)* For Google sign-in, create an OAuth **Web client** in Google Cloud Console. Add your site URL as an authorized JavaScript origin and set `GOOGLE_CLIENT_ID` on Netlify.

---

## 📁 Project structure

```
intelliMatch/
├── netlify.toml              # Netlify build, functions and redirects
├── backend/
│   ├── app.js                # Express app (routes, middleware, DB connection)
│   ├── server.js             # Local server entry
│   ├── functions/api.js      # Netlify Function entry
│   ├── controllers/          # Request handlers
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes (/api/auth, /api/internship, ...)
│   ├── middleware/           # Auth (JWT + roles), logging
│   └── utils/                # Matching engine, CV upload, email, GitHub, reports
└── frontend/
    └── src/
        ├── pages/            # Landing page, dashboards, search, interviews, ...
        ├── components/       # Sidebar, auth modal, Google sign-in button
        ├── context/          # Auth context
        └── styles/
```

---

## 🔌 Main API endpoints

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/auth/register`, `/api/auth/login` | Public |
| `POST` | `/api/auth/google` | Public (Google ID token) |
| `GET` | `/api/internship/public` | Public |
| `GET` | `/api/internship/search` | Logged in (students get match scores) |
| `POST` | `/api/internship` | Company |
| `POST` | `/api/application` | Student |
| `POST` | `/api/student/upload-cv` | Student |
| `GET` | `/api/analytics/...`, `/api/admin/...` | Role-based |

More detail: [FEATURE_DOCUMENTATION.md](FEATURE_DOCUMENTATION.md), [AI_Skill_Matching_Engine_Guide.md](AI_Skill_Matching_Engine_Guide.md), [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md).
