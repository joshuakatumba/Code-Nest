import os
import sys
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from seed import seed_database

seed_database()
client = TestClient(app)


def create_unique_email() -> str:
    return f"student_{uuid.uuid4().hex[:8]}@codenest.ug"


def test_public_plans_and_courses() -> None:
    plans_response = client.get("/api/plans")
    assert plans_response.status_code == 200
    plans = plans_response.json()
    assert len(plans) == 3

    courses_response = client.get("/api/courses")
    assert courses_response.status_code == 200
    courses = courses_response.json()
    assert len(courses) == 3

    level_one_response = client.get("/api/courses?level=1")
    assert level_one_response.status_code == 200
    level_one_courses = level_one_response.json()
    assert len(level_one_courses) == 1
    assert level_one_courses[0]["level"] == 1


def test_course_detail_and_reviews_summary() -> None:
    courses_response = client.get("/api/courses?level=2")
    course_id = courses_response.json()[0]["id"]

    detail_response = client.get(f"/api/courses/{course_id}")
    assert detail_response.status_code == 200
    course_detail = detail_response.json()
    assert course_detail["id"] == course_id
    assert len(course_detail["modules"]) >= 5
    assert course_detail["rating_breakdown"]["total"] > 0

    summary_response = client.get(f"/api/courses/{course_id}/reviews/summary")
    assert summary_response.status_code == 200
    summary_data = summary_response.json()
    assert "avg" in summary_data
    assert "counts" in summary_data


def test_auth_failures_missing_token_bad_password_duplicate_email() -> None:
    unauthenticated_progress = client.get("/api/progress")
    assert unauthenticated_progress.status_code == 401

    unauthenticated_me = client.get("/api/auth/me")
    assert unauthenticated_me.status_code == 401

    email = create_unique_email()
    signup_response = client.post(
        "/api/auth/signup",
        json={"name": "Nakato", "email": email, "password": "password123"},
    )
    assert signup_response.status_code == 201

    duplicate_response = client.post(
        "/api/auth/signup",
        json={"name": "Nakato Two", "email": email, "password": "password123"},
    )
    assert duplicate_response.status_code == 400

    bad_password_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )
    assert bad_password_response.status_code == 401


