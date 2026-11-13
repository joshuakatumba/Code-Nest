import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Footer from '../components/Footer.jsx';

export default function AboutUs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [showInstructorPanel, setShowInstructorPanel] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [enrollingCode, setEnrollingCode] = useState(false);

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
    event.target.value = '';
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
    <main id="screen-about">
      <section className="home-platform-section">
        <h1 className="home-section-heading">
          All-In-One <span>Teaching Platform.</span>
        </h1>
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

      <section className="home-what-section">
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
            onClick={() => {
              if (!user) {
                navigate('/login');
                return;
              }
              setShowInstructorPanel((prev) => !prev);
            }}
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
            onClick={() => {
              if (!user) {
                navigate('/login');
                return;
              }
              setShowAccessCodeForm((prev) => !prev);
            }}
            aria-label="For Students: Enter access code"
          >
            <img
              src="/images/home/student-bg.png"
              alt="For Students - Enter access code"
              className="home-role-photo-img"
            />
          </button>
        </div>

        {user && showInstructorPanel && (
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

      <section className="about-story-section">
        <h2 className="about-story-heading">Our Story</h2>
        <p className="home-section-sub wide">
          How a weekend coding club in Kampala grew into an offline-first learning platform for
          teenagers across Uganda.
        </p>

        <div className="about-story-card">
          <div className="about-story-narrative">
            <h3>Born in Kampala to Bridge the Digital Divide</h3>
            <p>
              CodeNest began with a simple observation in Ugandan secondary schools: teenagers were
              eager to create technology, but most coding platforms assumed high-speed fiber
              internet and used examples disconnected from everyday life in East Africa. When the
              connection dropped, learning stopped.
            </p>
            <p>
              We founded CodeNest in Kampala to change that. Starting with a small group of Senior
              One and Senior Two learners, we designed a practical, step-by-step curriculum that
              runs smoothly even where bandwidth is limited. Instead of abstract exercises, our
              students start with visual blocks in Scratch, transition to writing clean Python in
              Thonny, and graduate to building desktop tools with Tkinter and CSV data.
            </p>
            <p>
              Every project inside CodeNest is rooted in real Ugandan communities—from calculating
              Mobile Money withdrawal fees and mapping Ugandan districts to tracking school canteen
              inventories and designing Boda-Boda road-safety games. Aligned with Uganda&apos;s
              Competency-Based Curriculum (CBC), we measure growth through Logical Thinking, Python
              Syntax Mastery, and Practical Problem Solving.
            </p>
          </div>

          <div className="about-story-milestones">
            <div className="story-milestone-box">
              <h4>Our Mission</h4>
              <p>
                Equip learners aged 12 to 17 with offline-ready programming skills that solve real
                problems in their schools, homes, and communities.
              </p>
            </div>

            <div className="story-milestone-box">
              <h4>Our Approach</h4>
              <p>
                A structured three-level pathway that takes beginners from visual logic to building
                complete data-driven applications without requiring constant internet access.
              </p>
            </div>

            <div className="story-milestone-box">
              <h4>Our Vision</h4>
              <p>
                Partnering with parents, teachers, and schools across Kampala, Wakiso, Jinja, and
                beyond to turn young technology consumers into confident software builders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

