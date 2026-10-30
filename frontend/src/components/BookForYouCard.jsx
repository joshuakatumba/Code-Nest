import React from 'react';
import { Link } from 'react-router-dom';

export default function BookForYouCard() {
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
          <p>All Benefits of PLUS</p>
          <span>$24</span>
        </Link>
      </div>
    </div>
  );
}
