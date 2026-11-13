import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, resolveMediaUrl } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Footer from '../components/Footer.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [openModuleId, setOpenModuleId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [uploadingLessonId, setUploadingLessonId] = useState(null);
  const [uploadingCourseVideo, setUploadingCourseVideo] = useState(false);

  const [newLessonModuleId, setNewLessonModuleId] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('25:00');
  const [newLessonFile, setNewLessonFile] = useState(null);
  const [addingLesson, setAddingLesson] = useState(false);

  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    const courseId = id || 2;
    api
      .getCourseDetail(courseId)
      .then((data) => {
        setCourse(data);
        const firstModule = data.modules?.[0];
        if (firstModule) {
          setOpenModuleId(firstModule.id);
          setNewLessonModuleId(String(firstModule.id));
        }
        const firstLessonVideo = firstModule?.lessons?.[0]?.video_url;
        setPreviewVideoUrl(
          data.video_url || firstLessonVideo || '/uploads/videos/python-lesson.mp4'
        );
        setPreviewTitle(data.title);
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Failed to load course details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!user || !course) {
      setIsEnrolled(false);
      return;
    }
    api
      .getProgress(course.id)
      .then((progressData) => {
        const matched = (progressData.enrollments || []).some(
          (item) => item.course_id === course.id
        );
        setIsEnrolled(matched);
      })
      .catch(() => {});
  }, [user, course?.id]);

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isEnrolled) {
      navigate(`/progress?course=${course.id}`);
      return;
    }
    setEnrolling(true);
    setErrorMessage('');
    try {
      await api.enrollCourse(course.id);
      navigate(`/progress?course=${course.id}`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCourseVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !course) {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    setUploadingCourseVideo(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updated = await api.uploadCourseVideo(course.id, file);
      setCourse(updated);
      setPreviewVideoUrl(updated.video_url);
      setPreviewTitle(updated.title);
      setStatusMessage(`Uploaded course video "${file.name}".`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not upload course video');
    } finally {
      setUploadingCourseVideo(false);
    }
  };

  const handleLessonVideoUpload = async (lessonId, file) => {
    if (!file || !course) {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    setUploadingLessonId(lessonId);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updatedLesson = await api.uploadCourseLessonVideo(course.id, lessonId, file);
      const refreshedCourse = await api.getCourseDetail(course.id);
      setCourse(refreshedCourse);
      setPreviewVideoUrl(updatedLesson.video_url);
      setPreviewTitle(updatedLesson.title);
      setStatusMessage(`Uploaded video "${file.name}" for lesson "${updatedLesson.title}".`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not upload lesson video');
    } finally {
      setUploadingLessonId(null);
    }
  };

  const handleCreateLessonWithVideo = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newLessonTitle.trim() || !newLessonModuleId) {
      return;
    }
    setAddingLesson(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const createdLesson = await api.createLesson(course.id, {
        module_id: Number(newLessonModuleId),
        title: newLessonTitle.trim(),
        duration_label: newLessonDuration.trim() || '20:00',
      });
      if (newLessonFile) {
        const uploadedLesson = await api.uploadCourseLessonVideo(
          course.id,
          createdLesson.id,
          newLessonFile
        );
        setPreviewVideoUrl(uploadedLesson.video_url);
        setPreviewTitle(uploadedLesson.title);
      }
      const refreshedCourse = await api.getCourseDetail(course.id);
      setCourse(refreshedCourse);
      setOpenModuleId(Number(newLessonModuleId));
      setNewLessonTitle('');
      setNewLessonFile(null);
      setStatusMessage(`Added lesson "${createdLesson.title}" to curriculum.`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not create lesson');
    } finally {
      setAddingLesson(false);
    }
  };

  const handleSubmitReview = async (starsValue) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedStars(starsValue);
    setSubmittingReview(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updatedSummary = await api.submitCourseReview(course.id, starsValue);
      setCourse((prev) => ({
        ...prev,
        rating_avg: updatedSummary.avg,
        rating_breakdown: updatedSummary,
      }));
      setStatusMessage(`Thank you! Your ${starsValue}-star rating has been recorded.`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not submit rating');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShareCourse = (platformName) => {
    const shareUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setStatusMessage(`Course link copied for sharing on ${platformName}: ${shareUrl}`);
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
  const moduleCount = course.modules && course.modules.length > 0 ? course.modules.length : 1;
  const bannerLabel =
    course.level === 1 ? 'Scratch' : course.level === 3 ? 'Tkinter' : 'Python';
  const bannerAccent =
    course.level === 1 ? '#F97316' : course.level === 3 ? '#10B981' : '#0284C7';
  const activeVideoSrc = resolveMediaUrl(previewVideoUrl);

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
            stroke={bannerAccent}
            strokeWidth="64"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="600" cy="235" rx="68" ry="50" fill={bannerAccent} />
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
            fill={bannerAccent}
            stroke="#38BDF8"
            strokeWidth="8"
          />
          <text
            x="900"
            y="115"
            transform="skewY(22)"
            fill="#fff"
            fontSize="28"
            fontWeight="800"
            fontFamily="Poppins"
          >
            {bannerLabel}
          </text>
        </svg>
      </div>

      {errorMessage && <div className="status-banner error">{errorMessage}</div>}
      {statusMessage && <div className="status-banner info">{statusMessage}</div>}

      <div className="course-detail-layout">
        <div>
          <div className="detail-tabs-row">
            <button
              type="button"
              className={`btn-overview-tab ${activeTab === 'overview' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`btn-overview-tab ${activeTab === 'curriculum' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum
            </button>
            <button
              type="button"
              className={`btn-overview-tab ${activeTab === 'reviews' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          <div className="course-detail-header">
            <h1>{course.title}</h1>
            <p>{course.description}</p>
          </div>

          {(activeTab === 'overview' || activeTab === 'curriculum') &&
            course.modules &&
            course.modules.length > 0 && (
              <div className="course-modules-preview">
                {course.modules.map((module) => {
                  const isOpen = openModuleId === module.id;
                  return (
                    <div
                      key={module.id}
                      className={`accordion-item ${isOpen ? 'active' : ''}`}
                    >
                      <div
                        className={`acc-top ${isOpen ? 'acc-ActiveTitle' : ''}`}
                        onClick={() =>
                          setOpenModuleId((prev) => (prev === module.id ? null : module.id))
                        }
                      >
                        <span>{module.title}</span>
                        <span>
                          {module.duration_label}{' '}
                          <i
                            className={`fa-solid ${
                              isOpen ? 'fa-chevron-up' : 'fa-chevron-down'
                            } acc-chevron-icon`}
                          ></i>
                        </span>
                      </div>
                      <div className="acc-sub">
                        <span>
                          <i className="fa-regular fa-clock"></i> {module.duration_label}
                        </span>
                        <span>
                          <i className="fa-solid fa-book-open"></i> {module.lessons.length} Lessons
                        </span>
                      </div>

                      {isOpen && (
                        <div className="lesson-sublist">
                          {module.lessons.map((lesson) => {
                            const isUploadingThis = uploadingLessonId === lesson.id;
                            const isPlayingThis =
                              previewVideoUrl === lesson.video_url &&
                              previewTitle === lesson.title;
                            return (
                              <div
                                key={lesson.id}
                                className={`lesson-row detail-lesson-row ${
                                  isPlayingThis ? 'active-lesson' : ''
                                }`}
                              >
                                <div className="detail-lesson-info">
                                  <button
                                    type="button"
                                    className="lesson-play-trigger"
                                    onClick={() => {
                                      setPreviewVideoUrl(
                                        lesson.video_url || course.video_url
                                      );
                                      setPreviewTitle(lesson.title);
                                    }}
                                  >
                                    <i className="fa-solid fa-circle-play"></i> {lesson.title}
                                  </button>
                                  <span className="lesson-duration-tag">
                                    {lesson.duration_label}
                                  </span>
                                </div>

                                {user && (
                                  <div className="detail-lesson-actions">
                                    <label className="btn-mark-complete upload-lesson-btn">
                                      <i className="fa-solid fa-upload"></i>{' '}
                                      {isUploadingThis ? 'Uploading...' : 'Upload Video'}
                                      <input
                                        type="file"
                                        accept="video/mp4,video/webm,video/ogg,video/*"
                                        disabled={isUploadingThis}
                                        onChange={(event) => {
                                          const file = event.target.files?.[0];
                                          event.target.value = '';
                                          if (file) {
                                            handleLessonVideoUpload(lesson.id, file);
                                          }
                                        }}
                                        hidden
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {user && (
                  <form
                    className="add-lesson-card"
                    onSubmit={handleCreateLessonWithVideo}
                  >
                    <h4>Add New Lesson &amp; Upload Video</h4>
                    <div className="add-lesson-grid">
                      <select
                        aria-label="Target Module"
                        className="form-input"
                        value={newLessonModuleId}
                        onChange={(event) => setNewLessonModuleId(event.target.value)}
                      >
                        {course.modules.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Lesson Title"
                        value={newLessonTitle}
                        onChange={(event) => setNewLessonTitle(event.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Duration"
                        value={newLessonDuration}
                        onChange={(event) => setNewLessonDuration(event.target.value)}
                      />
                    </div>
                    <div className="add-lesson-bottom">
                      <label className="btn-details upload-card-label">
                        <i className="fa-solid fa-file-video"></i>{' '}
                        {newLessonFile ? newLessonFile.name : 'Choose Lesson Video File'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/*"
                          onChange={(event) =>
                            setNewLessonFile(event.target.files?.[0] || null)
                          }
                          hidden
                        />
                      </label>
                      <button
                        type="submit"
                        className="btn-enroll"
                        disabled={addingLesson}
                      >
                        {addingLesson ? 'Saving Lesson...' : 'Add Lesson'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          {(activeTab === 'overview' || activeTab === 'reviews') && (
            <div className="rating-panel-wrapper">
              <div className="rating-panel">
                <div className="rating-score-box">
                  <h4>{breakdown.avg} out of 5</h4>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((starNum) => {
                      const isFull = breakdown.avg >= starNum - 0.25;
                      const isHalf = !isFull && breakdown.avg >= starNum - 0.75;
                      return (
                        <i
                          key={starNum}
                          className={
                            isFull
                              ? 'fa-solid fa-star'
                              : isHalf
                              ? 'fa-solid fa-star-half-stroke'
                              : 'fa-regular fa-star'
                          }
                        ></i>
                      );
                    })}
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

              {user && (
                <div className="rate-course-bar">
                  <span>Rate this course:</span>
                  <div className="rate-star-buttons">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        className={`btn-star-rate ${
                          selectedStars >= starValue ? 'active' : ''
                        }`}
                        disabled={submittingReview}
                        onClick={() => handleSubmitReview(starValue)}
                      >
                        <i className="fa-solid fa-star"></i> {starValue}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="course-checkout-card">
          <div className="checkout-thumb">
            <video
              key={activeVideoSrc}
              src={activeVideoSrc}
              controls
              className="checkout-video-player"
            >
              Your browser does not support HTML5 video.
            </video>
          </div>

          {user && (
            <div className="checkout-video-meta">
              <span className="playing-now-label">
                <i className="fa-solid fa-film"></i> {previewTitle || course.title}
              </span>
              <label className="btn-mark-complete upload-lesson-btn">
                <i className="fa-solid fa-cloud-arrow-up"></i>{' '}
                {uploadingCourseVideo ? 'Uploading...' : 'Upload Video'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/*"
                  disabled={uploadingCourseVideo}
                  onChange={handleCourseVideoUpload}
                  hidden
                />
              </label>
            </div>
          )}

          <div className="checkout-price-row">
            <span className="price-now">${course.price_usd}</span>
            <span className="price-old">${course.old_price_usd}</span>
            <span className="price-discount">{discountPercent}% Off</span>
          </div>

          <div className="time-left">
            {isEnrolled ? 'You are enrolled in this course' : '11 hours left at this price'}
          </div>

          <button
            type="button"
            className="btn-buy-now"
            onClick={handleBuyNow}
            disabled={enrolling}
          >
            {enrolling
              ? 'Enrolling...'
              : isEnrolled
              ? 'Go to Classroom'
              : 'Buy Now'}
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
            <button
              type="button"
              className="social-icon yt"
              aria-label="Share on YouTube"
              onClick={() => handleShareCourse('YouTube')}
            >
              <i className="fa-brands fa-youtube"></i>
            </button>
            <button
              type="button"
              className="social-icon"
              aria-label="Share on Instagram"
              onClick={() => handleShareCourse('Instagram')}
            >
              <i className="fa-brands fa-instagram"></i>
            </button>
            <button
              type="button"
              className="social-icon"
              aria-label="Share on Telegram"
              onClick={() => handleShareCourse('Telegram')}
            >
              <i className="fa-brands fa-telegram"></i>
            </button>
            <button
              type="button"
              className="social-icon"
              aria-label="Share on WhatsApp"
              onClick={() => handleShareCourse('WhatsApp')}
            >
              <i className="fa-brands fa-whatsapp"></i>
            </button>
          </div>
        </aside>
      </div>

      <Footer />
    </main>
  );
}
