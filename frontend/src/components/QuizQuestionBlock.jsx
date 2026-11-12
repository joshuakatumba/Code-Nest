import React from 'react';

export default function QuizQuestionBlock({
  question,
  questionIndex,
  selectedOptionIndex,
  questionResult,
  onSelectOption,
}) {
  return (
    <div className="quiz-question-block">
      <p>{question.prompt}</p>
      {question.options.map((optionText, i) => {
        const isSelected = selectedOptionIndex === i;
        const isCorrectOption =
          questionResult && questionResult.correct_index === i;
        const isWrongSelection =
          questionResult && isSelected && !questionResult.is_correct;

        let optionClass = 'quiz-option';
        if (isCorrectOption) {
          optionClass += ' selected';
        } else if (isWrongSelection) {
          optionClass += ' wrong-option';
        } else if (isSelected) {
          optionClass += ' selected';
        }

        return (
          <button
            type="button"
            key={optionText}
            className={optionClass}
            onClick={() => onSelectOption(questionIndex, i)}
          >
            <span>
              <i className="fa-regular fa-circle"></i> {optionText}
            </span>
            {isCorrectOption && <i className="fa-solid fa-check"></i>}
            {isWrongSelection && <i className="fa-solid fa-xmark"></i>}
            {!questionResult && isSelected && <i className="fa-solid fa-check"></i>}
          </button>
        );
      })}
    </div>
  );
}
