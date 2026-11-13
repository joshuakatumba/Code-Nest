from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Project, Course, User
from schemas import ProjectResponse, ProjectCreateRequest
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Project]:
    query = db.query(Project).filter(Project.user_id == current_user.id)
    if course_id is not None:
        query = query.filter(Project.course_id == course_id)
    return query.order_by(Project.id.asc()).all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Project:
    clean_title = payload.title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project title is required",
        )
    target_course_id = payload.course_id
    if target_course_id is None:
        default_course = db.query(Course).order_by(Course.level.asc()).first()
        target_course_id = default_course.id if default_course else 1
    else:
        target_course = db.query(Course).filter(Course.id == target_course_id).first()
        if target_course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

    new_project = Project(
        user_id=current_user.id,
        course_id=target_course_id,
        title=clean_title,
        description=payload.description.strip() or "Student coding project built in CodeNest.",
        preview_key=payload.preview_key or "momo",
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project
