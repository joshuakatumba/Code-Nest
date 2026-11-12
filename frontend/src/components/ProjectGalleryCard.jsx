import React, { useState } from 'react';

export default function ProjectGalleryCard({
  projects,
  activeCourseId,
  onCreateProject,
  creatingProject,
}) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [runningProjectId, setRunningProjectId] = useState(null);

  const [momoAmount, setMomoAmount] = useState('45000');
  const [selectedDistrict, setSelectedDistrict] = useState('Kampala');
  const [spriteStepCount, setSpriteStepCount] = useState(10);
  const [canteenQty, setCanteenQty] = useState('3');

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPreviewKey, setNewPreviewKey] = useState('momo');

  const toggleDetails = (projectId) => {
    setSelectedProjectId((previousId) => (previousId === projectId ? null : projectId));
  };

  const toggleRunProject = (projectId) => {
    setRunningProjectId((previousId) => (previousId === projectId ? null : projectId));
  };

  const handleSubmitNewProject = async (event) => {
    event.preventDefault();
    if (!newTitle.trim() || !onCreateProject) {
      return;
    }
    await onCreateProject({
      course_id: activeCourseId,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Student coding project built in CodeNest Kampala.',
      preview_key: newPreviewKey,
    });
    setNewTitle('');
    setNewDesc('');
    setShowNewForm(false);
  };

  const numericMomo = Math.max(0, Number(momoAmount) || 0);
  const computedMomoFee = numericMomo <= 50000 ? 500 : Math.round(numericMomo * 0.01);
  const numericCanteenTotal = Math.max(1, Number(canteenQty) || 1) * 2500;

  return (
    <div className="dashboard-white-card">
      <div className="card-section-header">
        <h4>Project Gallery</h4>
        <div className="project-header-actions">
          <span className="badge-level">{projects.length} Projects</span>
          {onCreateProject && (
            <button
              type="button"
              className="btn-mark-complete"
              onClick={() => setShowNewForm((prev) => !prev)}
            >
              {showNewForm ? 'Cancel' : '+ New Project'}
            </button>
          )}
        </div>
      </div>

      {showNewForm && (
        <form className="add-project-inline-form" onSubmit={handleSubmitNewProject}>
          <input
            type="text"
            className="form-input"
            placeholder="Project Title (e.g. Kampala Bus Fare Tracker)"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            required
          />
          <input
            type="text"
            className="form-input"
            placeholder="Short description of what your code does"
            value={newDesc}
            onChange={(event) => setNewDesc(event.target.value)}
          />
          <select
            aria-label="Project Template Type"
            className="form-input"
            value={newPreviewKey}
            onChange={(event) => setNewPreviewKey(event.target.value)}
          >
            <option value="momo">Python CLI (MoMo / Fee Estimator)</option>
            <option value="district">Quiz / Data App (Districts)</option>
            <option value="scratch">Scratch Sprite Game</option>
            <option value="canteen">Tkinter CSV Desktop App</option>
          </select>
          <button
            type="submit"
            className="btn-enroll"
            disabled={creatingProject}
          >
            {creatingProject ? 'Saving...' : 'Save Project'}
          </button>
        </form>
      )}

      <div className="projects-grid">
        {projects.map((project) => {
          const isMomo = project.preview_key === 'momo';
          const isScratch = project.preview_key === 'scratch';
          const isCanteen = project.preview_key === 'canteen';
          const isExpanded = selectedProjectId === project.id;
          const isRunning = runningProjectId === project.id;

          return (
            <div key={project.id} className="project-item-card">
              {isMomo ? (
                <div className="project-preview-strip project-strip-momo">
                  <div className="momo-pill-tag">UGX Mobile Money Calculator</div>
                </div>
              ) : isScratch ? (
                <div className="project-preview-strip project-strip-district">
                  <div className="district-tags-row">
                    <span className="district-tag kampala">Scratch Stage</span>
                    <span className="district-tag jinja">Sprite Loops</span>
                  </div>
                </div>
              ) : isCanteen ? (
                <div className="project-preview-strip project-strip-momo">
                  <div className="momo-pill-tag">Tkinter + CSV Canteen App</div>
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

                {isRunning && (
                  <div className="project-runner-box">
                    {isMomo ? (
                      <div>
                        <div className="runner-code-title">
                          Python CLI Output: Mobile Money Fee Estimator
                        </div>
                        <label className="runner-input-row">
                          <span>Amount (UGX):</span>
                          <input
                            type="number"
                            className="runner-mini-input"
                            value={momoAmount}
                            onChange={(event) => setMomoAmount(event.target.value)}
                          />
                        </label>
                        <div className="runner-output-line">
                          Estimated Withdrawal Fee: <strong>UGX {computedMomoFee}</strong> | Total:{' '}
                          <strong>UGX {numericMomo + computedMomoFee}</strong>
                        </div>
                      </div>
                    ) : isScratch ? (
                      <div>
                        <div className="runner-code-title">
                          Scratch Stage Simulator: {project.title}
                        </div>
                        <div className="runner-input-row">
                          <button
                            type="button"
                            className="btn-mark-complete"
                            onClick={() => setSpriteStepCount((prev) => prev + 10)}
                          >
                            Move +10 Steps
                          </button>
                          <span>Sprite X Position: <strong>{spriteStepCount}px</strong></span>
                        </div>
                      </div>
                    ) : isCanteen ? (
                      <div>
                        <div className="runner-code-title">
                          Tkinter Canteen CSV Logger
                        </div>
                        <label className="runner-input-row">
                          <span>Rolex / Snack Qty (UGX 2,500 each):</span>
                          <input
                            type="number"
                            className="runner-mini-input"
                            value={canteenQty}
                            onChange={(event) => setCanteenQty(event.target.value)}
                          />
                        </label>
                        <div className="runner-output-line">
                          CSV Row Saved: <code>item=Rolex,qty={canteenQty},total_ugx={numericCanteenTotal}</code>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="runner-code-title">
                          Interactive Ugandan District Geography Quiz
                        </div>
                        <div className="runner-input-row">
                          {['Kampala', 'Wakiso', 'Jinja'].map((districtName) => (
                            <button
                              key={districtName}
                              type="button"
                              className={`btn-mark-complete ${
                                selectedDistrict === districtName ? 'active-district-btn' : ''
                              }`}
                              onClick={() => setSelectedDistrict(districtName)}
                            >
                              {districtName}
                            </button>
                          ))}
                        </div>
                        <div className="runner-output-line">
                          {selectedDistrict === 'Kampala'
                            ? 'Kampala: Capital city of Uganda (Central Region).'
                            : selectedDistrict === 'Wakiso'
                            ? 'Wakiso: Surrounds Kampala and hosts Entebbe International Airport.'
                            : 'Jinja: Source of the River Nile in Eastern Uganda.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="project-btns">
                  <button
                    type="button"
                    className="btn-run enabled"
                    onClick={() => toggleRunProject(project.id)}
                  >
                    {isRunning ? 'Stop Project' : 'Run Project'}
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
