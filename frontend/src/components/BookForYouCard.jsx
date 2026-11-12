import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function BookForYouCard() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api
      .getCourses()
      .then((data) => {
        setCourses(data.slice(0, 2));
      })
      .catch(() => {});
  }, []);

  if (courses.length === 0) {
    return (
      <div className="book-card">
        <div className="book-header">
          <h4>Book for you</h4>
          <i className="fa-regular fa-calendar book-calendar-icon"></i>
        </div>
        <div className="book-grid">
          <Link to="/pricing" className="mini-promo-card">
            <img src="/images/promo-1.svg" alt="Plus 1" />
            <p>All Benefits of PLUS</p>
            <span>$24</span>
          </Link>
          <Link to="/pricing" className="mini-promo-card">
            <img src="/images/promo-2.svg" alt="Plus 2" />
            <p>Corporate Team Plan</p>
            <span>$32</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="book-card">
      <div className="book-header">
        <h4>Book for you</h4>
        <i className="fa-regular fa-calendar book-calendar-icon"></i>
      </div>
      <div className="book-grid">
        {courses.map((course, i) => (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="mini-promo-card"
          >
            <img
              src={i % 2 === 0 ? '/images/promo-1.svg' : '/images/promo-2.svg'}
              alt={course.title}
            />
            <p>{course.title}</p>
            <span>${course.price_usd}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
