import json
import os
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import Course, Module, Lesson, Review, Enrollment, Project, User
from schemas import (
    CourseResponse,
    CourseCreateRequest,
    CourseDetailResponse,
    ModuleResponse,
    ModuleCreateRequest,
    LessonResponse,
    LessonCreateRequest,
    ReviewCreateRequest,
    ReviewSummaryResponse,
    AccessCodeEnrollRequest,
    EnrollmentResponse,
)
from auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["courses"])

VIDEOS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "uploads",
    "videos",
)


def sanitize_video_filename(original_name: str, prefix: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", original_name or "video.mp4")
    if not cleaned.lower().endswith((".mp4", ".webm", ".ogg", ".mov")):
        cleaned = f"{cleaned}.mp4"
    unique_tag = uuid.uuid4().hex[:8]
    return f"{prefix}_{unique_tag}_{cleaned}"


def extract_multipart_payload(raw_body: bytes, content_type: str) -> tuple[bytes, str]:
    boundary_match = re.search(r"boundary=([^;]+)", content_type)
    if not boundary_match:
        return raw_body, "uploaded.mp4"
    boundary_bytes = f"--{boundary_match.group(1).strip()}".encode("utf-8")
    parts = raw_body.split(boundary_bytes)
    for part in parts:
        header_end = part.find(b"\r\n\r\n")
        if header_end == -1:
            continue
        header_block = part[:header_end].decode("utf-8", errors="ignore")
        if "filename=" not in header_block:
            continue
        name_match = re.search(r'filename="([^"]+)"', header_block)
        filename = name_match.group(1) if name_match else "uploaded.mp4"
        file_bytes = part[header_end + 4 :]
        if file_bytes.endswith(b"\r\n"):
            file_bytes = file_bytes[:-2]
        return file_bytes, filename
    return raw_body, "uploaded.mp4"


async def save_uploaded_video_from_request(request: Request, prefix: str) -> str:
    os.makedirs(VIDEOS_DIR, exist_ok=True)
    content_type = request.headers.get("content-type", "").lower()
    raw_body = await request.body()
    if not raw_body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty video payload",
        )

    if "application/json" in content_type:
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload",
            ) from exc
        video_url = str(payload.get("video_url", "")).strip()
        if not video_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="video_url is required",
            )
        return video_url

    if "multipart/form-data" in content_type:
        file_bytes, original_name = extract_multipart_payload(raw_body, content_type)
    else:
        file_bytes = raw_body
        original_name = request.headers.get("x-filename", "lesson_video.mp4")

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video bytes found in upload",
        )

    safe_name = sanitize_video_filename(original_name, prefix)
    target_path = os.path.join(VIDEOS_DIR, safe_name)
    with open(target_path, "wb") as video_file:
        video_file.write(file_bytes)

    return f"/uploads/videos/{safe_name}"


def compute_review_summary(db: Session, course_id: int) -> ReviewSummaryResponse:
    rows = (
        db.query(Review.stars, func.count(Review.id))
        .filter(Review.course_id == course_id)
        .group_by(Review.stars)
        .all()
    )
    counts: dict[str, int] = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    total_reviews = 0
    weighted_sum = 0
    for stars_value, count_value in rows:
        key = str(stars_value)
        if key in counts:
            counts[key] = int(count_value)
            total_reviews += int(count_value)
            weighted_sum += int(stars_value) * int(count_value)

    average_score = round(weighted_sum / total_reviews, 1) if total_reviews > 0 else 0.0
    return ReviewSummaryResponse(avg=average_score, counts=counts, total=total_reviews)


def ensure_course_projects_for_user(db: Session, user_id: int, course: Course) -> None:
    existing = (
        db.query(Project)
        .filter(Project.user_id == user_id, Project.course_id == course.id)
        .first()
    )
    if existing is not None:
        return

    if course.level == 1:
        db.add(
            Project(
                user_id=user_id,
                course_id=course.id,
                title="Boda-Boda Traffic Maze",
                description="Interactive Scratch maze game navigating Kampala traffic with sprite collision events.",
                preview_key="scratch",
            )
        )
        db.add(
            Project(
                user_id=user_id,
                course_id=course.id,
                title="Lubiri Luwombo Catch",
                description="Arcade animation catching traditional Ugandan dishes using Scratch loops and variables.",
                preview_key="scratch",
            )
        )
    elif course.level == 3:
        db.add(
            Project(
                user_id=user_id,
                course_id=course.id,
                title="School Canteen Tracker",
                description="Tkinter desktop GUI recording daily student canteen sales into local CSV files.",
                preview_key="canteen",
            )
        )
        db.add(
            Project(
                user_id=user_id,
                course_id=course.id,
                title="District Quiz Game",
                description="Interactive Ugandan district geography quiz covering Kampala, Wakiso, and Jinja.",
                preview_key="district",
            )
        )
    else:
        db.add(
            Project(
                user_id=user_id,
                course_id=course.id,
                title="Mobile Money Fee Calculator",
                description="CLI tool estimating MTN MoMo and Airtel Money withdrawal fees in Uganda.",
                preview_key="momo",
            )
        )
        db.add(
            Project(
                user_id=user_id,
                course_id=course.id,
                title="District Quiz Game",
                description="Interactive Ugandan district geography quiz covering Kampala, Wakiso, and Jinja.",
                preview_key="district",
            )
        )


