# AGENTS.md — CodeNest MVP

Instructions for AI coding agents building **CodeNest**, an online coding school for students in Uganda (Scratch → Python → local problem solving). The attached `index.html` prototype is the only source of truth for the frontend design. Copy its layout, colors, fonts, spacing, class names and wording exactly. Do not redesign, restyle or add new UI.

**Golden rule: MVP only. Smallest thing that works. No microservices, no Docker orchestration, no real payments, no real video.**

---

See `SKILLS.md` for reusable procedures. Follow them when a task matches.

---

## 1. Stack

| Layer     | Choice                                              |
|-----------|-----------------------------------------------------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2, Pydantic v2    |
| Database  | SQLite (file: `backend/codenest.db`)                |
| Auth      | JWT (email + password, `passlib[bcrypt]`, `python-jose`) |
| Frontend  | React 18 + Vite, React Router, plain CSS (ported from prototype) |
| HTTP      | `fetch` wrapper in `frontend/src/api.js` (no Redux, no axios) |
| Icons     | Font Awesome via CDN (same as prototype) or `react-icons` |
| Fonts     | Poppins + Inter (Google Fonts)                      |

Do not add: TypeScript, Tailwind, Redux, GraphQL, Celery, Redis, Postgres, Kubernetes. Add later if needed.

---

## 2. Repo Layout

```
codenest/
├── AGENTS.md
├── backend/
│   ├── main.py            # FastAPI app, CORS, router includes
│   ├── database.py        # engine, SessionLocal, Base
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── auth.py            # hashing, JWT, get_current_user
│   ├── seed.py            # seeds courses, tracks, plans, quiz, lessons
│   ├── routers/
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── plans.py
│   │   ├── progress.py
│   │   ├── quizzes.py
│   │   └── projects.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx            # routes
        ├── api.js
        ├── AuthContext.jsx
        ├── styles/            # variables.css (from :root), global.css
        ├── components/        # Navbar, Footer, ProgressBar, CourseCard, ...
        └── pages/             # Pricing, CourseDetail, Courses, Progress
```

---

## 3. Screens → Routes

| Prototype screen   | Route               | Auth needed |
|--------------------|---------------------|-------------|
| 3. Explore Courses | `/` and `/courses`  | No          |
| 2. Course Detail   | `/courses/:id`      | No          |
| 1. Pricing         | `/pricing`          | No          |
| 4. Progress        | `/progress`         | Yes         |
| Login / Sign up    | `/login`, `/signup` | No          |

- Remove the floating "screen switcher" pill. It was a preview tool only.
- Navbar: logged out → Login / Sign Up buttons; logged in → avatar + name + Logout. Nav links: Home, Courses, Pricing, Progress.
- Footer is shared (newsletter form can just POST to `/api/newsletter` and store the email).

### Design tokens (copy from prototype `:root`)
`--primary #49BBBD`, `--primary-dark #3aa3a5`, `--navy #252641`, `--text-muted #696984`, `--border-color #E2E8F0`, radii 14/22px. Keep the soft-blue section bands (`#F2F8FF`, `#EAF4FF`), pill buttons, and rounded cards.

---

## 4. Data Model (SQLAlchemy)

```
User            id, name, email (unique), password_hash, plan_id (nullable), created_at
Plan            id, name (Free|Individual|Corporate), price_usd, period, features (JSON list)
Course          id, title, level (1|2|3), tech, description, age_range, grade_range,
                builds, skills, duration, price_usd, old_price_usd,
                banner_key, rating_avg
Track           (merge into Course for MVP — Courses ARE the three tracks)
Module          id, course_id, title, duration_label, order
Lesson          id, module_id, title, duration_label, order, video_url (nullable), is_locked_default
Enrollment      id, user_id, course_id, created_at, status ("active")
LessonProgress  id, user_id, lesson_id, completed (bool)
Competency      id, user_id, name, percent        # CBC: Logical Thinking, Syntax Mastery, Problem Solving
Project         id, user_id, course_id, title, description, preview_key
Quiz            id, lesson_id, title
Question        id, quiz_id, prompt, options (JSON), correct_index
QuizAttempt     id, user_id, quiz_id, score, created_at
Review          id, course_id, user_id, stars (1–5)
Newsletter      id, email
```

