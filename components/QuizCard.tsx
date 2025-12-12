import React, { useState } from 'react';
import { QuizJson } from '../types';

interface QuizCardProps {
  quizData: QuizJson;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quizData }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  const handleSelect = (idx: number, val: string) => {
    setAnswers(prev => ({ ...prev, [idx]: val }));
  };

  const checkAnswer = (idx: number) => {
    setShowResults(prev => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="space-y-6">
      {quizData.questions.map((q, idx) => {
        const isCorrect = answers[idx] === q.answer;
        const revealed = showResults[idx];

        return (
          <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Q{idx + 1}</span>
              {revealed && (
                <span className={`text-xs font-bold px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isCorrect ? '正解' : '不正解'}
                </span>
              )}
            </div>
            <p className="text-gray-900 font-medium mb-4">{q.q}</p>

            {q.type === 'mcq' && q.choices ? (
              <div className="space-y-2">
                {q.choices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => !revealed && handleSelect(idx, choice)}
                    disabled={revealed}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm transition-colors border ${
                      answers[idx] === choice 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${revealed && choice === q.answer ? '!bg-green-50 !border-green-500 !text-green-800' : ''}`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="回答を入力..."
                  disabled={revealed}
                  value={answers[idx] || ''}
                  onChange={(e) => handleSelect(idx, e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
            )}

            {!revealed ? (
              <button
                onClick={() => checkAnswer(idx)}
                disabled={!answers[idx]}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                回答する
              </button>
            ) : (
              <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-700 border-l-4 border-indigo-400">
                <p className="font-bold mb-1">解説</p>
                <p>{q.explain}</p>
                {!isCorrect && <p className="mt-2 text-red-600">正解: {q.answer}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};