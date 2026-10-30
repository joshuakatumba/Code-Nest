from fastapi import APIRouter, Depends, HTTPException, status
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
)
from schemas import (
    ProgressResponse,
    CompetencyResponse,
    EnrollmentResponse,
    ProjectResponse,
    ModuleResponse,
    LessonResponse,
    QuizListItemResponse,
    LessonCompleteResponse,
)
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["progress"])


def build_course_progress_data(
    db: Session, user_id: int, target_course_id: int
) -> tuple[list[ModuleResponse], int, int, int, int]:
    modules = (
        db.query(Module)
        .filter(Module.course_id == target_course_id)
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

    for lesson in lessons:
        is_completed = lesson.id in completed_lesson_ids
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
                is_locked_default=lesson.is_locked_default,
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
        completed_count,
        total_lessons,
        completed_modules,
        total_modules,
    )


@router.get("/progress", response_model=ProgressResponse)
def get_progress(
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
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.id.asc())
        .all()
    )

    if enrollments:
        active_course_id = enrollments[0].course_id
    else:
        python_course = db.query(Course).filter(Course.level == 2).first()
        active_course_id = python_course.id if python_course else 1

    (
        module_responses,
        completed_count,
        total_lessons,
        completed_modules,
        total_modules,
    ) = build_course_progress_data(db, current_user.id, active_course_id)

    quizzes = db.query(Quiz).order_by(Quiz.id.asc()).all()

    return ProgressResponse(
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
        projects=[ProjectResponse.model_validate(project) for project in projects],
        modules=module_responses,
        quizzes=[QuizListItemResponse.model_validate(quiz) for quiz in quizzes],
    )


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
