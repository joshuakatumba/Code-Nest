from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Quiz, Question, QuizAttempt, Competency, User
from schemas import (
    QuizDetailResponse,
    QuestionPublicResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuestionResultItem,
)
from auth import get_current_user

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.get("/{quiz_id}", response_model=QuizDetailResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)) -> QuizDetailResponse:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    questions = (
        db.query(Question)
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.id.asc())
        .all()
    )
    public_questions = [
        QuestionPublicResponse(
            id=question.id,
            quiz_id=question.quiz_id,
            prompt=question.prompt,
            options=question.options,
        )
        for question in questions
    ]
    return QuizDetailResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        questions=public_questions,
    )


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizSubmitResponse:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    questions = (
        db.query(Question)
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.id.asc())
        .all()
    )
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions",
        )

    score = 0
    results: list[QuestionResultItem] = []
    for i, question in enumerate(questions):
        selected = payload.answers[i] if i < len(payload.answers) else -1
        is_correct = selected == question.correct_index
        if is_correct:
            score += 1
        results.append(
            QuestionResultItem(
                question_id=question.id,
                selected_index=selected,
                correct_index=question.correct_index,
                is_correct=is_correct,
            )
        )

    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=score,
    )
    db.add(attempt)

    if score > 0:
        competencies = (
            db.query(Competency)
            .filter(Competency.user_id == current_user.id)
            .all()
        )
        for competency in competencies:
            if "Problem" in competency.name or "Syntax" in competency.name:
                competency.percent = min(100, competency.percent + 2)

    db.commit()

    return QuizSubmitResponse(
        score=score,
        total=len(questions),
        results=results,
    )
