import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, resolveMediaUrl } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import CourseCard from '../components/CourseCard.jsx';
import Footer from '../components/Footer.jsx';

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [playingPromoVideo, setPlayingPromoVideo] = useState(false);

  useEffect(() => {
    api
      .getCourses()
      .then((data) => {
        setAllTracks(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    api
      .getCourses(selectedLevel)
      .then((data) => {
        setCourses(data);
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Failed to load courses');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedLevel]);

  useEffect(() => {
    if (!user) {
      setEnrolledIds([]);
      return;
    }
    api
      .getProgress()
      .then((progressData) => {
        const ids = (progressData.enrollments || []).map((item) => item.course_id);
        setEnrolledIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const handleQuickUploadCourseVideo = async (courseId, file) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setErrorMessage('');
    setStatusMessage(`Uploading video "${file.name}"...`);
    try {
      const updated = await api.uploadCourseVideo(courseId, file);
      setCourses((prev) =>
        prev.map((course) => (course.id === updated.id ? updated : course))
      );
      setAllTracks((prev) =>
        prev.map((track) => (track.id === updated.id ? updated : track))
      );
      setStatusMessage(
        `Video uploaded for "${updated.title}". Click the course to manage lesson videos.`
      );
    } catch (error) {
      setStatusMessage('');
      setErrorMessage(error.message || 'Could not upload video');
    }
  };

  const enrolledSet = new Set(enrolledIds);
  const promoVideoSrc = resolveMediaUrl(
    allTracks[1]?.video_url || allTracks[0]?.video_url || '/uploads/videos/python-lesson.mp4'
  );

  return (
    <main id="screen-courses">
      <div className="courses-container">
        <h1 className="explore-heading">Explore Courses</h1>

        {errorMessage && <div className="status-banner error">{errorMessage}</div>}
        {statusMessage && <div className="status-banner info">{statusMessage}</div>}

        <div className="courses-sub-bar">
          <h3>Courses</h3>
          <button
            type="button"
            className="see-all-link"
            onClick={() => setSelectedLevel(null)}
          >
            See all ({allTracks.length})
          </button>
        </div>

        <div className="level-pills">
          <button
            type="button"
            className={`level-pill ${selectedLevel === null ? 'active' : ''}`}
            onClick={() => setSelectedLevel(null)}
          >
            All Levels
          </button>
          <button
            type="button"
            className={`level-pill ${selectedLevel === 1 ? 'active' : ''}`}
            onClick={() => setSelectedLevel(selectedLevel === 1 ? null : 1)}
          >
            Level 1
          </button>
          <button
            type="button"
            className={`level-pill ${selectedLevel === 2 ? 'active' : ''}`}
            onClick={() => setSelectedLevel(selectedLevel === 2 ? null : 2)}
          >
            Level 2
          </button>
          <button
            type="button"
            className={`level-pill ${selectedLevel === 3 ? 'active' : ''}`}
            onClick={() => setSelectedLevel(selectedLevel === 3 ? null : 3)}
          >
            Level 3
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading courses...</div>
        ) : (
          <div className="featured-courses-grid">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledSet.has(course.id)}
                onQuickUploadVideo={handleQuickUploadCourseVideo}
              />
            ))}
          </div>
        )}

        <h3 className="tracks-section-title">Choose favourite course from top category</h3>
        <h2 className="tracks-subheading">Tracks</h2>

        <div className="tracks-grid">
          {allTracks.map((track) => {
            const badgeClass = `t${track.level}`;
            return (
              <div
                key={track.id}
                className="track-card"
                onClick={() => navigate(`/courses/${track.id}`)}
              >
                <span className={`track-badge ${badgeClass}`}>
                  <i className="fa-solid fa-circle track-dot-icon"></i> Track {track.level}
                </span>
                <h4>{track.title}</h4>
                <div className="track-tech">{track.tech}</div>

                <div className="track-meta-block">
                  <div className="track-meta-label">Target Grade / Age</div>
                  <div className="track-meta-val">{track.grade_range}</div>
                </div>
                <div className="track-meta-block">
                  <div className="track-meta-label">What They Will Build</div>
                  <div className="track-meta-val">{track.builds}</div>
                </div>
                <div className="track-meta-block">
                  <div className="track-meta-label">Key Skills Learned</div>
                  <div className="track-meta-val">{track.skills}</div>
                </div>
                <div className="track-meta-block">
                  <div className="track-meta-label">Duration &amp; Package</div>
                  <div className="track-meta-val">{track.duration}</div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="coaching-promo-title">Online coaching lessons for remote learning</h3>

        <div className="classroom-split">
          <div className="classroom-text-side">
            <div className="green-blob"></div>
            <h3>
              Everything you can do in a physical classroom,{' '}
              <span>you can do with CodeNest</span>
            </h3>
            <p>
              CodeNest&apos;s school management software helps traditional and online schools manage
              scheduling, attendance, payments and virtual classrooms all in one secure cloud-based
              system.
            </p>
            <Link to="/progress" className="learn-more-link">
              Learn more
            </Link>
          </div>

          <div className="classroom-video-frame">
            <div className="frame-corner-tl"></div>
            <div className="frame-corner-br"></div>
            <div className="classroom-img-wrapper">
              {playingPromoVideo ? (
                <video
                  src={promoVideoSrc}
                  controls
                  autoPlay
                  className="classroom-promo-video"
                >
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <>
                  <img src="/images/classroom.svg" alt="Classroom" />
                  <button
                    type="button"
                    className="play-btn-circle"
                    aria-label="Play classroom preview video"
                    onClick={() => setPlayingPromoVideo(true)}
                  >
                    <i className="fa-solid fa-play"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
