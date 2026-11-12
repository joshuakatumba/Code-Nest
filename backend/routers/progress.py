from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import (
    User,
    Course,
    Module,
    Lesson,
    Enrollment,
    LessonProgress,
    Competency,
    Project,
    Quiz,
    QuizAttempt,
)
from schemas import (
    ProgressResponse,
    CourseResponse,
    CompetencyResponse,
    EnrollmentResponse,
    ProjectResponse,
    ModuleResponse,
    LessonResponse,
    QuizListItemResponse,
    LessonCompleteResponse,
)
from auth import get_current_user
from routers.courses import (
    save_uploaded_video_from_request,
    ensure_course_projects_for_user,
)

router = APIRouter(prefix="/api", tags=["progress"])


def build_course_progress_data(
    db: Session, user_id: int, target_course_id: int
) -> tuple[list[ModuleResponse], list[int], int, int, int, int]:
    modules = (
        db.query(Module)
        .filter(Module.course_id == target_course_id)
        .order_by(Module.order.asc())
        .all()
    )
    module_ids = [module.id for module in modules]
    module_order_map = {module.id: module.order for module in modules}

    raw_lessons = (
        db.query(Lesson)
        .filter(Lesson.module_id.in_(module_ids))
        .all()
        if module_ids
        else []
    )
    lessons = sorted(
        raw_lessons,
        key=lambda item: (module_order_map.get(item.module_id, 0), item.order, item.id),
    )
    lesson_ids = [lesson.id for lesson in lessons]
    progress_rows = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.completed == True,
        )
        .all()
        if lesson_ids
        else []
    )
    completed_lesson_ids = {row.lesson_id for row in progress_rows}

    lessons_by_module: dict[int, list[LessonResponse]] = {
        module.id: [] for module in modules
    }
    module_total_counts: dict[int, int] = {module.id: 0 for module in modules}
    module_done_counts: dict[int, int] = {module.id: 0 for module in modules}

    for i, lesson in enumerate(lessons):
        is_completed = lesson.id in completed_lesson_ids
        previous_completed = i == 0 or (lessons[i - 1].id in completed_lesson_ids)
        effective_locked = (
            bool(lesson.is_locked_default)
            and not is_completed
            and not previous_completed
        )

        module_total_counts[lesson.module_id] = (
            module_total_counts.get(lesson.module_id, 0) + 1
        )
        if is_completed:
            module_done_counts[lesson.module_id] = (
                module_done_counts.get(lesson.module_id, 0) + 1
            )
        lessons_by_module[lesson.module_id].append(
            LessonResponse(
                id=lesson.id,
                module_id=lesson.module_id,
                title=lesson.title,
                duration_label=lesson.duration_label,
                order=lesson.order,
                video_url=lesson.video_url,
                is_locked_default=effective_locked,
                completed=is_completed,
            )
        )

    completed_modules = 0
    module_responses: list[ModuleResponse] = []
    for module in modules:
        module_total = module_total_counts.get(module.id, 0)
        module_done = module_done_counts.get(module.id, 0)
        if module_total > 0 and module_done > 0:
            completed_modules += 1
        module_responses.append(
            ModuleResponse(
                id=module.id,
                course_id=module.course_id,
                title=module.title,
                duration_label=module.duration_label,
                order=module.order,
                lessons=lessons_by_module.get(module.id, []),
            )
        )

    total_lessons = len(lessons)
    completed_count = len(completed_lesson_ids)
    total_modules = len(modules)
    return (
        module_responses,
        lesson_ids,
        completed_count,
        total_lessons,
        completed_modules,
        total_modules,
    )


