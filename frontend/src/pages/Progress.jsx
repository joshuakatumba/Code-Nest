import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import CbcCompetencyCard from '../components/CbcCompetencyCard.jsx';
import ProjectGalleryCard from '../components/ProjectGalleryCard.jsx';
import VirtualClassroomStage from '../components/VirtualClassroomStage.jsx';
import CourseContentsCard from '../components/CourseContentsCard.jsx';
import BookForYouCard from '../components/BookForYouCard.jsx';
import PracticeQuizSection from '../components/PracticeQuizSection.jsx';
import Footer from '../components/Footer.jsx';

function flattenModuleLessons(modules) {
  return (modules || []).flatMap((mod) => mod.lessons || []);
}

function findDefaultLesson(modules) {
  const allLessons = flattenModuleLessons(modules);
  const firstUncompleted = allLessons.find((item) => !item.completed);
  return firstUncompleted || allLessons[0] || null;
}

export default function Progress() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('course')
    ? Number(searchParams.get('course'))
    : null;

  const [progressData, setProgressData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [completingLessonId, setCompletingLessonId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const loadQuizById = async (quizId) => {
    setQuizLoading(true);
    setQuizResult(null);
    try {
      const quizData = await api.getQuiz(quizId);
      setActiveQuiz(quizData);
      const initialAnswers = quizData.questions.map(() => -1);
      setSelectedAnswers(initialAnswers);
    } catch (error) {
      setErrorMessage(error.message || 'Could not load quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const fetchProgressForCourse = async (targetCourseId = null, preserveLessonId = null) => {
    const data = await api.getProgress(targetCourseId);
    setProgressData(data);

    let chosenLesson = null;
    if (preserveLessonId) {
      const allLessons = flattenModuleLessons(data.modules);
      chosenLesson = allLessons.find((item) => item.id === preserveLessonId) || null;
    }
    if (!chosenLesson) {
      chosenLesson = findDefaultLesson(data.modules);
    }
    setActiveLesson(chosenLesson);

    if (data.quizzes && data.quizzes.length > 0) {
      const currentQuizStillValid =
        activeQuiz && data.quizzes.some((q) => q.id === activeQuiz.id);
      if (!currentQuizStillValid) {
        loadQuizById(data.quizzes[0].id);
      }
    }
    return data;
  };

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    fetchProgressForCourse(queryCourseId)
      .catch((error) => {
        setErrorMessage(error.message || 'Failed to load student progress');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [queryCourseId]);

  const handleSelectCourseTab = (courseId) => {
    setSearchParams({ course: String(courseId) });
  };

  const handleCompleteLesson = async (lessonId) => {
    setCompletingLessonId(lessonId);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await api.completeLesson(lessonId);
      await fetchProgressForCourse(progressData?.active_course_id, lessonId);
      setStatusMessage('Lesson marked complete! Next lesson unlocked and CBC competency updated.');
    } catch (error) {
      setErrorMessage(error.message || 'Could not mark lesson complete');
    } finally {
      setCompletingLessonId(null);
    }
  };

  const handleNextLesson = () => {
    if (!progressData || !progressData.modules) {
      return;
    }
    const flatLessons = flattenModuleLessons(progressData.modules);
    if (flatLessons.length === 0) {
      return;
    }
    const currentIdx = activeLesson
      ? flatLessons.findIndex((item) => item.id === activeLesson.id)
      : -1;
    const nextIdx = (currentIdx + 1) % flatLessons.length;
    setActiveLesson(flatLessons[nextIdx]);
  };

  const handleUploadLessonVideo = async (lessonId, file) => {
    setUploadingVideo(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updatedLesson = await api.uploadLessonVideo(lessonId, file);
      await fetchProgressForCourse(progressData?.active_course_id, updatedLesson.id);
      setStatusMessage(`Uploaded video "${file.name}" for "${updatedLesson.title}".`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCreateProject = async (projectPayload) => {
    setCreatingProject(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await api.createProject(projectPayload);
      await fetchProgressForCourse(
        progressData?.active_course_id,
        activeLesson?.id
      );
      setStatusMessage(`Project "${projectPayload.title}" added to your gallery.`);
    } catch (error) {
      setErrorMessage(error.message || 'Could not save project');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSelectOption = (questionIndex, optionIndex) => {
    setQuizResult(null);
    setSelectedAnswers((previousAnswers) =>
      previousAnswers.map((answerValue, i) =>
        i === questionIndex ? optionIndex : answerValue
      )
    );
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) {
      return;
    }
    setSubmittingQuiz(true);
    setErrorMessage('');
    try {
      const result = await api.submitQuiz(activeQuiz.id, selectedAnswers);
      setQuizResult(result);
      const refreshed = await api.getProgress(progressData?.active_course_id);
      setProgressData(refreshed);
    } catch (error) {
      setErrorMessage(error.message || 'Could not submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading student progress...</div>;
  }

  if (!progressData) {
    return (
      <main id="screen-progress">
        <div className="status-banner error">
          {errorMessage || 'Unable to load progress dashboard'}
        </div>
        <Footer />
      </main>
    );
  }

  const enrolledCourses = progressData.enrolled_courses || [];
  const activeCourseObj =
    enrolledCourses.find((c) => c.id === progressData.active_course_id) ||
    enrolledCourses[0] || { id: progressData.active_course_id || 2, title: 'Active Course' };

  return (
    <main id="screen-progress">
      <section className="progress-top-band">
        <div className="progress-inner">
          <div className="welcome-header-row">
            <h2 className="welcome-heading">
              Welcome back{user?.name ? `, ${user.name}` : ''}, ready for your next lesson?
            </h2>

            {enrolledCourses.length > 0 && (
              <div className="enrolled-course-pills">
                {enrolledCourses.map((courseItem) => (
                  <button
                    key={courseItem.id}
                    type="button"
                    className={`level-pill ${
                      courseItem.id === progressData.active_course_id ? 'active' : ''
                    }`}
                    onClick={() => handleSelectCourseTab(courseItem.id)}
                  >
                    {courseItem.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errorMessage && <div className="status-banner error">{errorMessage}</div>}
          {statusMessage && <div className="status-banner info">{statusMessage}</div>}

          <CbcCompetencyCard competencies={progressData.competencies} />
          <ProjectGalleryCard
            projects={progressData.projects}
            activeCourseId={progressData.active_course_id}
            onCreateProject={handleCreateProject}
            creatingProject={creatingProject}
          />
        </div>
      </section>

      <section className="virtual-session-band">
        <div className="virtual-session-grid">
          <VirtualClassroomStage
            activeCourse={activeCourseObj}
            activeLesson={activeLesson}
            onCompleteLesson={handleCompleteLesson}
            onNextLesson={handleNextLesson}
            onUploadLessonVideo={handleUploadLessonVideo}
            uploadingVideo={uploadingVideo}
          />

          <aside className="sidebar-stack">
            <CourseContentsCard
              modules={progressData.modules}
              completedCount={progressData.completed}
              totalLessons={progressData.total}
              activeLessonId={activeLesson?.id}
              onSelectLesson={(lesson) => setActiveLesson(lesson)}
              onCompleteLesson={handleCompleteLesson}
              completingLessonId={completingLessonId}
            />
            <BookForYouCard />
          </aside>
        </div>
      </section>

      <PracticeQuizSection
        quizzes={progressData.quizzes}
        activeQuiz={activeQuiz}
        quizLoading={quizLoading}
        selectedAnswers={selectedAnswers}
        quizResult={quizResult}
        submittingQuiz={submittingQuiz}
        onSelectQuiz={loadQuizById}
        onSelectOption={handleSelectOption}
        onSubmitQuiz={handleSubmitQuiz}
      />

      <Footer />
    </main>
  );
}
