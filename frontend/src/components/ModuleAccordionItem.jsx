import React from 'react';

export default function ModuleAccordionItem({
  module,
  isOpen,
  onToggle,
  activeLessonId,
  onSelectLesson,
  onCompleteLesson,
  completingLessonId,
}) {
  return (
    <div className={`accordion-item ${isOpen ? 'active' : ''}`}>
      <div
        className={`acc-top ${isOpen ? 'acc-ActiveTitle' : ''}`}
        onClick={() => onToggle(module.id)}
      >
        <span>{module.title}</span>
        <i
          className={`fa-solid ${
            isOpen ? 'fa-chevron-up' : 'fa-chevron-down'
          } acc-chevron-icon`}
        ></i>
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
            const isCompleted = Boolean(lesson.completed);
            const isSelected = activeLessonId === lesson.id;
            const isBusy = completingLessonId === lesson.id;
            const isLocked = Boolean(lesson.is_locked_default) && !isCompleted;

            return (
              <div
                key={lesson.id}
                className={`lesson-row ${
                  isCompleted || isSelected ? 'active-lesson' : ''
                }`}
              >
                <button
                  type="button"
                  className="lesson-select-btn"
                  onClick={() => onSelectLesson && onSelectLesson(lesson)}
                >
                  <i
                    className={`fa-solid ${
                      isSelected ? 'fa-circle-play' : 'fa-play'
                    } acc-chevron-icon`}
                  ></i>{' '}
                  {lesson.title}
                </button>
                <span className="lesson-right-meta">
                  {lesson.duration_label}{' '}
                  {isCompleted ? (
                    <i className="fa-solid fa-check acc-chevron-icon" title="Completed"></i>
                  ) : isLocked ? (
                    <i
                      className="fa-solid fa-lock acc-chevron-icon"
                      title="Complete the previous lesson to unlock"
                    ></i>
                  ) : (
                    <button
                      type="button"
                      className="btn-mark-complete"
                      onClick={() => onCompleteLesson(lesson.id)}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Saving...' : 'Complete'}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
