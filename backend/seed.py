from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base, ensure_schema_columns
from models import (
    Plan,
    User,
    Course,
    Module,
    Lesson,
    Enrollment,
    LessonProgress,
    Competency,
    Project,
    Quiz,
    Question,
    Review,
)
from auth import hash_password


def get_or_create_plan(
    db: Session, name: str, price_usd: float, period: str, features: list[str]
) -> Plan:
    plan = db.query(Plan).filter(Plan.name == name).first()
    if plan is None:
        plan = Plan(name=name, price_usd=price_usd, period=period, features=features)
        db.add(plan)
        db.flush()
    else:
        plan.price_usd = price_usd
        plan.period = period
        plan.features = features
    return plan


def get_or_create_user(
    db: Session, name: str, email: str, password: str, plan_id: int | None
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            plan_id=plan_id,
        )
        db.add(user)
        db.flush()
    return user


def get_or_create_course(db: Session, course_data: dict) -> Course:
    course = db.query(Course).filter(Course.level == course_data["level"]).first()
    if course is None:
        course = Course(**course_data)
        db.add(course)
        db.flush()
    else:
        for field_name, field_value in course_data.items():
            setattr(course, field_name, field_value)
    return course


def get_or_create_module(
    db: Session, course_id: int, title: str, duration_label: str, order: int
) -> Module:
    module = (
        db.query(Module)
        .filter(Module.course_id == course_id, Module.order == order)
        .first()
    )
    if module is None:
        module = Module(
            course_id=course_id,
            title=title,
            duration_label=duration_label,
            order=order,
        )
        db.add(module)
        db.flush()
    else:
        module.title = title
        module.duration_label = duration_label
    return module


def get_or_create_lesson(
    db: Session,
    module_id: int,
    title: str,
    duration_label: str,
    order: int,
    is_locked_default: bool,
    video_url: str = "/uploads/videos/python-lesson.mp4",
) -> Lesson:
    lesson = (
        db.query(Lesson)
        .filter(Lesson.module_id == module_id, Lesson.order == order)
        .first()
    )
    if lesson is None:
        lesson = Lesson(
            module_id=module_id,
            title=title,
            duration_label=duration_label,
            order=order,
            video_url=video_url,
            is_locked_default=is_locked_default,
        )
        db.add(lesson)
        db.flush()
    else:
        lesson.title = title
        lesson.duration_label = duration_label
        lesson.is_locked_default = is_locked_default
        if not lesson.video_url or lesson.video_url.endswith(".svg"):
            lesson.video_url = video_url
    return lesson


def ensure_user_defaults(db: Session, user_id: int, default_course_id: int) -> None:
    existing_competencies = (
        db.query(Competency).filter(Competency.user_id == user_id).all()
    )
    if not existing_competencies:
        competency_items = [
            ("Logical Thinking", 85),
            ("Python Syntax Mastery", 70),
            ("Problem Solving", 90),
        ]
        for competency_name, competency_percent in competency_items:
            db.add(
                Competency(
                    user_id=user_id,
                    name=competency_name,
                    percent=competency_percent,
                )
            )

    existing_projects = db.query(Project).filter(Project.user_id == user_id).all()
    if not existing_projects:
        db.add(
            Project(
                user_id=user_id,
                course_id=default_course_id,
                title="Mobile Money Fee Calculator",
                description="CLI tool estimating MTN MoMo and Airtel Money withdrawal fees in Uganda.",
                preview_key="momo",
            )
        )
        db.add(
            Project(
                user_id=user_id,
                course_id=default_course_id,
                title="District Quiz Game",
                description="Interactive Ugandan district geography quiz covering Kampala, Wakiso, and Jinja.",
                preview_key="district",
            )
        )


def seed_lesson_progress(
    db: Session, user_id: int, lesson_ids: list[int]
) -> None:
    existing_rows = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
        .all()
    )
    existing_lesson_ids = {row.lesson_id for row in existing_rows}
    for lesson_id in lesson_ids:
        if lesson_id not in existing_lesson_ids:
            db.add(
                LessonProgress(
                    user_id=user_id,
                    lesson_id=lesson_id,
                    completed=True,
                )
            )


def get_or_create_quiz(
    db: Session,
    existing_quizzes_by_title: dict[str, Quiz],
    lesson_id: int,
    title: str,
) -> Quiz:
    quiz = existing_quizzes_by_title.get(title)
    if quiz is None:
        quiz = Quiz(lesson_id=lesson_id, title=title)
        db.add(quiz)
        db.flush()
        existing_quizzes_by_title[title] = quiz
    return quiz


