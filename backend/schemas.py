from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    plan_id: Optional[int] = None
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price_usd: float
    period: str
    features: list[str]


class PlanSubscribeRequest(BaseModel):
    plan_id: int


class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_id: int
    title: str
    duration_label: str
    order: int
    video_url: Optional[str] = None
    is_locked_default: bool
    completed: bool = False


class ModuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    duration_label: str
    order: int
    lessons: list[LessonResponse] = []


class ReviewSummaryResponse(BaseModel):
    avg: float
    counts: dict[str, int]
    total: int


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    level: int
    tech: str
    description: str
    age_range: str
    grade_range: str
    builds: str
    skills: str
    duration: str
    price_usd: float
    old_price_usd: float
    banner_key: str
    rating_avg: float
    video_url: Optional[str] = None


class CourseCreateRequest(BaseModel):
    title: str
    level: int = 1
    tech: str = "Python 3"
    description: str
    age_range: str = "12-16"
    grade_range: str = "Senior 1-3 (12-16)"
    builds: str = "Custom Student Projects"
    skills: str = "Problem solving, coding logic"
    duration: str = "1 Term (12 sessions) • $40"
    price_usd: float = 40.0
    old_price_usd: float = 80.0
    banner_key: str = "python"
    video_url: Optional[str] = None


class ModuleCreateRequest(BaseModel):
    title: str
    duration_label: str = "1 Hour"


class LessonCreateRequest(BaseModel):
    module_id: int
    title: str
    duration_label: str = "20:00"
    video_url: Optional[str] = None


class ReviewCreateRequest(BaseModel):
    stars: int


class AccessCodeEnrollRequest(BaseModel):
    access_code: str


class CourseDetailResponse(CourseResponse):
    modules: list[ModuleResponse] = []
    rating_breakdown: ReviewSummaryResponse


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    course_id: int
    created_at: datetime
    status: str


class CompetencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    percent: int


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    course_id: int
    title: str
    description: str
    preview_key: str


class ProjectCreateRequest(BaseModel):
    course_id: Optional[int] = None
    title: str
    description: str
    preview_key: str = "momo"


class QuizListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    title: str
    best_score: Optional[int] = None


class ProgressResponse(BaseModel):
    active_course_id: Optional[int] = None
    enrolled_courses: list[CourseResponse] = []
    competencies: list[CompetencyResponse]
    enrollments: list[EnrollmentResponse]
    completed: int
    total: int
    completed_modules: int
    total_modules: int
    projects: list[ProjectResponse]
    modules: list[ModuleResponse]
    quizzes: list[QuizListItemResponse]


class LessonCompleteResponse(BaseModel):
    lesson_id: int
    completed: bool
    competencies: list[CompetencyResponse]
    completed_count: int
    total_lessons: int
    completed_modules: int
    total_modules: int


class QuestionPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    prompt: str
    options: list[str]


class QuizDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    title: str
    questions: list[QuestionPublicResponse]


class QuizSubmitRequest(BaseModel):
    answers: list[int]


class QuestionResultItem(BaseModel):
    question_id: int
    selected_index: int
    correct_index: int
    is_correct: bool


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    results: list[QuestionResultItem]


class NewsletterRequest(BaseModel):
    email: EmailStr


class NewsletterResponse(BaseModel):
    id: int
    email: str
