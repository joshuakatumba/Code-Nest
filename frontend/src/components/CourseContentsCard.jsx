import React, { useState, useEffect } from 'react';
import ModuleAccordionItem from './ModuleAccordionItem.jsx';

export default function CourseContentsCard({
  modules,
  completedCount,
  totalLessons,
  activeLessonId,
  onSelectLesson,
  onCompleteLesson,
  completingLessonId,
}) {
  const defaultOpenModuleId = modules.length > 0 ? modules[0].id : null;
  const [openModuleId, setOpenModuleId] = useState(defaultOpenModuleId);

  useEffect(() => {
    if (modules.length > 0 && !modules.some((m) => m.id === openModuleId)) {
      setOpenModuleId(modules[0].id);
    }
  }, [modules, openModuleId]);

  const segmentIndices = [0, 1, 2, 3, 4];
  const safeTotal = totalLessons > 0 ? totalLessons : 1;
  const filledSegments = Math.min(
    5,
    Math.max(0, Math.round((completedCount / safeTotal) * 5))
  );

  const handleToggleModule = (moduleId) => {
    setOpenModuleId((previousId) => (previousId === moduleId ? null : moduleId));
  };

  return (
    <div className="contents-card">
      <h4>Course Contents</h4>
      <div className="completed-meta">
        <span>
          {completedCount}/{totalLessons} COMPLETED
        </span>
        <i className="fa-regular fa-calendar"></i>
      </div>
      <div className="segmented-bar">
        {segmentIndices.map((segmentIndex) => (
          <div
            key={segmentIndex}
            className={`seg-item ${segmentIndex < filledSegments ? 'done' : ''}`}
          ></div>
        ))}
      </div>

      {modules.map((module) => (
        <ModuleAccordionItem
          key={module.id}
          module={module}
          isOpen={openModuleId === module.id}
          onToggle={handleToggleModule}
          activeLessonId={activeLessonId}
          onSelectLesson={onSelectLesson}
          onCompleteLesson={onCompleteLesson}
          completingLessonId={completingLessonId}
        />
      ))}
    </div>
  );
}
