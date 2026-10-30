import React from 'react';
import QuizQuestionBlock from './QuizQuestionBlock.jsx';

const PILL_COLORS = ['blue', 'orange', 'blue', 'pink', 'blue', 'orange', 'blue'];

export default function PracticeQuizSection({
  quizzes,
  activeQuiz,
  quizLoading,
  selectedAnswers,
  quizResult,
  submittingQuiz,
  onSelectQuiz,
  onSelectOption,
  onSubmitQuiz,
}) {
  const hasQuestions =
    activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0;

  return (
    <section className="practice-quiz-section">
      <div className="quiz-lesson-list">
        <h4>PRACTICE QUIZ</h4>
        {quizzes.map((quiz, i) => {
          const colorClass = PILL_COLORS[i % PILL_COLORS.length];
          const isCurrent = activeQuiz && activeQuiz.id === quiz.id;
          return (
            <button
              type="button"
              key={quiz.id}
              className={`quiz-pill-btn ${colorClass} ${
                isCurrent ? 'active-quiz-pill' : ''
              }`}
              onClick={() => onSelectQuiz(quiz.id)}
            >
              <i className="fa-solid fa-book"></i> {quiz.title}
            </button>
          );
        })}
      </div>

      <div className="quiz-stage-backdrop">
        <div className="quiz-tablet-frame">
          <div className="tablet-device">
            <div className="tablet-screen">
              <h3>Quick Quiz</h3>
              {quizLoading ? (
                <p>Loading quiz questions...</p>
              ) : hasQuestions ? (
                <>
                  {activeQuiz.questions.map((question, i) => (
                    <QuizQuestionBlock
                      key={question.id}
                      question={question}
                      questionIndex={i}
                      selectedOptionIndex={selectedAnswers[i]}
                      onSelectOption={onSelectOption}
                    />
                  ))}
                  <div className="quiz-actions-row">
                    <button
                      type="button"
                      className="btn-quiz-submit"
                      onClick={onSubmitQuiz}
                      disabled={submittingQuiz}
                    >
                      {submittingQuiz ? 'Grading...' : 'Submit Answer'}
                    </button>
                  </div>
                  {quizResult && (
                    <div className="quiz-score-banner">
                      Score: {quizResult.score} / {quizResult.total}
                    </div>
                  )}
                </>
              ) : (
                <p>Select a practice quiz from the list.</p>
              )}
            </div>
          </div>

          <div className="video-player-bar">
            <div className="player-progress">
              <div className="player-progress-fill"></div>
            </div>
            <div className="player-meta">
              <span>
                <i className="fa-solid fa-play"></i> 0:35 / 05:28
              </span>
              <i className="fa-solid fa-expand"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
