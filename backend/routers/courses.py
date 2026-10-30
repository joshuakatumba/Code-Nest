from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import Course, Module, Lesson, Review, Enrollment, User
from schemas import (
    CourseResponse,
    CourseDetailResponse,
    ModuleResponse,
    LessonResponse,
    ReviewSummaryResponse,
    EnrollmentResponse,
)
from auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["courses"])


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


@router.get("", response_model=list[CourseResponse])
def list_courses(
    level: Optional[int] = None,
    db: Session = Depends(get_db),
) -> list[Course]:
    query = db.query(Course)
    if level is not None:
        query = query.filter(Course.level == level)
    return query.order_by(Course.level.asc(), Course.id.asc()).all()


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
        modules=module_responses,
        rating_breakdown=rating_breakdown,
    )


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


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Enrollment:
    # TODO(real-impl): verify payment checkout session before creating enrollment
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
        )
        .first()
    )
    if existing is not None:
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
