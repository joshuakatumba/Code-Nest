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
  const questions = activeQuiz?.questions || [];
  const hasQuestions = questions.length > 0;
  const answeredCount = (selectedAnswers || []).filter((val) => val >= 0).length;
  const totalQuestions = hasQuestions ? questions.length : 1;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const resultsByQuestionId = {};
  if (quizResult && quizResult.results) {
    for (const item of quizResult.results) {
      resultsByQuestionId[item.question_id] = item;
    }
  }

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
              <span>
                <i className="fa-solid fa-book"></i> {quiz.title}
              </span>
              {quiz.best_score !== null && quiz.best_score !== undefined && (
                <span className="quiz-best-badge">Best: {quiz.best_score}</span>
              )}
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
                  {questions.map((question, i) => (
                    <QuizQuestionBlock
                      key={question.id}
                      question={question}
                      questionIndex={i}
                      selectedOptionIndex={selectedAnswers[i]}
                      questionResult={resultsByQuestionId[question.id] || null}
                      onSelectOption={onSelectOption}
                    />
                  ))}
                  <div className="quiz-actions-row">
                    <button
                      type="button"
                      className="btn-quiz-submit"
                      onClick={onSubmitQuiz}
                      disabled={submittingQuiz || answeredCount === 0}
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
              <div
                className="player-progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="player-meta">
              <span>
                <i className="fa-solid fa-list-check"></i> {answeredCount} / {questions.length} Answered
              </span>
              <span>
                {quizResult
                  ? `Last Score: ${quizResult.score}/${quizResult.total}`
                  : `${progressPercent}% Ready`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
