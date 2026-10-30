import React, { useState } from 'react';

export default function ProjectGalleryCard({ projects }) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const toggleDetails = (projectId) => {
    setSelectedProjectId((previousId) => (previousId === projectId ? null : projectId));
  };

  return (
    <div className="dashboard-white-card">
      <div className="card-section-header">
        <h4>Project Gallery</h4>
        <span className="badge-level">{projects.length} Projects</span>
      </div>

      <div className="projects-grid">
        {projects.map((project) => {
          const isMomo = project.preview_key === 'momo';
          const isExpanded = selectedProjectId === project.id;

          return (
            <div key={project.id} className="project-item-card">
              {isMomo ? (
                <div className="project-preview-strip project-strip-momo">
                  <div className="momo-pill-tag">UGX Mobile Money Calculator</div>
                </div>
              ) : (
                <div className="project-preview-strip project-strip-district">
                  <div className="district-tags-row">
                    <span className="district-tag kampala">Kampala</span>
                    <span className="district-tag wakiso">Wakiso</span>
                    <span className="district-tag jinja">Jinja</span>
                  </div>
                </div>
              )}

              <div className="project-body">
                <h5>{project.title}</h5>
                {isExpanded && (
                  <p className="project-desc-text">{project.description}</p>
                )}
                <div className="project-btns">
                  {/* TODO(real-impl): connect browser Python runner */}
                  <button
                    type="button"
                    className="btn-run"
                    disabled
                    title="Coming soon"
                  >
                    Run Project
                  </button>
                  <button
                    type="button"
                    className="btn-details"
                    onClick={() => toggleDetails(project.id)}
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <a
        href="/sample-worksheet.pdf"
        target="_blank"
        rel="noreferrer"
        className="btn-download-pdf"
      >
        Download Term Assessment Worksheet (PDF)
      </a>
    </div>
  );
}