def test_full_student_journey_and_duplicate_enrollment() -> None:
    email = create_unique_email()
    signup_response = client.post(
        "/api/auth/signup",
        json={"name": "Mukasa", "email": email, "password": "password123"},
    )
    assert signup_response.status_code == 201
    signup_data = signup_response.json()
    assert "token" in signup_data
    assert "password_hash" not in signup_data["user"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email

    courses = client.get("/api/courses?level=2").json()
    course_id = courses[0]["id"]

    first_enroll = client.post(f"/api/courses/{course_id}/enroll", headers=headers)
    assert first_enroll.status_code == 201
    first_enrollment_id = first_enroll.json()["id"]

    duplicate_enroll = client.post(f"/api/courses/{course_id}/enroll", headers=headers)
    assert duplicate_enroll.status_code == 201
    assert duplicate_enroll.json()["id"] == first_enrollment_id

    initial_progress = client.get("/api/progress", headers=headers)
    assert initial_progress.status_code == 200
    progress_json = initial_progress.json()
    initial_completed = progress_json["completed"]
    initial_competency_percent = progress_json["competencies"][0]["percent"]
    first_lesson_id = progress_json["modules"][0]["lessons"][0]["id"]

    complete_response = client.post(
        f"/api/lessons/{first_lesson_id}/complete", headers=headers
    )
    assert complete_response.status_code == 200
    complete_data = complete_response.json()
    assert complete_data["completed"] is True
    assert complete_data["completed_count"] == initial_completed + 1
    assert (
        complete_data["competencies"][0]["percent"] == initial_competency_percent + 5
    )

    quiz_id = progress_json["quizzes"][0]["id"]
    quiz_detail = client.get(f"/api/quizzes/{quiz_id}")
    assert quiz_detail.status_code == 200
    quiz_questions = quiz_detail.json()["questions"]
    assert len(quiz_questions) > 0
    assert "correct_index" not in quiz_questions[0]

    submit_response = client.post(
        f"/api/quizzes/{quiz_id}/submit",
        headers=headers,
        json={"answers": [1, 2]},
    )
    assert submit_response.status_code == 200
    submit_data = submit_response.json()
    assert submit_data["score"] == 2
    assert submit_data["total"] == 2


def test_projects_plan_subscribe_and_newsletter() -> None:
    email = create_unique_email()
    signup_response = client.post(
        "/api/auth/signup",
        json={"name": "Otim", "email": email, "password": "password123"},
    )
    token = signup_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    projects_response = client.get("/api/projects", headers=headers)
    assert projects_response.status_code == 200
    assert len(projects_response.json()) >= 2

    plans = client.get("/api/plans").json()
    target_plan_id = plans[1]["id"]
    subscribe_response = client.post(
        "/api/plans/subscribe",
        headers=headers,
        json={"plan_id": target_plan_id},
    )
    assert subscribe_response.status_code == 200
    assert subscribe_response.json()["plan_id"] == target_plan_id

    newsletter_response = client.post(
        "/api/newsletter",
        json={"email": f"news_{uuid.uuid4().hex[:6]}@codenest.ug"},
    )
    assert newsletter_response.status_code == 201



def test_dynamic_video_uploads_reviews_projects_and_access_code() -> None:
    email = create_unique_email()
    signup_response = client.post(
        "/api/auth/signup",
        json={"name": "Wasswa", "email": email, "password": "password123"},
    )
    assert signup_response.status_code == 201
    token = signup_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Enroll via access code
    code_enroll = client.post(
        "/api/courses/enroll-code",
        headers=headers,
        json={"access_code": "SCRATCH1"},
    )
    assert code_enroll.status_code == 201
    scratch_course_id = code_enroll.json()["course_id"]

    # Upload video to course
    fake_mp4 = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom"
    course_video_res = client.post(
        f"/api/courses/{scratch_course_id}/video",
        headers={
            **headers,
            "Content-Type": "video/mp4",
            "X-Filename": "scratch_demo.mp4",
        },
        content=fake_mp4,
    )
    assert course_video_res.status_code == 200
    assert course_video_res.json()["video_url"].startswith("/uploads/videos/")

    # Create a new lesson on the course and upload a lesson video from the course side
    course_detail = course_video_res.json()
    first_module_id = course_detail["modules"][0]["id"]
    new_lesson_res = client.post(
        f"/api/courses/{scratch_course_id}/lessons",
        headers=headers,
        json={
            "module_id": first_module_id,
            "title": "2. Custom Uploaded Sprite Lesson",
            "duration_label": "15:00",
        },
    )
    assert new_lesson_res.status_code == 201
    new_lesson_id = new_lesson_res.json()["id"]

    lesson_video_res = client.post(
        f"/api/courses/{scratch_course_id}/lessons/{new_lesson_id}/video",
        headers={
            **headers,
            "Content-Type": "video/mp4",
            "X-Filename": "sprite_lesson.mp4",
        },
        content=fake_mp4,
    )
    assert lesson_video_res.status_code == 200
    assert lesson_video_res.json()["video_url"].startswith("/uploads/videos/")

    # Submit a 5-star review
    review_res = client.post(
        f"/api/courses/{scratch_course_id}/reviews",
        headers=headers,
        json={"stars": 5},
    )
    assert review_res.status_code == 201
    assert review_res.json()["total"] >= 1

    # Create a custom student project
    project_res = client.post(
        "/api/projects",
        headers=headers,
        json={
            "course_id": scratch_course_id,
            "title": "Kampala Traffic Light Simulator",
            "description": "Scratch traffic control simulation.",
            "preview_key": "scratch",
        },
    )
    assert project_res.status_code == 201
    assert project_res.json()["title"] == "Kampala Traffic Light Simulator"

    # Check course-filtered progress
    progress_res = client.get(
        f"/api/progress?course_id={scratch_course_id}",
        headers=headers,
    )
    assert progress_res.status_code == 200
    progress_body = progress_res.json()
    assert progress_body["active_course_id"] == scratch_course_id
    assert len(progress_body["enrolled_courses"]) >= 1


def test_security_and_integrity_guards() -> None:
    email = create_unique_email()
    signup_response = client.post(
        "/api/auth/signup",
        json={"name": "Namono", "email": email, "password": "password123"},
    )
    assert signup_response.status_code == 201
    token = signup_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    courses = client.get("/api/courses").json()
    course_id = courses[0]["id"]

    # Reject non-video bytes
    bad_upload = client.post(
        f"/api/courses/{course_id}/video",
        headers={**headers, "Content-Type": "video/mp4", "X-Filename": "evil.mp4"},
        content=b"<html><script>alert(1)</script></html>",
    )
    assert bad_upload.status_code == 400

    # Reject unsafe video_url scheme
    bad_url = client.post(
        f"/api/courses/{course_id}/video",
        headers=headers,
        json={"video_url": "javascript:alert(1)"},
    )
    assert bad_url.status_code == 400

    # Review upsert: submitting twice as the same user does not inflate review count
    first_review = client.post(
        f"/api/courses/{course_id}/reviews",
        headers=headers,
        json={"stars": 5},
    )
    assert first_review.status_code == 201
    total_after_first = first_review.json()["total"]

    second_review = client.post(
        f"/api/courses/{course_id}/reviews",
        headers=headers,
        json={"stars": 4},
    )
    assert second_review.status_code == 201
    assert second_review.json()["total"] == total_after_first

    # Quiz competency farming guard
    progress_before = client.get("/api/progress", headers=headers).json()
    quiz_id = progress_before["quizzes"][0]["id"]
    first_submit = client.post(
        f"/api/quizzes/{quiz_id}/submit",
        headers=headers,
        json={"answers": [1, 2]},
    )
    assert first_submit.status_code == 200
    comp_after_first = client.get("/api/progress", headers=headers).json()["competencies"]

    second_submit = client.post(
        f"/api/quizzes/{quiz_id}/submit",
        headers=headers,
        json={"answers": [1, 2]},
    )
    assert second_submit.status_code == 200
    comp_after_second = client.get("/api/progress", headers=headers).json()["competencies"]
    assert comp_after_second == comp_after_first

    # Nonexistent course_id returns 404 on progress and project creation
    missing_progress = client.get("/api/progress?course_id=999999", headers=headers)
    assert missing_progress.status_code == 404

    missing_project_course = client.post(
        "/api/projects",
        headers=headers,
        json={
            "course_id": 999999,
            "title": "Invalid Course Project",
            "description": "Should return 404",
        },
    )
    assert missing_project_course.status_code == 404
