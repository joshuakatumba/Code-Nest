import React from 'react';
import { Link } from 'react-router-dom';

export default function CourseCard({ course, isEnrolled = false }) {
  const isScratch = course.banner_key === 'scratch' || course.level === 1;
  const isTkinter = course.banner_key === 'tkinter' || course.level === 3;

  return (
    <div className="course-card">
      <div>
        {isScratch ? (
          <div className="course-banner-box course-banner-scratch">
            <div className="scratch-banner-title">Creative Coding With Scratch!</div>
            <div className="scratch-banner-sub">
              BUILD YOUR OWN GAMES! | FUN FOR KIDS AGES {course.age_range}
            </div>
            <div className="scratch-banner-split">
              <div className="scratch-blocks-card">
                <div className="scratch-block-amber">when clicked</div>
                <div className="scratch-block-yellow">forever</div>
                <div className="scratch-block-blue">move 10 steps</div>
              </div>
              <div className="scratch-stage-card">
                <span className="scratch-stage-label">LEVEL {course.level}</span>
                <i className="fa-solid fa-cat scratch-cat-icon"></i>
                <div className="scratch-ground-bar"></div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`course-banner-box ${
              isTkinter ? 'course-banner-tkinter' : 'course-banner-python'
            }`}
          >
            <div className="python-banner-title">
              {isTkinter ? 'DESKTOP APPS WITH TKINTER' : 'LEARN TEXT-BASED PYTHON'}
            </div>
            <div className="python-banner-split">
              <img
                src="/images/student-coding.svg"
                alt="Student coding"
                className="python-student-img"
              />
              {isTkinter ? (
                <div className="python-code-box">
                  <div className="code-line-blue">import tkinter as tk</div>
                  <div>app = tk.Tk()</div>
                  <div className="code-line-yellow">def save_canteen_csv():</div>
                  <div className="code-line-indent">writer.writerow(sale)</div>
                  <div className="code-line-indent">app.mainloop()</div>
                </div>
              ) : (
                <div className="python-code-box">
                  <div className="code-line-blue">import turtle</div>
                  <div>t = turtle.Turtle()</div>
                  <div className="code-line-yellow">for i in range(5):</div>
                  <div className="code-line-indent">t.forward(100)</div>
                  <div className="code-line-indent">t.right(144)</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="course-title-row">
          <h4>{course.title}</h4>
          <span className="badge-level">Level {course.level}</span>
        </div>
        <p className="course-desc">{course.description}</p>
      </div>

      <div className="course-card-actions">
        <Link to={`/courses/${course.id}`} className="btn-enroll">
          {isEnrolled ? 'Continue Course' : 'Enroll My Child'}
        </Link>
      </div>
    </div>
  );
}