def seed_quizzes_and_questions(
    db: Session,
    lesson_three_id: int,
    lesson_four_id: int,
    lesson_six_id: int,
    lesson_eight_id: int,
    lesson_nine_id: int,
    lesson_ten_id: int,
    lesson_eleven_id: int,
) -> None:
    all_quizzes = db.query(Quiz).all()
    existing_quizzes_by_title = {quiz.title: quiz for quiz in all_quizzes}

    quiz_one = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_three_id, "Lesson 01 : Syntax"
    )
    quiz_two = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_four_id, "Lesson 02 : Variables"
    )
    quiz_three = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_six_id, "Lesson 03 : Functions"
    )
    quiz_four = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_eight_id, "Lesson 04 : Conditions"
    )
    quiz_five = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_nine_id, "Lesson 05 : Quiz One"
    )
    quiz_six = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_ten_id, "Lesson 06 : Project one"
    )
    quiz_seven = get_or_create_quiz(
        db, existing_quizzes_by_title, lesson_eleven_id, "Lesson 07 : Final Evaluation"
    )

    existing_questions = db.query(Question).all()
    existing_prompts = {question.prompt for question in existing_questions}

    question_definitions = [
        (
            quiz_one.id,
            "Which Python function displays text on the screen?",
            ["A. echo()", "B. print()", "C. display()", "D. write()"],
            1,
        ),
        (
            quiz_one.id,
            "Which symbol starts a comment in Python?",
            ["A. //", "B. --", "C. #", "D. /*"],
            2,
        ),
        (
            quiz_two.id,
            "Which is a valid variable name in Python?",
            ["A. 2student", "B. student_name", "C. student-name", "D. class"],
            1,
        ),
        (
            quiz_two.id,
            "What value is stored in x after: x = 10 + 5?",
            ["A. 105", "B. 15", "C. 5", "D. Error"],
            1,
        ),
        (
            quiz_three.id,
            "Which keyword defines a function in Python?",
            ["A. func", "B. define", "C. def", "D. function"],
            2,
        ),
        (
            quiz_four.id,
            "Which operator checks if two values are equal in Python?",
            ["A. =", "B. ==", "C. !=", "D. ==="],
            1,
        ),
        (
            quiz_five.id,
            "How many times does 'for i in range(3):' repeat?",
            ["A. 2 times", "B. 3 times", "C. 4 times", "D. Infinite"],
            1,
        ),
        (
            quiz_six.id,
            "Which function reads text input from the user in CLI apps?",
            ["A. get()", "B. input()", "C. read()", "D. scan()"],
            1,
        ),
        (
            quiz_seven.id,
            "What is the output of print(len('Kampala'))?",
            ["A. 6", "B. 7", "C. 8", "D. Kampala"],
            1,
        ),
    ]

    for quiz_id, prompt_text, options_list, correct_index in question_definitions:
        if prompt_text not in existing_prompts:
            db.add(
                Question(
                    quiz_id=quiz_id,
                    prompt=prompt_text,
                    options=options_list,
                    correct_index=correct_index,
                )
            )


def seed_reviews_for_course(
    db: Session,
    reviewed_course_ids: set[int],
    course_id: int,
    user_id: int,
    star_distribution: list[int] | None = None,
) -> None:
    if course_id in reviewed_course_ids:
        return
    stars_list = star_distribution or [5, 5, 5, 5, 5, 4, 4, 4, 3, 2]
    for star_value in stars_list:
        db.add(
            Review(
                course_id=course_id,
                user_id=user_id,
                stars=star_value,
            )
        )


