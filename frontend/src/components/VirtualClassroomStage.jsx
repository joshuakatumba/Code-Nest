import React from 'react';

export default function VirtualClassroomStage() {
  return (
    <div>
      <div className="video-header-bar">
        <div className="teal-square-icon"></div>
        <div className="white-top-pill" title="Coming soon">
          <i className="fa-solid fa-gear"></i>
        </div>
      </div>

      <div className="live-video-stage">
        <img src="/images/instructor.svg" alt="Instructor" />

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

        {/* TODO(real-impl): wire live classroom meeting_url and WebRTC controls */}
        <div className="call-controls-bar">
          <button
            type="button"
            className="ctrl-btn red"
            disabled
            title="Coming soon"
            aria-label="Toggle video (Coming soon)"
          >
            <i className="fa-solid fa-video"></i>
          </button>
          <button
            type="button"
            className="ctrl-btn blue"
            disabled
            title="Coming soon"
            aria-label="Toggle microphone (Coming soon)"
          >
            <i className="fa-solid fa-microphone"></i>
          </button>
          <button
            type="button"
            className="ctrl-btn pink"
            disabled
            title="Coming soon"
            aria-label="End call (Coming soon)"
          >
            <i className="fa-solid fa-phone-slash"></i>
          </button>
          <button
            type="button"
            className="ctrl-btn teal"
            disabled
            title="Coming soon"
            aria-label="Share screen (Coming soon)"
          >
            <i className="fa-solid fa-desktop"></i>
          </button>
          <button
            type="button"
            className="ctrl-btn teal"
            disabled
            title="Coming soon"
            aria-label="Leave classroom (Coming soon)"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
