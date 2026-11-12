import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database import Base, engine, ensure_schema_columns
from routers import auth, courses, plans, progress, quizzes, projects

Base.metadata.create_all(bind=engine)
ensure_schema_columns()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")
os.makedirs(os.path.join(UPLOAD_ROOT, "videos"), exist_ok=True)

app = FastAPI(title="CodeNest API", version="1.0.0")

extra_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8002",
        "http://127.0.0.1:8002",
        *extra_origins,
    ],
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(courses.router)
app.include_router(progress.router)
app.include_router(quizzes.router)
app.include_router(projects.router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


FRONTEND_DIST = os.path.join(BASE_DIR, "static_dist")
if not os.path.isdir(FRONTEND_DIST):
    fallback_dist = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
    if os.path.isdir(fallback_dist):
        FRONTEND_DIST = fallback_dist

if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    images_dir = os.path.join(FRONTEND_DIST, "images")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    if os.path.isdir(images_dir):
        app.mount("/images", StaticFiles(directory=images_dir), name="images")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str) -> FileResponse:
        requested_path = os.path.normpath(os.path.join(FRONTEND_DIST, full_path))
        if (
            full_path
            and requested_path.startswith(FRONTEND_DIST)
            and os.path.isfile(requested_path)
        ):
            return FileResponse(requested_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