Keep it flat. If a table is not used by a screen above, don't create it.

---

## 5. API (all under `/api`)

```
POST /auth/signup            {name,email,password} → {token,user}
POST /auth/login             {email,password}      → {token,user}
GET  /auth/me                → user

GET  /plans                  → list of plans
POST /plans/subscribe        {plan_id}  (auth) → mock: just sets user.plan_id

GET  /courses?level=1        → list (supports level filter)
GET  /courses/{id}           → course + modules + lessons + rating breakdown
POST /courses/{id}/enroll    (auth) → mock checkout: creates Enrollment
GET  /courses/{id}/reviews/summary → {avg, counts:{5:..,4:..,...}}

GET  /progress               (auth) → {competencies, enrollments, completed/total, projects}
POST /lessons/{id}/complete  (auth) → marks LessonProgress, bumps competency

GET  /quizzes/{id}           → questions (WITHOUT correct_index)
POST /quizzes/{id}/submit    (auth) {answers:[int]} → {score,total,results}

GET  /projects               (auth) → user's projects
POST /newsletter             {email}
```

Rules: validate with Pydantic, return proper HTTP codes, enable CORS for `http://localhost:5173`. Passwords hashed, never returned.

---

## 6. Explicit MVP Scope

**IN**
- Signup/login, browse courses, course detail, mock "Buy Now"/"Enroll" (no payment provider)
- Progress dashboard: competency bars, project gallery, course contents accordion, mark lesson complete
- Practice quiz that actually grades answers on the server
- Pricing page reading plans from the API
- Seed data so the app looks full on first run

**OUT (render as static/disabled with a "Coming soon" tooltip)**
- Real payments (Stripe/MTN MoMo/Airtel) — stub the endpoint, design it so a provider can be swapped in
- Live video classroom — keep the visual layout, controls are non-functional; add a `meeting_url` link-out later
- Corporate team management, PDF generation (link to a static sample PDF), "Run Project" execution

---

## 7. Prototype Content Fixes (do these while porting)

The prototype has placeholder content that doesn't match the product. Fix in seed data:

1. **Course contents** show "Illstarator Structures", "What is Pandas?", "Work with Numpy" → replace with real Python curriculum (Get Started, Syntax, Variables, Functions, Conditions, Project).
2. **Quiz** asks "Red Planet" → replace with coding questions (e.g. Python `print`, variables, loops).
3. **Rating panel**: all bars are hardcoded to 78% and says "Top Raiting" → compute from reviews, fix typo to "Top Rating".
4. **Currency is USD everywhere.** Change the track price "UGX 150,000" to USD (e.g. $40) and store only `price_usd`. No UGX fields.
5. Typos: "32 Moduls" → "32 Modules", "1 Stars" → "1 Star".
6. Replace the lorem-style "Training 5 or more people" copy with real copy.
7. Course Detail currently has one hard-coded Python page → make it data-driven for every course.
8. Replace external Unsplash images with local `/public/images` placeholders so the app works offline.
9. Footer says "© 2026 CodeNest Kampala." — keep.

Seed the three tracks exactly as in the prototype (Scratch, Python/Thonny, Advanced Python/Tkinter/CSV) including Ugandan examples (Boda-Boda Traffic Maze, Mobile Money Fee Estimator, School Canteen Tracker, District Geography Quiz) and a USD price for every track.

---

## 8. Agents

Each agent owns a folder. Agents work in order; hand off via the contract in Section 5.

### Architect Agent
- **Owns:** repo layout, `requirements.txt`, `package.json`, README run instructions
- **Does:** scaffolds both apps, confirms `uvicorn main:app --reload` and `npm run dev` start, sets up CORS and env files
- **Done when:** both servers run and `/docs` (Swagger) loads

### Backend Agent
- **Owns:** `backend/`
- **Does:** models, schemas, routers, auth, seed script
- **Rules:** one router file per resource; no business logic in `main.py`; seed is idempotent (`python seed.py` can be re-run)
- **Done when:** every endpoint in Section 5 works in Swagger and `pytest` smoke tests pass (signup → login → enroll → complete lesson → submit quiz)

