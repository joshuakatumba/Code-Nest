import React from 'react';

export default function QuizQuestionBlock({
  question,
  questionIndex,
  selectedOptionIndex,
  onSelectOption,
}) {
  return (
    <div>
      <p>{question.prompt}</p>
      {question.options.map((optionText, i) => {
        const isSelected = selectedOptionIndex === i;
        return (
          <button
            type="button"
            key={optionText}
            className={`quiz-option ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectOption(questionIndex, i)}
          >
            <span>
              <i className="fa-regular fa-circle"></i> {optionText}
            </span>
            {isSelected && <i className="fa-solid fa-check"></i>}
          </button>
        );
      })}
    </div>
  );
}
