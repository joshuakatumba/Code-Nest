from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
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
        for key, value in course_data.items():
            setattr(course, key, value)
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
            video_url="/images/instructor.svg",
            is_locked_default=is_locked_default,
        )
        db.add(lesson)
        db.flush()
    else:
        lesson.title = title
        lesson.duration_label = duration_label
        lesson.is_locked_default = is_locked_default
    return lesson


def ensure_user_defaults(db: Session, user_id: int, default_course_id: int) -> None:
    existing_comps = db.query(Competency).filter(Competency.user_id == user_id).all()
    if not existing_comps:
        comp_items = [
            ("Logical Thinking", 85),
            ("Python Syntax Mastery", 70),
            ("Problem Solving", 90),
        ]
        for comp_name, comp_percent in comp_items:
            db.add(Competency(user_id=user_id, name=comp_name, percent=comp_percent))

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


def seed_database() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        free_plan = get_or_create_plan(
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

        course_1 = get_or_create_course(
            db,
            {
                "title": "Level 1: Creative Coding with Scratch",
                "level": 1,
                "tech": "Scratch (block coding)",
                "description": "Build interactive stories, animations, and games using visual blocks. Students learn sequencing, loops, and problem-solving in a playful project-based Scratch environment.",
                "age_range": "12-14",
                "grade_range": "Senior 1-2 (12-14) • Beginner",
                "builds": "Animated stories and games (e.g., Boda-Boda Traffic Maze, Lubiri Luwombo Catch)",
                "skills": "Algorithms, loops, conditionals, events, sprites/physics",
                "duration": "1 Term (12 sessions) + End-of-Term Showcase • $40",
                "price_usd": 40.0,
                "old_price_usd": 80.0,
                "banner_key": "scratch",
                "rating_avg": 4.5,
            },
        )

        course_2 = get_or_create_course(
            db,
            {
                "title": "Level 2: Text-Based Python",
                "level": 2,
                "tech": "Python 3 (Thonny)",
                "description": "Move from blocks to real code with Python fundamentals. Students practice writing commands, working with variables, and building mini-projects in a guided coding environment.",
                "age_range": "14-16",
                "grade_range": "Senior 2-3 (14-16) • Level 1 or basic ICT",
                "builds": "CLI apps (e.g., Mobile Money Fee Estimator, School Fee Calculator)",
                "skills": "Python syntax, types, lists/dicts, functions, debugging",
                "duration": "1 Term (12 sessions) + Portfolio Assessment • $45",
                "price_usd": 19.99,
                "old_price_usd": 99.99,
                "banner_key": "python",
                "rating_avg": 4.2,
            },
        )

        course_3 = get_or_create_course(
            db,
            {
                "title": "Level 3: Local Problem Solving",
                "level": 3,
                "tech": "Advanced Python, Tkinter, CSV I/O",
                "description": "Design and build desktop applications that solve local Ugandan community and school challenges using Python GUIs and persistent data files.",
                "age_range": "15-17",
                "grade_range": "Senior 3-4 (15-17) • Level 2 Python",
                "builds": "Desktop apps (e.g., School Canteen Tracker, District Geography Quiz)",
                "skills": "GUI design, file storage, software lifecycle, pitching",
                "duration": "1 Term (12 sessions) + End-of-Term Showcase/Pitch • $50",
                "price_usd": 50.0,
                "old_price_usd": 100.0,
                "banner_key": "tkinter",
                "rating_avg": 4.6,
            },
        )

        m1 = get_or_create_module(db, course_2.id, "Get Started", "1 Hour", 1)
        m2 = get_or_create_module(db, course_2.id, "Python Syntax & Variables", "2 Hours", 2)
        m3 = get_or_create_module(db, course_2.id, "Functions & Logic", "1 Hour", 3)
        m4 = get_or_create_module(db, course_2.id, "Conditions & Loops", "45 Mins", 4)
        m5 = get_or_create_module(db, course_2.id, "Mini Project: Fee Estimator", "59 Mins", 5)

        l1 = get_or_create_lesson(db, m1.id, "1. Installing Thonny & Setup", "20:00", 1, False)
        l2 = get_or_create_lesson(db, m1.id, "2. Running Your First Script", "40:00", 2, False)

        l3 = get_or_create_lesson(db, m2.id, "1. Hello World & print()", "65:00", 1, False)
        l4 = get_or_create_lesson(db, m2.id, "2. Variables & Input", "25:00", 2, True)
        l5 = get_or_create_lesson(db, m2.id, "3. Data Types", "30:00", 3, True)

        l6 = get_or_create_lesson(db, m3.id, "1. Defining Functions", "30:00", 1, True)
        l7 = get_or_create_lesson(db, m3.id, "2. Return Values", "30:00", 2, True)

        l8 = get_or_create_lesson(db, m4.id, "1. If / Else Statements", "25:00", 1, True)
        l9 = get_or_create_lesson(db, m4.id, "2. For & While Loops", "20:00", 2, True)

        l10 = get_or_create_lesson(db, m5.id, "1. Mobile Money Fee Logic", "30:00", 1, True)
        l11 = get_or_create_lesson(db, m5.id, "2. Final Evaluation", "29:00", 2, True)

        sm1 = get_or_create_module(db, course_1.id, "Get Started with Scratch", "1 Hour", 1)
        sm2 = get_or_create_module(db, course_1.id, "Sprites, Motion & Loops", "2 Hours", 2)
        sm3 = get_or_create_module(db, course_1.id, "Project: Boda-Boda Maze", "1 Hour", 3)
        get_or_create_lesson(db, sm1.id, "1. Scratch Stage & Sprites", "30:00", 1, False)
        get_or_create_lesson(db, sm2.id, "1. Forever Loops & Events", "45:00", 1, True)
        get_or_create_lesson(db, sm3.id, "1. Building the Maze Game", "60:00", 1, True)

        tm1 = get_or_create_module(db, course_3.id, "Desktop Windows with Tkinter", "2 Hours", 1)
        tm2 = get_or_create_module(db, course_3.id, "Reading & Writing CSV Files", "2 Hours", 2)
        tm3 = get_or_create_module(db, course_3.id, "Project: School Canteen Tracker", "2 Hours", 3)
        get_or_create_lesson(db, tm1.id, "1. Buttons, Labels & Entry", "45:00", 1, False)
        get_or_create_lesson(db, tm2.id, "1. Storing Sales in CSV", "50:00", 1, True)
        get_or_create_lesson(db, tm3.id, "1. Full Canteen App Showcase", "60:00", 1, True)

        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == demo_user.id,
                Enrollment.course_id == course_2.id,
            )
            .first()
        )
        if enrollment is None:
            db.add(
                Enrollment(
                    user_id=demo_user.id,
                    course_id=course_2.id,
                    status="active",
                )
            )

        completed_initial_lessons = [l1.id, l2.id, l3.id]
        for lesson_id_val in completed_initial_lessons:
            prog = (
                db.query(LessonProgress)
                .filter(
                    LessonProgress.user_id == demo_user.id,
                    LessonProgress.lesson_id == lesson_id_val,
                )
                .first()
            )
            if prog is None:
                db.add(
                    LessonProgress(
                        user_id=demo_user.id,
                        lesson_id=lesson_id_val,
                        completed=True,
                    )
                )

        ensure_user_defaults(db, demo_user.id, course_2.id)

        quiz_defs = [
            (
                l3.id,
                "Lesson 01 : Syntax",
                [
                    (
                        "Which Python function displays text on the screen?",
                        ["A. echo()", "B. print()", "C. display()", "D. write()"],
                        1,
                    ),
                    (
                        "Which symbol starts a comment in Python?",
                        ["A. //", "B. --", "C. #", "D. /*"],
                        2,
                    ),
                ],
            ),
            (
                l4.id,
                "Lesson 02 : Variables",
                [
                    (
                        "Which is a valid variable name in Python?",
                        ["A. 2student", "B. student_name", "C. student-name", "D. class"],
                        1,
                    ),
                    (
                        "What value is stored in x after: x = 10 + 5?",
                        ["A. 105", "B. 15", "C. 5", "D. Error"],
                        1,
                    ),
                ],
            ),
            (
                l6.id,
                "Lesson 03 : Functions",
                [
                    (
                        "Which keyword defines a function in Python?",
                        ["A. func", "B. define", "C. def", "D. function"],
                        2,
                    ),
                ],
            ),
            (
                l8.id,
                "Lesson 04 : Conditions",
                [
                    (
                        "Which operator checks if two values are equal in Python?",
                        ["A. =", "B. ==", "C. !=", "D. ==="],
                        1,
                    ),
                ],
            ),
            (
                l9.id,
                "Lesson 05 : Quiz One",
                [
                    (
                        "How many times does 'for i in range(3):' repeat?",
                        ["A. 2 times", "B. 3 times", "C. 4 times", "D. Infinite"],
                        1,
                    ),
                ],
            ),
            (
                l10.id,
                "Lesson 06 : Project one",
                [
                    (
                        "Which function reads text input from the user in CLI apps?",
                        ["A. get()", "B. input()", "C. read()", "D. scan()"],
                        1,
                    ),
                ],
            ),
            (
                l11.id,
                "Lesson 07 : Final Evaluation",
                [
                    (
                        "What is the output of print(len('Kampala'))?",
                        ["A. 6", "B. 7", "C. 8", "D. Kampala"],
                        1,
                    ),
                ],
            ),
        ]

        for lesson_id_val, quiz_title, q_list in quiz_defs:
            quiz = db.query(Quiz).filter(Quiz.title == quiz_title).first()
            if quiz is None:
                quiz = Quiz(lesson_id=lesson_id_val, title=quiz_title)
                db.add(quiz)
                db.flush()
                for prompt_text, options_list, correct_idx in q_list:
                    db.add(
                        Question(
                            quiz_id=quiz.id,
                            prompt=prompt_text,
                            options=options_list,
                            correct_index=correct_idx,
                        )
                    )

        review_courses = [course_1.id, course_2.id, course_3.id]
        for rev_course_id in review_courses:
            existing_revs = (
                db.query(Review).filter(Review.course_id == rev_course_id).count()
            )
            if existing_revs == 0:
                star_distribution = [5, 5, 5, 5, 5, 4, 4, 4, 3, 2]
                for star_val in star_distribution:
                    db.add(
                        Review(
                            course_id=rev_course_id,
                            user_id=demo_user.id,
                            stars=star_val,
                        )
                    )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully.")
