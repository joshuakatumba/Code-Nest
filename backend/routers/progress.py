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
    module_ids = [mod.id for mod in modules]
    lessons = (
        db.query(Lesson)
        .filter(Lesson.module_id.in_(module_ids))
        .order_by(Lesson.order.asc())
        .all()
        if module_ids
        else []
    )
    lesson_ids = [les.id for les in lessons]
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

    lessons_by_module: dict[int, list[LessonResponse]] = {mod.id: [] for mod in modules}
    module_total_counts: dict[int, int] = {mod.id: 0 for mod in modules}
    module_done_counts: dict[int, int] = {mod.id: 0 for mod in modules}

    for les in lessons:
        is_done = les.id in completed_lesson_ids
        module_total_counts[les.module_id] = module_total_counts.get(les.module_id, 0) + 1
        if is_done:
            module_done_counts[les.module_id] = module_done_counts.get(les.module_id, 0) + 1
        lessons_by_module[les.module_id].append(
            LessonResponse(
                id=les.id,
                module_id=les.module_id,
                title=les.title,
                duration_label=les.duration_label,
                order=les.order,
                video_url=les.video_url,
                is_locked_default=les.is_locked_default,
                completed=is_done,
            )
        )

    completed_modules = 0
    module_responses: list[ModuleResponse] = []
    for mod in modules:
        tot = module_total_counts.get(mod.id, 0)
        done = module_done_counts.get(mod.id, 0)
        if tot > 0 and done > 0:
            completed_modules += 1
        module_responses.append(
            ModuleResponse(
                id=mod.id,
                course_id=mod.course_id,
                title=mod.title,
                duration_label=mod.duration_label,
                order=mod.order,
                lessons=lessons_by_module.get(mod.id, []),
            )
        )

    total_lessons = len(lessons)
    completed_count = len(completed_lesson_ids)
    total_modules = len(modules)
    return module_responses, completed_count, total_lessons, completed_modules, total_modules


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
        competencies=[CompetencyResponse.model_validate(c) for c in competencies],
        enrollments=[EnrollmentResponse.model_validate(e) for e in enrollments],
        completed=completed_count,
        total=total_lessons,
        completed_modules=completed_modules,
        total_modules=total_modules,
        projects=[ProjectResponse.model_validate(p) for p in projects],
        modules=module_responses,
        quizzes=[QuizListItemResponse.model_validate(q) for q in quizzes],
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
    course_id_val = module.course_id if module else 1

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
        for comp in competencies:
            comp.percent = min(100, comp.percent + 5)

    db.commit()

    (
        _,
        completed_count,
        total_lessons,
        completed_modules,
        total_modules,
    ) = build_course_progress_data(db, current_user.id, course_id_val)

    return LessonCompleteResponse(
        lesson_id=lesson_id,
        completed=True,
        competencies=[CompetencyResponse.model_validate(c) for c in competencies],
        completed_count=completed_count,
        total_lessons=total_lessons,
        completed_modules=completed_modules,
        total_modules=total_modules,
    )
