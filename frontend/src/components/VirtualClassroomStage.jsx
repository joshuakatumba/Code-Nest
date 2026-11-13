import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../api.js';

export default function VirtualClassroomStage({
  activeCourse,
  activeLesson,
  onCompleteLesson,
  onNextLesson,
  onUploadLessonVideo,
  uploadingVideo,
}) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);

  const rawVideoUrl =
    activeLesson?.video_url ||
    activeCourse?.video_url ||
    '/uploads/videos/python-lesson.mp4';
  const videoSrc = resolveMediaUrl(rawVideoUrl);

  const handleTogglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  };

  const handleToggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }
    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file && activeLesson && onUploadLessonVideo) {
      onUploadLessonVideo(activeLesson.id, file);
    }
  };

  return (
    <div>
      <div className="video-header-bar">
        <button
          type="button"
          className="teal-square-icon"
          title="Back to Course Detail"
          aria-label="Back to Course Detail"
          onClick={() => navigate(`/courses/${activeCourse?.id || 2}`)}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <div className="white-top-pill">
          <div className="classroom-stage-title">
            <strong>{activeLesson ? activeLesson.title : 'Classroom Session'}</strong>
            {activeLesson && (
              <span className="classroom-stage-duration">
                <i className="fa-regular fa-clock"></i> {activeLesson.duration_label}
              </span>
            )}
          </div>

          <div className="classroom-stage-top-actions">
            {activeLesson && onUploadLessonVideo && (
              <label className="btn-mark-complete upload-lesson-btn" title="Upload video for this lesson">
                <i className="fa-solid fa-cloud-arrow-up"></i>{' '}
                {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/*"
                  disabled={uploadingVideo}
                  onChange={handleFileChange}
                  hidden
                />
              </label>
            )}
            <button
              type="button"
              className="stage-gear-btn"
              title="Toggle student thumbnails"
              aria-label="Toggle student thumbnails"
              onClick={() => setShowParticipants((prev) => !prev)}
            >
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="live-video-stage">
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          controls
          className="classroom-main-video"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (activeLesson && !activeLesson.completed && onCompleteLesson) {
              onCompleteLesson(activeLesson.id);
            }
          }}
        >
          Your browser does not support HTML5 video.
        </video>

        {showParticipants && (
          <div className="participants-stack">
            <div className="participant-thumb">
              <img src="/images/student-1.svg" alt="Student 1" />
            </div>
            <div className="participant-thumb">
              <img src="/images/student-2.svg" alt="Student 2" />
            </div>
            <div className="participant-thumb">
              <img src="/images/student-3.svg" alt="Student 3" />
            </div>
          </div>
        )}

        <div className="call-controls-bar">
          <button
            type="button"
            className="ctrl-btn red"
            title={isPlaying ? 'Pause lesson video' : 'Play lesson video'}
            aria-label={isPlaying ? 'Pause lesson video' : 'Play lesson video'}
            onClick={handleTogglePlay}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-video'}`}></i>
          </button>
          <button
            type="button"
            className="ctrl-btn blue"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            onClick={handleToggleMute}
          >
            <i
              className={`fa-solid ${
                isMuted ? 'fa-microphone-slash' : 'fa-microphone'
              }`}
            ></i>
          </button>
          <button
            type="button"
            className="ctrl-btn pink"
            title="Mark current lesson complete"
            aria-label="Mark current lesson complete"
            onClick={() => activeLesson && onCompleteLesson && onCompleteLesson(activeLesson.id)}
          >
            <i className="fa-solid fa-check"></i>
          </button>
          <button
            type="button"
            className="ctrl-btn teal"
            title="Toggle student participants overlay"
            aria-label="Toggle student participants overlay"
            onClick={() => setShowParticipants((prev) => !prev)}
          >
            <i className="fa-solid fa-desktop"></i>
          </button>
          <button
            type="button"
            className="ctrl-btn teal"
            title="Next lesson"
            aria-label="Next lesson"
            onClick={onNextLesson}
          >
            <i className="fa-solid fa-forward-step"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
