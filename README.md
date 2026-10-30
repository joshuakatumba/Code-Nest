# CodeNest MVP

Online coding school for students in Uganda (Scratch -> Python -> Local Problem Solving).

## Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2, Pydantic v2, SQLite (`backend/codenest.db`), JWT (`passlib[bcrypt]`, `python-jose`)
- **Frontend:** React 18 + Vite, React Router, plain CSS ported from `index.html`

## Run Instructions

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload        # http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

## Running Automated Tests

```bash
cd backend
source .venv/bin/activate
pytest -v
```

## Demo Credentials

- **Email:** `katumba@codenest.ug`
- **Password:** `password123`

## Manual QA Checklist

- [x] Visit `/courses` and filter courses by Level 1, Level 2, Level 3, and See all
- [x] Click a course or track card to open `/courses/:id` and verify curriculum modules, computed review ratings ("Top Rating", "1 Star"), and USD pricing
- [x] Visit `/pricing` and verify Free, Individual, and Corporate plans load from the database
- [x] Sign up a new student account at `/signup` (or log in at `/login`) and verify navbar updates to show student avatar, name, and Logout button
- [x] Enroll in a course via "Buy Now" on `/courses/:id` and verify redirect to `/progress`
- [x] On `/progress`, mark an uncompleted lesson complete and verify the Course Contents counter, segmented progress bar, and CBC Competency bars increment
- [x] On `/progress`, select a Practice Quiz, pick answers, click "Submit Answer", and verify the server-graded score is displayed
- [x] Verify out-of-scope controls (live video classroom buttons, "Run Project") are disabled with a "Coming soon" tooltip and the worksheet button opens `/sample-worksheet.pdf`