@router.get("", response_model=list[CourseResponse])
def list_courses(
    level: Optional[int] = None,
    db: Session = Depends(get_db),
) -> list[Course]:
    query = db.query(Course)
    if level is not None:
        query = query.filter(Course.level == level)
    return query.order_by(Course.level.asc(), Course.id.asc()).all()


@router.post("", response_model=CourseDetailResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseDetailResponse:
    clean_title = payload.title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course title is required",
        )
    existing = db.query(Course).filter(Course.title == clean_title).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A course with this title already exists",
        )

    default_video = payload.video_url or "/uploads/videos/python-lesson.mp4"
    course = Course(
        title=clean_title,
        level=max(1, min(3, payload.level)),
        tech=payload.tech.strip() or "Python 3",
        description=payload.description.strip() or "Hands-on coding course.",
        age_range=payload.age_range.strip() or "12-16",
        grade_range=payload.grade_range.strip() or "Senior 1-3",
        builds=payload.builds.strip() or "Practical coding projects",
        skills=payload.skills.strip() or "Algorithms, syntax, problem solving",
        duration=payload.duration.strip() or f"1 Term (12 sessions) • ${payload.price_usd}",
        price_usd=payload.price_usd,
        old_price_usd=max(payload.old_price_usd, payload.price_usd),
        banner_key=payload.banner_key,
        rating_avg=4.8,
        video_url=default_video,
    )
    db.add(course)
    db.flush()

    starter_module = Module(
        course_id=course.id,
        title="Module 1: Getting Started",
        duration_label="1 Hour",
        order=1,
    )
    db.add(starter_module)
    db.flush()

    starter_lesson = Lesson(
        module_id=starter_module.id,
        title="1. Welcome & Environment Setup",
        duration_label="25:00",
        order=1,
        video_url=default_video,
        is_locked_default=False,
    )
    db.add(starter_lesson)
    db.add(Review(course_id=course.id, user_id=current_user.id, stars=5))
    db.commit()
    db.refresh(course)

    return get_course_detail(course.id, db)


@router.post("/enroll-code", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_by_access_code(
    payload: AccessCodeEnrollRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Enrollment:
    code_clean = payload.access_code.strip().upper()
    if not code_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access code is required",
        )

    code_to_level = {
        "SCRATCH": 1,
        "SCRATCH1": 1,
        "LEVEL1": 1,
        "CN-L1": 1,
        "PYTHON": 2,
        "PYTHON2": 2,
        "LEVEL2": 2,
        "CN-L2": 2,
        "TKINTER": 3,
        "TKINTER3": 3,
        "LEVEL3": 3,
        "CN-L3": 3,
    }

    target_course = None
    if code_clean in code_to_level:
        target_course = (
            db.query(Course)
            .filter(Course.level == code_to_level[code_clean])
            .first()
        )
    elif code_clean.isdigit():
        target_course = db.query(Course).filter(Course.id == int(code_clean)).first()

    if target_course is None:
        target_course = (
            db.query(Course)
            .filter(Course.title.ilike(f"%{code_clean}%"))
            .first()
        )

    if target_course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid access code. Try SCRATCH1, PYTHON2, or TKINTER3.",
        )

    return enroll_in_course(target_course.id, current_user, db)


