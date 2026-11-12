import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, resolveMediaUrl } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Footer from '../components/Footer.jsx';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [enrollingCode, setEnrollingCode] = useState(false);

  const [showInstructorPanel, setShowInstructorPanel] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    api
      .getCourses()
      .then((data) => {
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(String(data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const primaryVideoUrl = resolveMediaUrl(
    courses[1]?.video_url || courses[0]?.video_url || '/uploads/videos/python-lesson.mp4'
  );

  const handleEnrollByCode = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrollingCode(true);
    try {
      const enrollment = await api.enrollByCode(accessCode);
      setStatusMessage('Access code accepted. Redirecting to classroom...');
      navigate(`/progress?course=${enrollment.course_id}`);
    } catch (error) {
      setErrorMessage(error.message || 'Invalid access code');
    } finally {
      setEnrollingCode(false);
    }
  };

  const handleQuickVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCourseId) {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    setUploadingVideo(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updatedCourse = await api.uploadCourseVideo(Number(selectedCourseId), file);
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === updatedCourse.id ? updatedCourse : course
        )
      );
      setStatusMessage(`Uploaded video "${file.name}" to ${updatedCourse.title}.`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not upload course video');
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <main id="screen-home">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1>
              <span className="hero-title-line">
                Empowering Teenagers
                <svg
                  className="hero-heading-sparkle"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <line x1="18" y1="2" x2="18" y2="12" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="18" y1="24" x2="18" y2="34" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="2" y1="18" x2="12" y2="18" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="18" x2="34" y2="18" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              with Practical, Offline
              <br />
              Coding Skills.
            </h1>
            <p>
              CodeNest helps teenagers aged 12 to 17 learn coding through practical projects,
              even where internet access is limited.
            </p>
            <div className="home-hero-actions">
              <Link
                to={user ? '/courses' : '/signup'}
                className="btn-hero-join"
              >
                Join for free
              </Link>
              <button
                type="button"
                className="btn-hero-watch"
                onClick={() => setShowIntroVideo((prev) => !prev)}
              >
                <span className="watch-play-circle">
                  <i className={`fa-solid ${showIntroVideo ? 'fa-pause' : 'fa-play'}`}></i>
                </span>
                <span>{showIntroVideo ? 'Hide intro video' : 'Watch how it works'}</span>
              </button>
            </div>
          </div>

          <div className="home-hero-visual">
            {showIntroVideo ? (
              <div className="home-hero-video-card">
                <video
                  src={primaryVideoUrl}
                  controls
                  autoPlay
                  className="home-hero-video-player"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>
            ) : (
              <img
                src="/images/home/hero-illustration.png"
                alt="Teenager learning practical coding skills at desk"
                className="home-hero-illustration-img"
              />
            )}
          </div>
        </div>
        <svg
          className="home-hero-curve-svg"
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M0,0 Q720,130 1440,0 L1440,130 L0,130 Z" fill="#FFFFFF" />
        </svg>
      </section>

      <section className="home-platform-section">
        <h2 className="home-section-heading">
          All-In-One <span>Teaching Platform.</span>
        </h2>
        <p className="home-section-sub">
          A clear path for teenagers to move from first lines of code to real projects. Each level
          builds on the last.
        </p>

        <div className="home-platform-grid">
          <div className="home-platform-card" onClick={() => navigate('/courses')}>
            <div className="platform-icon-circle indigo">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <h3>
              Online resources
              <br />
              at your comfort
            </h3>
            <p>
              Learn python and programming with quick quizzes and fun challenges as you build real
              projects
            </p>
          </div>

          <div className="home-platform-card" onClick={() => navigate('/pricing')}>
            <div className="platform-icon-circle teal">
              <i className="fa-regular fa-calendar-days"></i>
            </div>
            <h3>
              Easy Scheduling &amp;
              <br />
              Attendance Tracking
            </h3>
            <p>
              Schedule and reserve online classrooms for learners as they are guided by the best
              tutors in the programming space
            </p>
          </div>

          <div className="home-platform-card" onClick={() => navigate('/progress')}>
            <div className="platform-icon-circle cyan">
              <i className="fa-solid fa-users"></i>
            </div>
            <h3>Student Tracking</h3>
            <p>
              Analyze and rack progress with rankings and challenges
            </p>
          </div>
        </div>
      </section>

      <section className="home-what-section" id="what-is-codenest">
        <h2 className="home-section-heading">
          What is <span>CodeNest?</span>
        </h2>
        <p className="home-section-sub wide">
          CodeNest is a platform that allows educators to create online classes whereby they can
          store the course materials online; manage assignments, quizzes and exams; monitor due
          dates; grade results and provide students with feedback all in one place.
        </p>

        {errorMessage && <div className="status-banner error">{errorMessage}</div>}
        {statusMessage && <div className="status-banner info">{statusMessage}</div>}

        <div className="home-role-grid">
          <button
            type="button"
            className="home-role-photo-btn"
            onClick={() => setShowInstructorPanel((prev) => !prev)}
            aria-label="For Instructors: Start a class today"
          >
            <img
              src="/images/home/instructor-bg.png"
              alt="For Instructors - Start a class today"
              className="home-role-photo-img"
            />
          </button>

          <button
            type="button"
            className="home-role-photo-btn"
            onClick={() => setShowAccessCodeForm((prev) => !prev)}
            aria-label="For Students: Enter access code"
          >
            <img
              src="/images/home/student-bg.png"
              alt="For Students - Enter access code"
              className="home-role-photo-img"
            />
          </button>
        </div>

        {showInstructorPanel && (
          <div className="home-interactive-drawer">
            <div className="drawer-header">
              <h4>Instructor Course &amp; Video Upload Studio</h4>
              <button
                type="button"
                className="btn-details"
                onClick={() => setShowInstructorPanel(false)}
              >
                Close
              </button>
            </div>
            <p className="drawer-sub">
              Select a course below to upload a new lesson/promo video directly, or open the course
              detail page to manage modules and lessons.
            </p>
            <div className="drawer-controls-row">
              <select
                aria-label="Select course for video upload"
                className="form-input drawer-select"
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              <label className="btn-enroll upload-label-btn">
                <i className="fa-solid fa-cloud-arrow-up"></i>{' '}
                {uploadingVideo ? 'Uploading Video...' : 'Upload Course Video'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/*"
                  onChange={handleQuickVideoUpload}
                  disabled={uploadingVideo}
                  hidden
                />
              </label>

              {selectedCourseId && (
                <button
                  type="button"
                  className="btn-details"
                  onClick={() => navigate(`/courses/${selectedCourseId}`)}
                >
                  Open Course Curriculum &amp; Videos
                </button>
              )}
            </div>
          </div>
        )}

        {showAccessCodeForm && (
          <form className="home-interactive-drawer" onSubmit={handleEnrollByCode}>
            <div className="drawer-header">
              <h4>Enter Student Class Access Code</h4>
              <button
                type="button"
                className="btn-details"
                onClick={() => setShowAccessCodeForm(false)}
              >
                Close
              </button>
            </div>
            <p className="drawer-sub">
              Enter your class code (for example: <strong>SCRATCH1</strong>,{' '}
              <strong>PYTHON2</strong>, or <strong>TKINTER3</strong>) to enroll and launch your
              classroom immediately.
            </p>
            <div className="drawer-controls-row">
              <input
                type="text"
                className="form-input drawer-select"
                placeholder="e.g. PYTHON2"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                required
              />
              <button
                type="submit"
                className="btn-enroll"
                disabled={enrollingCode}
              >
                {enrollingCode ? 'Joining Class...' : 'Join Classroom'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="home-features-section">
        <h2 className="home-section-heading">
          Our <span>Features</span>
        </h2>
        <p className="home-section-sub">
          This very extraordinary feature, can make learning activities more efficient
        </p>

        <div className="home-feature-row">
          <div className="home-feature-text">
            <h3>
              <span>Tools</span> For Teachers
              <br />
              And Learners
            </h3>
            <p>
              Class has a dynamic set of teaching tools built to be deployed and used during class.
              Teachers can handout assignments in real-time for students to complete and submit.
            </p>
          </div>
          <div className="home-feature-graphic">
            <img
              src="/images/home/feature-tools.png"
              alt="Tools For Teachers And Learners"
              className="home-feature-img"
            />
          </div>
        </div>

        <div className="home-feature-row">
          <div className="home-feature-graphic">
            <img
              src="/images/home/feature-quiz.png"
              alt="Assessments, Quizzes, Tests"
              className="home-feature-img clickable-feature"
              onClick={() => navigate('/progress')}
            />
          </div>
          <div className="home-feature-text">
            <h3>
              Assessments,
              <br />
              <span>Quizzes</span>, Tests
            </h3>
            <p>
              Easily launch live assignments, quizzes, and tests. Student results are automatically
              entered in the online gradebook.
            </p>
          </div>
        </div>

        <div className="home-feature-row">
          <div className="home-feature-text">
            <h3>
              <span>Class Management</span>
              <br />
              Tools for Educators
            </h3>
            <p>
              Class provides tools to help run and manage the class such as Class Roster,
              Attendance, and more. With the Gradebook, review and grade tests and quizzes in
              real-time.
            </p>
          </div>
          <div className="home-feature-graphic">
            <img
              src="/images/home/feature-gradebook.png"
              alt="Class Management Tools for Educators"
              className="home-feature-img clickable-feature"
              onClick={() => navigate('/progress')}
            />
          </div>
        </div>

        <div className="home-feature-row">
          <div className="home-feature-graphic">
            <img
              src="/images/home/feature-discussions.png"
              alt="One-on-One Discussions"
              className="home-feature-img clickable-feature"
              onClick={() => navigate('/progress')}
            />
          </div>
          <div className="home-feature-text">
            <h3>
              One-on-One
              <br />
              <span>Discussions</span>
            </h3>
            <p>
              Private discussions to help teens advance their skills with development
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