### Frontend Agent
- **Owns:** `frontend/`
- **Does:** ports the HTML/CSS into components and pages, wires API calls, auth context, protected route for `/progress`
- **Rules:** reuse CSS class names from the prototype where possible; one component per visual block; loading + error states on every fetch; no inline style blocks except dynamic values (bar widths)
- **Done when:** all 4 screens match the prototype at desktop width and don't break at mobile (≤992px, per prototype breakpoint)

### Integration Agent
- **Owns:** `frontend/src/api.js`, env wiring, end-to-end flow
- **Does:** verifies the full journey: visit `/courses` → open a course → sign up → enroll → land on `/progress` → complete a lesson → bar updates → take quiz → score shown
- **Done when:** that journey works with a fresh database and no console errors

### QA Agent
- **Owns:** `backend/tests/`, a short manual test checklist in README
- **Does:** tests auth failures (bad password, duplicate email, missing token), quiz grading, enrollment duplicates
- **Done when:** tests green and checklist passes

---

## 9. Engineering Loops (how agents work)

Every agent runs the same loop on every task. Do not skip steps.

```
PLAN → BUILD → RUN → CHECK → FIX → (repeat) → COMMIT
```

1. **Plan:** state the one small task and its "done when" check.
2. **Build:** write the minimum code.
3. **Run:** start the server / test / page.
4. **Check:** compare against the check (Swagger response, pytest, screen vs prototype).
5. **Fix:** change only what failed. Max **3 fix attempts**, then stop and report the blocker.
6. **Commit:** one small commit, then the next task.

### Loop levels
| Loop | Trigger | Check |
|------|---------|-------|
| Task loop | each endpoint / component | pytest or Swagger / visual match |
| Feature loop | each build-order step | feature works end to end |
| Review loop | end of each step | Integration + QA agents run the journey; failures go back to the owning agent |
| Release loop | before "done" | Definition of Done checklist (Section 13) |

### Loop rules
- One task at a time. No parallel half-finished work.
- Never move on with a failing test.
- Same error twice = change approach, don't retry the same fix.
- Keep a `PROGRESS.md` log: task, result, next step.

---

## 10. Build Order (follow strictly)

1. **Architect:** scaffold, both servers running.
2. **Backend:** models → seed → courses/plans endpoints (public data first).
3. **Frontend:** Navbar, Footer, Explore Courses, Course Detail, Pricing (all read-only, working against real API).
4. **Backend + Frontend:** auth (signup/login) and navbar states.
5. **Backend + Frontend:** enroll + Progress page (competencies, contents, lesson complete).
6. **Backend + Frontend:** quizzes and projects.
7. **QA + Integration:** tests, end-to-end pass, README.

Do not start a step until the previous one works.

---

## 11. Conventions

- Code style rules (strict):
  - No nested loops. Avoid a loop inside a loop. Use dictionaries/sets for lookups, SQL joins or `GROUP BY` for combining data, and `.map`/`.filter` once per list on the frontend.
  - Fetch data in one query, not one query per item (no queries inside loops).
  - Simple, readable variable names: `user`, `course`, `lesson`, `score`, `total_lessons`, `completed_count`. No single letters (except `i` in a basic counter), no abbreviations, no clever tricks.
  - Short functions that do one thing.
- No emojis anywhere: not in code, comments, UI text, commit messages or docs.
- Frontend design comes only from `index.html`. If something is not in the prototype, ask instead of inventing it.
- Python: type hints, `snake_case`, f-strings, no global state besides the DB session.
- React: function components + hooks only, `PascalCase` files for components, one `useState`/`useEffect` per concern.
- Config via `.env` (`DATABASE_URL`, `SECRET_KEY`, `VITE_API_URL`). Never commit secrets.
- Commit small and often: `feat:`, `fix:`, `chore:`.
- Accessibility basics: real `<button>`/`<a>` elements, alt text on images, labels on inputs.
- If unsure, choose the simpler option and leave a `# NOTE:` comment.

---

## 12. Run Instructions (put in README)

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

## 13. Definition of Done (MVP)

- [ ] A new user can sign up, browse, enroll in a course, and see it on their Progress page
- [ ] Marking a lesson complete updates the contents bar and competency percent
- [ ] Quiz is graded on the server and shows a score
- [ ] Pricing, Explore Courses, and Course Detail are driven by the database
- [ ] All 4 screens visually match the prototype
- [ ] Fresh clone runs with the commands in Section 12