def seed_database() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()
    db = SessionLocal()
    try:
        get_or_create_plan(
            db,
            name="Free",
            price_usd=0.0,
            period="FOREVER",
            features=[
                "Basic Class on Python",
                "3 Quizzes per day",
                "Limited Code Challenges",
            ],
        )
        individual_plan = get_or_create_plan(
            db,
            name="Individual",
            price_usd=24.0,
            period="MONTH",
            features=[
                "Unlimited Quizzes",
                "Advanced Classes",
                "Certifications for All",
                "Unlimited Code Challenges",
                "Project Templates",
            ],
        )
        get_or_create_plan(
            db,
            name="Corporate",
            price_usd=32.0,
            period="EDITOR",
            features=[
                "Unlock All Features",
                "Work With Teams",
                "Unlimited Challenges",
                "Starter Templates",
            ],
        )

        demo_user = get_or_create_user(
            db,
            name="Katumba",
            email="katumba@codenest.ug",
            password="password123",
            plan_id=individual_plan.id,
        )

        course_one = get_or_create_course(
            db,
            {
                "title": "Level 1: Creative Coding with Scratch",
                "level": 1,
                "tech": "Scratch",
                "description": "Build interactive stories, animations, and games using visual blocks. Students learn sequencing, loops, and problem-solving in a playful project-based Scratch environment.",
                "age_range": "12-14",
                "grade_range": "Senior 1-2 • Beginner",
                "builds": "Animated stories, Boda-Boda Traffic Maze, and Luwombo Catch",
                "skills": "Algorithms, loops, conditionals, events, sprites",
                "duration": "1 Term • 12 Sessions • $40",
                "price_usd": 40.0,
                "old_price_usd": 80.0,
                "banner_key": "scratch",
                "rating_avg": 4.5,
                "video_url": "/uploads/videos/scratch-lesson.mp4",
            },
        )

        course_two = get_or_create_course(
            db,
            {
                "title": "Level 2: Text-Based Python",
                "level": 2,
                "tech": "Python 3 & Thonny",
                "description": "Move from blocks to real code with Python fundamentals. Students practice writing commands, working with variables, and building mini-projects in a guided coding environment.",
                "age_range": "14-16",
                "grade_range": "Senior 2-3 • Level 1 or basic ICT",
                "builds": "Mobile Money Fee Estimator and School Fee Calculator",
                "skills": "Python syntax, types, lists, functions, debugging",
                "duration": "1 Term • 12 Sessions • $45",
                "price_usd": 19.99,
                "old_price_usd": 99.99,
                "banner_key": "python",
                "rating_avg": 4.2,
                "video_url": "/uploads/videos/python-lesson.mp4",
            },
        )

        course_three = get_or_create_course(
            db,
            {
                "title": "Level 3: Local Problem Solving",
                "level": 3,
                "tech": "Advanced Python, Tkinter & CSV",
                "description": "Design and build desktop applications that solve local Ugandan community and school challenges using Python GUIs and persistent data files.",
                "age_range": "15-17",
                "grade_range": "Senior 3-4 • Level 2 Python",
                "builds": "School Canteen Tracker and District Geography Quiz",
                "skills": "GUI design, file storage, software lifecycle, pitching",
                "duration": "1 Term • 12 Sessions • $50",
                "price_usd": 50.0,
                "old_price_usd": 100.0,
                "banner_key": "tkinter",
                "rating_avg": 4.6,
                "video_url": "/uploads/videos/tkinter-lesson.mp4",
            },
        )

        module_one = get_or_create_module(db, course_two.id, "Get Started", "1 Hour", 1)
        module_two = get_or_create_module(db, course_two.id, "Python Syntax & Variables", "2 Hours", 2)
        module_three = get_or_create_module(db, course_two.id, "Functions & Logic", "1 Hour", 3)
        module_four = get_or_create_module(db, course_two.id, "Conditions & Loops", "45 Mins", 4)
        module_five = get_or_create_module(db, course_two.id, "Mini Project: Fee Estimator", "59 Mins", 5)

        lesson_one = get_or_create_lesson(db, module_one.id, "1. Installing Thonny & Setup", "20:00", 1, False, "/uploads/videos/python-lesson.mp4")
        lesson_two = get_or_create_lesson(db, module_one.id, "2. Running Your First Script", "40:00", 2, False, "/uploads/videos/python-lesson.mp4")

        lesson_three = get_or_create_lesson(db, module_two.id, "1. Hello World & print()", "65:00", 1, False, "/uploads/videos/python-lesson.mp4")
        lesson_four = get_or_create_lesson(db, module_two.id, "2. Variables & Input", "25:00", 2, True, "/uploads/videos/python-lesson.mp4")
        get_or_create_lesson(db, module_two.id, "3. Data Types", "30:00", 3, True, "/uploads/videos/python-lesson.mp4")

        lesson_six = get_or_create_lesson(db, module_three.id, "1. Defining Functions", "30:00", 1, True, "/uploads/videos/python-lesson.mp4")
        get_or_create_lesson(db, module_three.id, "2. Return Values", "30:00", 2, True, "/uploads/videos/python-lesson.mp4")

        lesson_eight = get_or_create_lesson(db, module_four.id, "1. If / Else Statements", "25:00", 1, True, "/uploads/videos/python-lesson.mp4")
        lesson_nine = get_or_create_lesson(db, module_four.id, "2. For & While Loops", "20:00", 2, True, "/uploads/videos/python-lesson.mp4")

        lesson_ten = get_or_create_lesson(db, module_five.id, "1. Mobile Money Fee Logic", "30:00", 1, True, "/uploads/videos/python-lesson.mp4")
        lesson_eleven = get_or_create_lesson(db, module_five.id, "2. Final Evaluation", "29:00", 2, True, "/uploads/videos/python-lesson.mp4")

        scratch_module_one = get_or_create_module(db, course_one.id, "Get Started with Scratch", "1 Hour", 1)
        scratch_module_two = get_or_create_module(db, course_one.id, "Sprites, Motion & Loops", "2 Hours", 2)
        scratch_module_three = get_or_create_module(db, course_one.id, "Project: Boda-Boda Maze", "1 Hour", 3)
        scratch_l1 = get_or_create_lesson(db, scratch_module_one.id, "1. Scratch Stage & Sprites", "30:00", 1, False, "/uploads/videos/scratch-lesson.mp4")
        scratch_l2 = get_or_create_lesson(db, scratch_module_two.id, "1. Forever Loops & Events", "45:00", 1, True, "/uploads/videos/scratch-lesson.mp4")
        get_or_create_lesson(db, scratch_module_three.id, "1. Building the Maze Game", "60:00", 1, True, "/uploads/videos/scratch-lesson.mp4")

        tkinter_module_one = get_or_create_module(db, course_three.id, "Desktop Windows with Tkinter", "2 Hours", 1)
        tkinter_module_two = get_or_create_module(db, course_three.id, "Reading & Writing CSV Files", "2 Hours", 2)
        tkinter_module_three = get_or_create_module(db, course_three.id, "Project: School Canteen Tracker", "2 Hours", 3)
        tkinter_l1 = get_or_create_lesson(db, tkinter_module_one.id, "1. Buttons, Labels & Entry", "45:00", 1, False, "/uploads/videos/tkinter-lesson.mp4")
        tkinter_l2 = get_or_create_lesson(db, tkinter_module_two.id, "1. Storing Sales in CSV", "50:00", 1, True, "/uploads/videos/tkinter-lesson.mp4")
        get_or_create_lesson(db, tkinter_module_three.id, "1. Full Canteen App Showcase", "60:00", 1, True, "/uploads/videos/tkinter-lesson.mp4")

        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == demo_user.id,
                Enrollment.course_id == course_two.id,
            )
            .first()
        )
        if enrollment is None:
            db.add(
                Enrollment(
                    user_id=demo_user.id,
                    course_id=course_two.id,
                    status="active",
                )
            )

        seed_lesson_progress(
            db, demo_user.id, [lesson_one.id, lesson_two.id, lesson_three.id]
        )
        ensure_user_defaults(db, demo_user.id, course_two.id)

        seed_quizzes_and_questions(
            db,
            lesson_three.id,
            lesson_four.id,
            lesson_six.id,
            lesson_eight.id,
            lesson_nine.id,
            lesson_ten.id,
            lesson_eleven.id,
        )

        all_quizzes_after = {quiz.title: quiz for quiz in db.query(Quiz).all()}
        scratch_q1 = get_or_create_quiz(
            db, all_quizzes_after, scratch_l1.id, "Scratch 01 : Stage & Sprites"
        )
        scratch_q2 = get_or_create_quiz(
            db, all_quizzes_after, scratch_l2.id, "Scratch 02 : Forever Loops"
        )
        tkinter_q1 = get_or_create_quiz(
            db, all_quizzes_after, tkinter_l1.id, "Tkinter 01 : Widgets & Windows"
        )
        tkinter_q2 = get_or_create_quiz(
            db, all_quizzes_after, tkinter_l2.id, "Tkinter 02 : CSV File Storage"
        )
        existing_prompts_after = {q.prompt for q in db.query(Question).all()}
        extra_questions = [
            (
                scratch_q1.id,
                "Which Scratch block starts a script when the green flag is clicked?",
                ["A. forever", "B. when green flag clicked", "C. move 10 steps", "D. wait 1 second"],
                1,
            ),
            (
                scratch_q2.id,
                "Which block repeats actions continuously during a game?",
                ["A. if then", "B. stop all", "C. forever", "D. say Hello"],
                2,
            ),
            (
                tkinter_q1.id,
                "Which Tkinter widget creates a clickable button in a desktop window?",
                ["A. tk.Label", "B. tk.Entry", "C. tk.Button", "D. tk.Frame"],
                2,
            ),
            (
                tkinter_q2.id,
                "Which standard Python module reads and writes comma-separated files?",
                ["A. math", "B. csv", "C. turtle", "D. random"],
                1,
            ),
        ]
        for quiz_id, prompt_text, options_list, correct_idx in extra_questions:
            if prompt_text not in existing_prompts_after:
                db.add(
                    Question(
                        quiz_id=quiz_id,
                        prompt=prompt_text,
                        options=options_list,
                        correct_index=correct_idx,
                    )
                )

        existing_reviews = db.query(Review).all()
        reviewed_course_ids = {review.course_id for review in existing_reviews}
        seed_reviews_for_course(
            db,
            reviewed_course_ids,
            course_one.id,
            demo_user.id,
            [5, 5, 5, 5, 5, 5, 4, 4, 4, 3],
        )
        seed_reviews_for_course(
            db,
            reviewed_course_ids,
            course_two.id,
            demo_user.id,
            [5, 5, 5, 5, 5, 4, 4, 4, 3, 2],
        )
        seed_reviews_for_course(
            db,
            reviewed_course_ids,
            course_three.id,
            demo_user.id,
            [5, 5, 5, 5, 5, 5, 5, 4, 4, 4],
        )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully.")
