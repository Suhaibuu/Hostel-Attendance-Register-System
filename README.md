# HostelTrack
Hostel Attendance & Mess Bill Management System

## Stack
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Auth:** JWT + bcrypt
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** MongoDB Atlas

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET
node seed.js              # seed demo users and students
npm run dev               # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:5000
npm run dev               # starts on http://localhost:5173
```

---

## Default Logins

| Role   | Email                  | Password   | Access |
|--------|------------------------|------------|--------|
| Admin  | admin@hostel.com       | admin123   | Full dashboard — students, reports, bills |
| Warden | warden@hostel.com      | warden123  | Room-by-room attendance marking |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/students` | ✅ | List students |
| POST | `/api/students` | Admin | Create student |
| PUT | `/api/students/:id` | Admin | Update student |
| DELETE | `/api/students/:id` | Admin | Soft-delete |
| GET | `/api/students/rooms` | ✅ | Unique room list |
| POST | `/api/attendance/mark` | ✅ | Bulk mark attendance |
| GET | `/api/attendance/today/:roomNo` | ✅ | Today's room attendance |
| GET | `/api/attendance/report?month=` | Admin | Monthly mess bill report |

---

## Deploy

### Backend → Render.com
1. Push repo to GitHub
2. New Web Service → connect repo
3. Root dir: `backend`, Build: `npm install`, Start: `node server.js`
4. Set env vars in Render dashboard: `MONGO_URI`, `JWT_SECRET`

### Frontend → Vercel
1. Import GitHub repo on Vercel
2. Root dir: `frontend`
3. Set env var: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy

---

## Project Structure
```
HostelTrack/
├── backend/
│   ├── models/          # User, Student, Attendance
│   ├── routes/          # auth, students, attendance
│   ├── middleware/       # JWT protect
│   ├── seed.js          # Demo data seeder
│   └── server.js        # Express app
├── frontend/
│   └── src/
│       ├── api/         # Axios + endpoint helpers
│       ├── context/     # AuthContext
│       ├── components/  # ui/ + layout/ + admin/
│       └── pages/       # LoginPage, WardenPage, AdminPage
└── render.yaml          # Render deploy config
```
