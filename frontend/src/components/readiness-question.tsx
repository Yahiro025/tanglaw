"use client";

import React from "react";
import { Timer } from "lucide-react";

interface Question {
  id: number;
  subject: "Mathematics" | "Science" | "English" | "Filipino" | "Logical Reasoning";
  difficulty: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface ReadinessQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | undefined;
  onSelectOption: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  timeLeft: number;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export default function ReadinessQuestion({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectOption,
  onNext,
  onPrev,
  timeLeft,
  canGoNext,
  canGoPrev,
}: ReadinessQuestionProps) {
  return (
    <div className="max-w-3xl mx-auto rounded-[2rem] border border-accent-muted/40 bg-[color:var(--theme-surface)] shadow-2xl overflow-hidden">
      <div className="bg-[color:var(--theme-canvas)] px-6 py-4 flex items-center justify-between border-b border-accent-periwinkle">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[color:var(--theme-text-muted)] uppercase tracking-widest">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[color:var(--theme-canvas)] border border-accent-periwinkle/80 px-2 py-0.5 rounded-full font-bold text-text-primary">
              {question.subject}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[color:var(--theme-canvas)] px-3 py-1.5 rounded-full border border-accent-periwinkle">
          <Timer className={`h-4 w-4 ${timeLeft < 10 ? "text-red-500 animate-pulse" : "text-text-primary"}`} />
          <span className={`text-sm font-black ${timeLeft < 10 ? "text-red-500" : "text-text-primary"}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <div className="w-full bg-[color:var(--theme-borders-system)]/25 h-1">
        <div
          className={`h-full transition-all duration-1000 ${timeLeft < 10 ? "bg-red-500" : "bg-primary-hover"}`}
          style={{ width: `${(timeLeft / 45) * 100}%` }}
        />
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-text-primary mb-6 leading-relaxed">
          {question.questionText}
        </h3>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => onSelectOption(idx)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-primary border-primary-hover text-white font-bold shadow-sm"
                    : "bg-[color:var(--theme-surface)] border-accent-muted/30 text-[color:var(--theme-text-body)] hover:border-accent-periwinkle hover:bg-[color:var(--theme-canvas)]"
                }`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-xs font-bold ${
                  isSelected
                    ? "bg-white text-primary"
                    : "border-white/10 bg-[color:var(--theme-canvas)]/90 text-[color:var(--theme-text-muted)]"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[color:var(--theme-canvas)] border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-xs font-bold border border-accent-muted text-zinc-700 hover:bg-base-pastel disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold border border-accent-muted shadow-sm hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {questionIndex < totalQuestions - 1 ? "Next Item" : "Finish Assessment"}
        </button>
      </div>
    </div>
  );
}
