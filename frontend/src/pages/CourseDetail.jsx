import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Footer from '../components/Footer.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    const courseId = id || 2;
    api
      .getCourseDetail(courseId)
      .then((data) => {
        setCourse(data);
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Failed to load course details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(true);
    setErrorMessage('');
    try {
      await api.enrollCourse(course.id);
      navigate('/progress');
    } catch (error) {
      setErrorMessage(error.message || 'Could not enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading course details...</div>;
  }

  if (!course) {
    return (
      <main id="screen-detail">
        <div className="status-banner error">{errorMessage || 'Course not found'}</div>
        <Footer />
      </main>
    );
  }

  const breakdown = course.rating_breakdown || {
    avg: course.rating_avg || 4.0,
    counts: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
    total: 10,
  };
  const totalReviews = breakdown.total || 1;
  const starLevels = [5, 4, 3, 2, 1];
  const discountPercent =
    course.old_price_usd > course.price_usd
      ? Math.round(((course.old_price_usd - course.price_usd) / course.old_price_usd) * 100)
      : 50;
  const moduleCount = course.modules && course.modules.length > 0 ? course.modules.length : 32;
  const bannerLabel =
    course.level === 1 ? 'Scratch' : course.level === 3 ? 'Tkinter' : 'Python';

  return (
    <main id="screen-detail">
      <div className="course-hero-banner">
        <svg
          className="python-banner-art"
          viewBox="0 0 1200 360"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#061729" />
              <stop offset="100%" stopColor="#0b2948" />
            </linearGradient>
          </defs>
          <rect width="1200" height="360" fill="url(#bgGrad)" />
          <circle cx="480" cy="140" r="14" fill="#FDE047" opacity="0.85" />
          <circle cx="720" cy="210" r="10" fill="#FDE047" opacity="0.85" />
          <circle cx="560" cy="240" r="7" fill="#FDE047" opacity="0.6" />
          <polygon points="80,220 220,150 360,220 220,290" fill="#FACC15" />
          <polygon points="80,220 220,290 220,315 80,245" fill="#EAB308" />
          <polygon points="360,220 220,290 220,315 360,245" fill="#CA8A04" />
          <path
            d="M165,160 C165,110 230,110 230,150 L230,190 C230,210 190,210 190,190 L190,155"
            stroke="#38BDF8"
            strokeWidth="34"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M255,195 C255,245 190,245 190,205 L190,165"
            stroke="#FACC15"
            strokeWidth="34"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M470,360 C490,280 520,240 590,240 C650,240 690,280 650,360"
            stroke="#0284C7"
            strokeWidth="64"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="600" cy="235" rx="68" ry="50" fill="#0284C7" />
          <circle cx="640" cy="225" r="10" fill="#111" />
          <circle cx="643" cy="222" r="4" fill="#fff" />
          <path
            d="M668,242 Q710,245 725,230 M705,240 L725,252"
            stroke="#F43F5E"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <polygon points="820,160 960,95 1080,155 940,220" fill="#38BDF8" />
          <rect
            x="880"
            y="50"
            width="160"
            height="110"
            rx="14"
            transform="skewY(22)"
            fill="#0284C7"
            stroke="#38BDF8"
            strokeWidth="8"
          />
          <text
            x="905"
            y="115"
            transform="skewY(22)"
            fill="#fff"
            fontSize="30"
            fontWeight="800"
            fontFamily="Poppins"
          >
            {bannerLabel}
          </text>
        </svg>
      </div>

      {errorMessage && <div className="status-banner error">{errorMessage}</div>}

      <div className="course-detail-layout">
        <div>
          <button type="button" className="btn-overview-tab">
            Overview
          </button>

          <div className="course-detail-header">
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <div className="course-detail-meta">
              <span>{course.tech}</span>
              <span>{course.grade_range}</span>
              <span>Builds: {course.builds}</span>
            </div>
          </div>

          {course.modules && course.modules.length > 0 && (
            <div className="course-modules-preview">
              <h3>Curriculum Modules</h3>
              {course.modules.map((module) => (
                <div key={module.id} className="accordion-item">
                  <div className="acc-top">
                    <span>{module.title}</span>
                    <span>{module.duration_label}</span>
                  </div>
                  <div className="acc-sub">
                    <span>
                      <i className="fa-regular fa-clock"></i> {module.duration_label}
                    </span>
                    <span>
                      <i className="fa-solid fa-book-open"></i> {module.lessons.length} Lessons
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rating-panel">
            <div className="rating-score-box">
              <h4>{breakdown.avg} out of 5</h4>
              <div className="stars-row">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <span>Top Rating</span>
            </div>

            <div className="rating-bars">
              {starLevels.map((star) => {
                const count = breakdown.counts[String(star)] || 0;
                const percent = Math.round((count / totalReviews) * 100);
                const label = star === 1 ? '1 Star' : `${star} Stars`;
                return (
                  <div key={star} className="bar-row">
                    <span>{label}</span>
                    <ProgressBar
                      percent={percent}
                      trackClass="bar-track"
                      fillClass="bar-fill"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="course-checkout-card">
          <div className="checkout-thumb">
            <svg viewBox="0 0 400 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="200" fill="#07192B" />
              <circle cx="140" cy="175" r="45" fill="#0284C7" />
              <circle cx="160" cy="165" r="6" fill="#fff" />
              <polygon points="220,135 310,95 380,130 290,170" fill="#FACC15" />
              <rect
                x="255"
                y="15"
                width="95"
                height="65"
                rx="8"
                transform="skewY(22)"
                fill="#0284C7"
                stroke="#38BDF8"
                strokeWidth="5"
              />
              <text
                x="268"
                y="55"
                transform="skewY(22)"
                fill="#fff"
                fontSize="16"
                fontWeight="700"
              >
                {bannerLabel}
              </text>
            </svg>
          </div>

          <div className="checkout-price-row">
            <span className="price-now">${course.price_usd}</span>
            <span className="price-old">${course.old_price_usd}</span>
            <span className="price-discount">{discountPercent}% Off</span>
          </div>

          <div className="time-left">11 hours left at this price</div>

          <button
            type="button"
            className="btn-buy-now"
            onClick={handleBuyNow}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Buy Now'}
          </button>

          <div className="checkout-divider"></div>

          <h4 className="included-title">This Course included</h4>
          <ul className="included-list">
            <li>
              <i className="fa-solid fa-sun"></i> Money Back Guarantee
            </li>
            <li>
              <i className="fa-solid fa-camera"></i> Access on all devices
            </li>
            <li>
              <i className="fa-solid fa-file-invoice"></i> Certification of completion
            </li>
            <li>
              <i className="fa-solid fa-chart-simple"></i> {moduleCount} Modules
            </li>
          </ul>

          <div className="checkout-divider"></div>

          <h4 className="included-title">Training 5 or more people</h4>
          <p className="training-text">
            Empower your school computer club or classroom in Uganda with CodeNest group packages,
            teacher dashboards, and CBC-aligned project assessments.
          </p>

          <div className="checkout-divider"></div>

          <h4 className="share-title">Share this course</h4>
          <div className="social-row">
            <a href="#share" className="social-icon yt" aria-label="Share on YouTube">
              <i className="fa-brands fa-youtube"></i>
            </a>
            <a href="#share" className="social-icon" aria-label="Share on Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#share" className="social-icon" aria-label="Share on Telegram">
              <i className="fa-brands fa-telegram"></i>
            </a>
            <a href="#share" className="social-icon" aria-label="Share on WhatsApp">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </aside>
      </div>

      <Footer />
    </main>
  );
}
