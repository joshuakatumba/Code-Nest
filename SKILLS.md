# SKILLS.md — CodeNest MVP

Reusable procedures for the agents in `AGENTS.md`. Use the matching skill instead of improvising. Run every skill inside the task loop (Plan → Build → Run → Check → Fix → Commit, max 3 fixes).

---

### Skill: Add an API endpoint
1. Add/adjust the Pydantic schema in `schemas.py`.
2. Add the route in the matching file under `routers/`.
3. Use `Depends(get_db)` and `Depends(get_current_user)` where needed.
4. Test it in `/docs`, then add a pytest case.
5. Add the call to `frontend/src/api.js`.

### Skill: Port a prototype section to React
1. Find the section in `index.html` (screens are `#screen-pricing`, `#screen-detail`, `#screen-courses`, `#screen-progress`).
2. Create a component named after the visual block (e.g. `CbcCompetencyCard`).
3. Move its CSS into `styles/` (keep class names). Replace hardcoded values with props.
4. Replace `onclick="switchScreen(...)"` with `<Link>` / `useNavigate()`.
5. Fetch data in the page component, pass down as props.

### Skill: Add a seed record
Edit `seed.py` only. Use `get_or_create` helpers so re-running never duplicates.

### Skill: Mock a feature safely
For anything in the OUT list: build the UI, return a realistic fake response from the API, add a `# TODO(real-impl)` comment, and keep the interface identical to what the real version would need.

### Skill: Auth-protect a page
Backend: add `current_user = Depends(get_current_user)`. Frontend: wrap the route in `<ProtectedRoute>` which redirects to `/login` if no token.

### Skill: Handle errors
Backend raises `HTTPException(status_code, detail)`. Frontend `api.js` throws with `detail`; pages show it in a small inline message (no alert popups).
