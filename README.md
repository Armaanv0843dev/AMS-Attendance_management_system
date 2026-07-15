# Attendance Management System (AMS)

A full-stack **Attendance Management System** with AI-powered attendance prediction.
Built with React + Vite (frontend), Python Flask (backend), Supabase (database + auth), Pandas (analytics), Scikit-learn (ML), and ReportLab/OpenPyXL (reports).

---

## 🗂️ Project Structure

```
AMS/
├── frontend/          ← React + Vite app
│   ├── src/
│   │   ├── components/   (Sidebar, Navbar, StatCard, Charts, Toast, Loader...)
│   │   ├── pages/        (Login, Register, Dashboard, Students, Attendance...)
│   │   ├── services/     (supabase.js, api.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css     (dark design system)
│   └── .env.example
│
└── backend/           ← Python Flask API
    ├── app.py
    ├── config.py
    ├── requirements.txt
    ├── .env.example
    ├── routes/        (students, attendance, analytics, prediction, reports)
    ├── services/      (analytics.py, pdf.py, excel.py)
    └── ml/            (train_model.py, predict.py, attendance_model.pkl*)
```

---

## ⚙️ Setup

### Step 1 — Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **SQL Editor**, run:

```sql
create table students (
  id uuid primary key default gen_random_uuid(),
  roll_no text not null unique,
  name text not null,
  email text,
  course text,
  semester text,
  created_at timestamptz default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  date date not null,
  status text check (status in ('Present','Absent','Late')) not null,
  unique (student_id, date)
);
```

3. Go to **Project Settings → API** and copy:
   - Project URL
   - Anon Key (public)
   - Service Role Key (secret — backend only)

---

### Step 2 — Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy .env.example .env
# Edit .env and fill in SUPABASE_URL and SUPABASE_SERVICE_KEY

# Run the Flask server
python app.py
# Runs on http://localhost:5000
```

---

### Step 3 — Frontend

```bash
cd frontend

# Create .env from template
copy .env.example .env
# Edit .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start the dev server
npm run dev
# Runs on http://localhost:5173
```

---

## 🌐 Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password sign-in |
| Register | `/register` | New account creation |
| Dashboard | `/dashboard` | KPI cards + quick actions |
| Students | `/students` | Add/edit/delete students |
| Attendance | `/attendance` | Mark daily attendance |
| Analytics | `/analytics` | Charts + stats table |
| AI Prediction | `/prediction` | ML-powered forecasting |
| Reports | `/reports` | Download PDF + Excel |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students/` | List all students |
| POST | `/students/` | Add a student |
| PUT | `/students/<id>` | Update a student |
| DELETE | `/students/<id>` | Delete a student |
| GET | `/attendance/?date=YYYY-MM-DD` | Get attendance |
| POST | `/attendance/` | Save/update attendance (upsert) |
| GET | `/analytics/` | Pandas analytics |
| GET | `/prediction/` | ML predictions |
| GET | `/report/pdf` | Download PDF report |
| GET | `/report/excel` | Download Excel report |

---

## 🤖 Machine Learning

- **Algorithm**: Random Forest Regressor (`scikit-learn`)
- **Features**: `present_count`, `absent_count`, `late_count`, `current_attendance_%`
- **Target**: Predicted future attendance `%`
- **Auto-training**: Model trains automatically on the first `/prediction` call using synthetic data augmented with real attendance patterns.
- **Model file**: Saved to `backend/ml/attendance_model.pkl`

---

## 🎨 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router v6, CSS |
| Charts | Chart.js + react-chartjs-2 |
| HTTP Client | Axios |
| Auth + DB | Supabase (PostgreSQL + Auth) |
| Backend | Python Flask |
| Analytics | Pandas, NumPy |
| ML | Scikit-learn, Joblib |
| PDF Report | ReportLab |
| Excel Report | OpenPyXL |