@router.get("/progress", response_model=ProgressResponse)
def get_progress(
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProgressResponse:
    competencies = (
        db.query(Competency)
        .filter(Competency.user_id == current_user.id)
        .order_by(Competency.id.asc())
        .all()
    )
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.created_at.desc())
        .all()
    )

    enrolled_course_ids = [enrollment.course_id for enrollment in enrollments]
    enrolled_courses_rows = (
        db.query(Course)
        .filter(Course.id.in_(enrolled_course_ids))
        .order_by(Course.level.asc())
        .all()
        if enrolled_course_ids
        else []
    )

    if course_id is not None:
        active_course_id = course_id
    elif enrollments:
        active_course_id = enrollments[0].course_id
    else:
        python_course = db.query(Course).filter(Course.level == 2).first()
        active_course_id = python_course.id if python_course else 1

    active_course = db.query(Course).filter(Course.id == active_course_id).first()
    if active_course is not None:
        ensure_course_projects_for_user(db, current_user.id, active_course)
        db.commit()

    course_projects = (
        db.query(Project)
        .filter(
            Project.user_id == current_user.id,
            Project.course_id == active_course_id,
        )
        .order_by(Project.id.asc())
        .all()
    )
    if not course_projects:
        course_projects = (
            db.query(Project)
            .filter(Project.user_id == current_user.id)
            .order_by(Project.id.asc())
            .all()
        )

    (
        module_responses,
        course_lesson_ids,
        completed_count,
        total_lessons,
        completed_modules,
        total_modules,
    ) = build_course_progress_data(db, current_user.id, active_course_id)

    quizzes = (
        db.query(Quiz)
        .filter(Quiz.lesson_id.in_(course_lesson_ids))
        .order_by(Quiz.id.asc())
        .all()
        if course_lesson_ids
        else []
    )
    if not quizzes:
        quizzes = db.query(Quiz).order_by(Quiz.id.asc()).all()

    attempt_rows = (
        db.query(QuizAttempt.quiz_id, func.max(QuizAttempt.score))
        .filter(QuizAttempt.user_id == current_user.id)
        .group_by(QuizAttempt.quiz_id)
        .all()
    )
    best_scores_by_quiz = {int(q_id): int(max_score) for q_id, max_score in attempt_rows}

    quiz_items = [
        QuizListItemResponse(
            id=quiz.id,
            lesson_id=quiz.lesson_id,
            title=quiz.title,
            best_score=best_scores_by_quiz.get(quiz.id),
        )
        for quiz in quizzes
    ]

    return ProgressResponse(
        active_course_id=active_course_id,
        enrolled_courses=[
            CourseResponse.model_validate(course_row)
            for course_row in enrolled_courses_rows
        ],
        competencies=[
            CompetencyResponse.model_validate(competency)
            for competency in competencies
        ],
        enrollments=[
            EnrollmentResponse.model_validate(enrollment)
            for enrollment in enrollments
        ],
        completed=completed_count,
        total=total_lessons,
        completed_modules=completed_modules,
        total_modules=total_modules,
        projects=[ProjectResponse.model_validate(project) for project in course_projects],
        modules=module_responses,
        quizzes=quiz_items,
    )


@router.post("/lessons/{lesson_id}/video", response_model=LessonResponse)
async def upload_lesson_video(
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
    saved_video_url = await save_uploaded_video_from_request(
        request, f"lesson_{lesson_id}"
    )
    lesson.video_url = saved_video_url
    db.commit()
    db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LessonCompleteResponse:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    module = db.query(Module).filter(Module.id == lesson.module_id).first()
    course_id_value = module.course_id if module else 1

    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == lesson_id,
        )
        .first()
    )
    newly_completed = False
    if progress is None:
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
        )
        db.add(progress)
        newly_completed = True
    elif not progress.completed:
        progress.completed = True
        newly_completed = True

    competencies = (
        db.query(Competency)
        .filter(Competency.user_id == current_user.id)
        .order_by(Competency.id.asc())
        .all()
    )
    if newly_completed:
        for competency in competencies:
            competency.percent = min(100, competency.percent + 5)

    db.commit()

    (
        _,
        _,
        completed_count,
        total_lessons,
        completed_modules,
        total_modules,
    ) = build_course_progress_data(db, current_user.id, course_id_value)

    return LessonCompleteResponse(
        lesson_id=lesson_id,
        completed=True,
        competencies=[
            CompetencyResponse.model_validate(competency)
            for competency in competencies
        ],
        completed_count=completed_count,
        total_lessons=total_lessons,
        completed_modules=completed_modules,
        total_modules=total_modules,
    )