@router.get("/{course_id}", response_model=CourseDetailResponse)
def get_course_detail(
    course_id: int,
    db: Session = Depends(get_db),
) -> CourseDetailResponse:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    modules = (
        db.query(Module)
        .filter(Module.course_id == course.id)
        .order_by(Module.order.asc())
        .all()
    )
    module_ids = [module.id for module in modules]
    lessons = (
        db.query(Lesson)
        .filter(Lesson.module_id.in_(module_ids))
        .order_by(Lesson.order.asc())
        .all()
        if module_ids
        else []
    )

    lessons_by_module: dict[int, list[LessonResponse]] = {
        module.id: [] for module in modules
    }
    for lesson in lessons:
        lessons_by_module[lesson.module_id].append(
            LessonResponse.model_validate(lesson)
        )

    module_responses = [
        ModuleResponse(
            id=module.id,
            course_id=module.course_id,
            title=module.title,
            duration_label=module.duration_label,
            order=module.order,
            lessons=lessons_by_module.get(module.id, []),
        )
        for module in modules
    ]

    rating_breakdown = compute_review_summary(db, course.id)
    fallback_video = (
        lessons[0].video_url
        if lessons and lessons[0].video_url
        else "/uploads/videos/python-lesson.mp4"
    )

    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        level=course.level,
        tech=course.tech,
        description=course.description,
        age_range=course.age_range,
        grade_range=course.grade_range,
        builds=course.builds,
        skills=course.skills,
        duration=course.duration,
        price_usd=course.price_usd,
        old_price_usd=course.old_price_usd,
        banner_key=course.banner_key,
        rating_avg=rating_breakdown.avg if rating_breakdown.total > 0 else course.rating_avg,
        video_url=course.video_url or fallback_video,
        modules=module_responses,
        rating_breakdown=rating_breakdown,
    )


@router.post("/{course_id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def create_course_module(
    course_id: int,
    payload: ModuleCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ModuleResponse:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    existing_count = db.query(Module).filter(Module.course_id == course_id).count()
    new_module = Module(
        course_id=course_id,
        title=payload.title.strip() or f"Module {existing_count + 1}",
        duration_label=payload.duration_label.strip() or "1 Hour",
        order=existing_count + 1,
    )
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return ModuleResponse(
        id=new_module.id,
        course_id=new_module.course_id,
        title=new_module.title,
        duration_label=new_module.duration_label,
        order=new_module.order,
        lessons=[],
    )


@router.post("/{course_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_course_lesson(
    course_id: int,
    payload: LessonCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LessonResponse:
    module = (
        db.query(Module)
        .filter(Module.id == payload.module_id, Module.course_id == course_id)
        .first()
    )
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found for this course",
        )
    lesson_count = db.query(Lesson).filter(Lesson.module_id == module.id).count()
    clean_title = payload.title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson title is required",
        )
    new_lesson = Lesson(
        module_id=module.id,
        title=clean_title,
        duration_label=payload.duration_label.strip() or "20:00",
        order=lesson_count + 1,
        video_url=payload.video_url or "/uploads/videos/python-lesson.mp4",
        is_locked_default=lesson_count > 0,
    )
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return LessonResponse.model_validate(new_lesson)


@router.post("/{course_id}/video", response_model=CourseDetailResponse)
async def upload_course_video(
    course_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseDetailResponse:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    saved_video_url = await save_uploaded_video_from_request(
        request, f"course_{course_id}"
    )
    course.video_url = saved_video_url
    db.commit()
    return get_course_detail(course_id, db)


@router.post("/{course_id}/lessons/{lesson_id}/video", response_model=LessonResponse)
async def upload_lesson_video_from_course(
    course_id: int,
    lesson_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LessonResponse:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    module = db.query(Module).filter(Module.id == lesson.module_id).first()
    if module is None or module.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson does not belong to this course",
        )
    saved_video_url = await save_uploaded_video_from_request(
        request, f"lesson_{lesson_id}"
    )
    lesson.video_url = saved_video_url
    db.commit()
    db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.get("/{course_id}/reviews/summary", response_model=ReviewSummaryResponse)
def get_course_reviews_summary(
    course_id: int,
    db: Session = Depends(get_db),
) -> ReviewSummaryResponse:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return compute_review_summary(db, course_id)


@router.post("/{course_id}/reviews", response_model=ReviewSummaryResponse, status_code=status.HTTP_201_CREATED)
def submit_course_review(
    course_id: int,
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewSummaryResponse:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    stars_clamped = max(1, min(5, int(payload.stars)))
    review = Review(
        course_id=course_id,
        user_id=current_user.id,
        stars=stars_clamped,
    )
    db.add(review)
    db.flush()
    summary = compute_review_summary(db, course_id)
    course.rating_avg = summary.avg
    db.commit()
    return summary


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Enrollment:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    ensure_course_projects_for_user(db, current_user.id, course)

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
        )
        .first()
    )
    if existing is not None:
        db.commit()
        return existing

    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        status="active",
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment
