from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth, courses, plans, progress, quizzes, projects

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeNest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8002",
        "http://127.0.0.1:8002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(courses.router)
app.include_router(progress.router)
app.include_router(quizzes.router)
app.include_router(projects.router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
