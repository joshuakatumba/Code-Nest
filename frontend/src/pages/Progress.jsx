import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import CbcCompetencyCard from '../components/CbcCompetencyCard.jsx';
import ProjectGalleryCard from '../components/ProjectGalleryCard.jsx';
import VirtualClassroomStage from '../components/VirtualClassroomStage.jsx';
import CourseContentsCard from '../components/CourseContentsCard.jsx';
import BookForYouCard from '../components/BookForYouCard.jsx';
import PracticeQuizSection from '../components/PracticeQuizSection.jsx';
import Footer from '../components/Footer.jsx';

export default function Progress() {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [completingLessonId, setCompletingLessonId] = useState(null);

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
      const initialAnswers = quizData.questions.map(() => 1);
      setSelectedAnswers(initialAnswers);
    } catch (error) {
      setErrorMessage(error.message || 'Could not load quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    api
      .getProgress()
      .then((data) => {
        setProgressData(data);
        if (data.quizzes && data.quizzes.length > 0) {
          loadQuizById(data.quizzes[0].id);
        }
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Failed to load student progress');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCompleteLesson = async (lessonId) => {
    setCompletingLessonId(lessonId);
    setErrorMessage('');
    try {
      await api.completeLesson(lessonId);
      const refreshedProgress = await api.getProgress();
      setProgressData(refreshedProgress);
    } catch (error) {
      setErrorMessage(error.message || 'Could not mark lesson complete');
    } finally {
      setCompletingLessonId(null);
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

  return (
    <main id="screen-progress">
      <section className="progress-top-band">
        <div className="progress-inner">
          <h2 className="welcome-heading">Welcome back, ready for your next lesson?</h2>

          {errorMessage && <div className="status-banner error">{errorMessage}</div>}

          <CbcCompetencyCard competencies={progressData.competencies} />
          <ProjectGalleryCard projects={progressData.projects} />
        </div>
      </section>

      <section className="virtual-session-band">
        <div className="virtual-session-grid">
          <VirtualClassroomStage />

          <aside className="sidebar-stack">
            <CourseContentsCard
              modules={progressData.modules}
              completedCount={progressData.completed}
              totalLessons={progressData.total}
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
