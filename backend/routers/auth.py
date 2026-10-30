from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Course, Competency, Project, Newsletter
from schemas import (
    SignupRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    NewsletterRequest,
    NewsletterResponse,
)
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api", tags=["auth"])


def initialize_student_records(db: Session, user_id: int) -> None:
    default_comps = [
        ("Logical Thinking", 60),
        ("Python Syntax Mastery", 45),
        ("Problem Solving", 65),
    ]
    for name_val, percent_val in default_comps:
        db.add(Competency(user_id=user_id, name=name_val, percent=percent_val))

    default_course = db.query(Course).order_by(Course.level.asc()).first()
    course_id_val = default_course.id if default_course else 1
    db.add(
        Project(
            user_id=user_id,
            course_id=course_id_val,
            title="Mobile Money Fee Calculator",
            description="CLI tool estimating MTN MoMo and Airtel Money withdrawal fees in Uganda.",
            preview_key="momo",
        )
    )
    db.add(
        Project(
            user_id=user_id,
            course_id=course_id_val,
            title="District Quiz Game",
            description="Interactive Ugandan district geography quiz covering Kampala, Wakiso, and Jinja.",
            preview_key="district",
        )
    )


@router.post("/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required",
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    user = User(
        name=clean_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    initialize_student_records(db, user.id)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/newsletter", response_model=NewsletterResponse, status_code=status.HTTP_201_CREATED)
def subscribe_newsletter(
    payload: NewsletterRequest,
    db: Session = Depends(get_db),
) -> Newsletter:
    email_clean = payload.email.lower()
    existing = db.query(Newsletter).filter(Newsletter.email == email_clean).first()
    if existing is not None:
        return existing
    entry = Newsletter(email=email_clean)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
