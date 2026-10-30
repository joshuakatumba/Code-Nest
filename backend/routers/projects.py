from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Project, User
from schemas import ProjectResponse
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.id.asc())
        .all()
    )
