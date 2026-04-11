# AfyaNexus — Centralized Athlete Training & Nutrition Tracking System

![AfyaNexus](images/landingpagehero_section.png)

> **Capstone Project · Version 1.0**  
> A centralized platform for athletes, coaches, and nutritionists — powered by machine learning injury risk prediction.

---

## Overview

AfyaNexus is a full-stack athlete management system that centralizes training logs, recovery data, nutrition tracking, and wearable device data into one platform. It uses a rule-based ML engine to generate injury risk scores (0–100) after every training or recovery log submission.

### Three Role-Based Portals

| Role | Capabilities |
|---|---|
| **Athlete** | Log training, recovery, nutrition · Sync T70 wearable · View injury risk score · Reports |
| **Coach** | Monitor all assigned athletes · Injury risk alerts · Performance trends |
| **Nutritionist** | View athlete nutrition logs · Create and manage diet plans |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Supabase |
| ML Service | Python, Flask |
| Auth | JWT + bcrypt |
| Storage | Supabase Storage (profile photos) |
| Email | Nodemailer + Gmail SMTP |

---

## Features

- ✅ Role-based authentication (Athlete / Coach / Nutritionist)
- ✅ JWT-secured API endpoints
- ✅ ML injury risk prediction (rule-based, scikit-learn ready)
- ✅ T70 smartwatch wearable sync
- ✅ Nutrition logging with macro tracking
- ✅ Diet plan creation and management
- ✅ 30-day performance reports with charts
- ✅ Forgot password via email (Gmail SMTP)
- ✅ Profile photo upload (Supabase Storage)
- ✅ Responsive UI with dark glass auth pages
- ✅ Animated landing page with parallax hero

---

## Project Structure

```
AfyaNexus_System/
├── client/                  # Next.js frontend
│   ├── app/
│   │   ├── (auth)/          # Login, Register, Forgot/Reset Password
│   │   ├── dashboard/
│   │   │   ├── athlete/     # Athlete portal pages
│   │   │   ├── coach/       # Coach portal pages
│   │   │   └── nutritionist/# Nutritionist portal pages
│   ├── components/          # Sidebar, TopBar, SettingsForm, StatCard, InjuryRiskGauge
│   ├── context/             # AuthContext
│   └── lib/                 # Axios API instance
├── server/                  # Express backend
│   └── src/
│       ├── controllers/     # Auth, Athlete, Coach, Nutritionist, Wearable
│       ├── middleware/       # JWT authentication
│       └── routes/          # API route definitions
├── ml/                      # Flask ML service
│   └── app.py               # Rule-based injury risk engine
├── docs/                    # System documentation (9 documents)
├── images/                  # UI reference images
└── start-afyanexus.bat      # One-click launcher (Windows)
```

---

## Getting Started

### Prerequisites

- Node.js v20 LTS
- Python 3.x
- Supabase account (free tier)
- Gmail account with App Password enabled

### 1. Clone the repository

```bash
git clone https://github.com/DerrickOmwanza/AfyaNexus_Athlete.git
cd AfyaNexus_Athlete
```

### 2. Set up the database

Run the SQL in `docs/04_System_Design.html` Section 3 in your Supabase SQL Editor to create all 9 tables plus the `password_reset_tokens` table.

Also run:
```sql
ALTER TABLE athletes      ADD COLUMN avatar_url TEXT;
ALTER TABLE coaches       ADD COLUMN avatar_url TEXT;
ALTER TABLE nutritionists ADD COLUMN avatar_url TEXT;

CREATE TABLE password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  role       VARCHAR(20)  NOT NULL,
  token      VARCHAR(64)  UNIQUE NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used       BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT NOW()
);
```

### 3. Configure environment variables

**`server/.env`**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
ML_SERVICE_URL=http://localhost:5001
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
CLIENT_URL=http://localhost:4000
```

**`client/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start all services

**Option A — One click (Windows):**
```
Double-click start-afyanexus.bat
```

**Option B — Manual (3 terminals):**

```bash
# Terminal 1 — Backend
cd server && npm install && npm run dev

# Terminal 2 — Frontend
cd client && npm install
node node_modules/next/dist/bin/next dev --port 4000

# Terminal 3 — ML Service
cd ml && pip install -r requirements.txt && python app.py
```

### 5. Open the app

```
http://localhost:4000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/athlete/dashboard` | Athlete dashboard data |
| POST | `/api/athlete/recovery-log` | Submit morning check-in |
| POST | `/api/athlete/training-log` | Submit training session |
| POST | `/api/athlete/nutrition-log` | Submit nutrition entry |
| GET | `/api/athlete/reports` | 30-day performance reports |
| GET | `/api/coach/athletes` | Coach's athlete list |
| GET | `/api/nutritionist/diet-plans` | All diet plans |
| POST | `/api/nutritionist/diet-plan` | Create diet plan |

---

## ML Service

The injury risk engine (`ml/app.py`) scores risk 0–100 based on:

- Sleep hours
- Soreness level (1–10)
- Mood
- Numbness flag
- Training intensity (1–10)
- Session duration
- Heart rate average (from wearable)

**Risk levels:** Low (< 35) · Medium (< 65) · High (≥ 65)

The engine is designed to be replaced with a trained scikit-learn model.

---

## Documentation

All system documentation is in the `docs/` folder:

| Document | Description |
|---|---|
| 01_System_Proposal | Project proposal and scope |
| 02_Concept_Paper | Problem statement and solution |
| 03_System_Architecture | 5-layer architecture design |
| 04_System_Design | FR/NFR, DB schema, API endpoints |
| 05_Wireframe_Sitemap | UI wireframes and sitemap |
| 06_Testing_Evaluation_Plan | 25 test cases (all passed) |
| 07_Wearable_Integration_Notes | T70 smartwatch integration |
| 08_Progress_Stage_Report | Implementation progress report |
| 09_Presentation_Content_Pack | Presentation slides content |

---

## Test Results

All 25 system tests passed:

- UT-01 to UT-13 — Unit tests (registration, auth, logs, settings)
- IT-01 to IT-09 — Integration tests (data flow, RBAC)
- ST-01 to ST-05 — System tests (end-to-end, security, performance)

---

## Author

**Derrick Omwanza**  
Capstone Project · AfyaNexus v1.0 · 2026

---

*AfyaNexus — Afya (Kiswahili: Health) + Nexus (English: Central Connection Point)*
