"use client";

/**
 * Interactive Readiness Check and Consolidated Mock Exam component.
 * Thin orchestrator — child components are code-split via next/dynamic.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flag } from "lucide-react";

// ─── Code-split child components ──────────────────────────────────────────
const ReadinessSetup = dynamic(() => import("./readiness-setup"), {
  loading: () => <div className="h-[600px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />,
});
const ReadinessQuestion = dynamic(() => import("./readiness-question"), {
  loading: () => <div className="h-[400px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />,
});
const ReadinessFeedback = dynamic(() => import("./readiness-feedback"), {
  loading: () => <div className="h-[500px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />,
});

// ─── Types ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Filipino",
  "Logical Reasoning"
] as const;

type SubjectType = typeof SUBJECTS[number];

interface Question {
  id: number;
  subject: SubjectType;
  difficulty: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

// ─── Question Bank Data ───────────────────────────────────────────────
const sampleData: Record<SubjectType, { questions: string[]; options: string[][]; correctAnswers: number[] }> = {
    "Mathematics": {
      questions: [
        "If a line passes through the points (2, 3) and (5, 9), what is its slope?",
        "What is the value of log base 2 of 64?",
        "Solve for x in the equation: log(x) + log(5) = 2 (where log is base 10).",
        "A box contains 4 red balls and 6 blue balls. What is the probability of drawing a red ball?",
        "What is the sum of the interior angles of a regular hexagon?",
      ],
      options: [
        ["2", "3", "4", "0.5"],
        ["6", "8", "5", "12"],
        ["20", "15", "10", "50"],
        ["2/5", "3/5", "1/2", "4/5"],
        ["720 degrees", "540 degrees", "360 degrees", "188 degrees"],
      ],
      correctAnswers: [0, 0, 0, 0, 0],
    },
    "Science": {
      questions: [
        "What is the chemical symbol for gold?",
        "Which of the following is a non-renewable source of energy?",
        "What is the speed of light in a vacuum, approximately?",
        "Which planet in our solar system is known for its prominent ring system?",
        "What force holds planets in their orbits around the Sun?",
      ],
      options: [
        ["Au", "Ag", "Fe", "Gd"],
        ["Coal", "Solar power", "Wind energy", "Hydroelectric energy"],
        ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
        ["Saturn", "Jupiter", "Neptune", "Uranus"],
        ["Gravitational force", "Electromagnetic force", "Nuclear force", "Centrifugal force"],
      ],
      correctAnswers: [0, 0, 0, 0, 0],
    },
    "English": {
      questions: [
        "What is the correct plural form of 'child'?",
        "Identify the figure of speech: 'The world is a stage.'",
        "Which sentence uses the correct subject-verb agreement?",
        "What is the antonym of 'benevolent'?",
        "Which literary device is used in 'The wind whispered through the trees'?",
      ],
      options: [
        ["Children", "Childs", "Childes", "Child"],
        ["Metaphor", "Simile", "Personification", "Hyperbole"],
        ["The team are playing well", "The team is playing well", "The team were playing well", "The team have been playing well"],
        ["Malevolent", "Generous", "Kind", "Altruistic"],
        ["Personification", "Simile", "Alliteration", "Onomatopoeia"],
      ],
      correctAnswers: [0, 0, 1, 0, 0],
    },
    "Filipino": {
      questions: [
        "Ano ang tamang salin ng 'Good morning' sa Filipino?",
        "Sino ang itinuturing na Ama ng Wikang Pambansa?",
        "Anong bahagi ng pananalita ang salitang 'mabilis'?",
        "'Ang bata ay umiiyak.' Anong uri ng pangungusap ito?",
        "Ano ang kahulugan ng salitang 'masagana'?",
      ],
      options: [
        ["Magandang umaga", "Magandang hapon", "Magandang gabi", "Magandang tanghali"],
        ["Manuel L. Quezon", "Jose Rizal", "Andres Bonifacio", "Emilio Aguinaldo"],
        ["Pang-uri", "Pang-abay", "Pangngalan", "Pandiwa"],
        ["Pasakalye", "Patanong", "Padamdam", "Pasalaysay"],
        ["Maunlad at sagana", "Mahirap at salat", "Mabagal at tahimik", "Maliit at payak"],
      ],
      correctAnswers: [0, 0, 0, 3, 0],
    },
    "Logical Reasoning": {
      questions: [
        "If all cats are mammals, and all mammals are warm-blooded, which of the following is true?",
        "Find the next number in the sequence: 3, 6, 12, 24, 48, ...",
        "Which word does NOT belong with the others?",
        "If BOOK is coded as 2151511 in a certain language, how is CAT coded?",
        "All apples in the basket are red. Some red fruits are sweet. Therefore:",
      ],
      options: [
        ["All cats are warm-blooded", "Some cats are not warm-blooded", "No mammals are cats", "All warm-blooded animals are cats"],
        ["96", "72", "64", "84"],
        ["Bicycle", "Car", "Airplane", "Steering wheel"],
        ["3120", "3119", "3122", "3210"],
        ["Some apples in the basket might be sweet", "All apples are sweet", "No apples are sweet", "Sweet fruits are always red"],
      ],
      correctAnswers: [0, 0, 3, 0, 0],
    },
  };

export default function ReadinessForm() {
  // ─── Per-subject question cache (WS-6: on-demand generation) ─────────────
  const questionCache = useRef<Map<SubjectType, Question[]>>(new Map());

  function generateSubjectQuestions(subject: SubjectType): Question[] {
    const cached = questionCache.current.get(subject);
    if (cached) return cached;

    const data = sampleData[subject];
    const questions: Question[] = [];
    const baseId = SUBJECTS.indexOf(subject) * 50 + 1;

    for (let i = 0; i < 50; i++) {
      const isSampleIndex = i < data.questions.length;
      const questionText = isSampleIndex
        ? data.questions[i]
        : `Diagnostic review item #${i + 1} for ${subject}. Analyze the criteria to determine the correct logical outcome for this specific scenario.`;
      
      const options = isSampleIndex
        ? data.options[i]
        : [
            `Option A: Primary selection for review item ${i + 1}`,
            `Option B: Secondary alternative for review item ${i + 1}`,
            `Option C: Tertiary option for review item ${i + 1}`,
            `Option D: Fourth alternative for review item ${i + 1}`
          ];

      const correctAnswer = isSampleIndex ? data.correctAnswers[i] : (i % 4);

      questions.push({
        id: baseId + i,
        subject,
        difficulty: 1 + (i % 5),
        questionText,
        options,
        correctAnswer,
      });
    }

    questionCache.current.set(subject, questions);
    return questions;
  }

  // Lazy-initialized question bank (still needed for mock exam — generates all 250)
  const masterQuestionBank = useMemo(() => {
    const bank: Question[] = [];
    for (const subject of SUBJECTS) {
      bank.push(...generateSubjectQuestions(subject));
    }
    return bank;
  }, []);

  // Config states
  const [view, setView] = useState<"setup" | "active" | "feedback">("setup");
  const [selectedType, setSelectedType] = useState<"diagnostics" | "mock">("diagnostics");
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectType[]>([...SUBJECTS]);
  const [itemCount, setItemCount] = useState<10 | 15 | 20 | 25>(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Active exam states
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedItems, setFlaggedItems] = useState<number[]>([]);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [activeSubject, setActiveSubject] = useState<SubjectType>("Mathematics");

  // Stable callbacks (declared before timer effect to avoid used-before-declaration)
  const handleSelectOption = useCallback((optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [activeIndex]: optionIndex,
    }));
  }, [activeIndex]);

  const handleNextQuestion = useCallback(() => {
    if (activeIndex < activeQuestions.length - 1) {
      setActiveIndex((prev) => prev + 1);
      if (selectedType === "diagnostics") {
        setTimeLeft(45);
      }
    } else {
      setView("feedback");
    }
  }, [activeIndex, activeQuestions.length, selectedType]);

  const handlePrevQuestion = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      if (selectedType === "diagnostics") {
        setTimeLeft(45);
      }
    }
  }, [activeIndex, selectedType]);

  // Timer Effect
  useEffect(() => {
    if (view !== "active") return;

    if (timeLeft <= 0) {
      if (selectedType === "diagnostics") {
        handleNextQuestion();
      } else {
        setView("feedback");
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, view, selectedType, handleNextQuestion]);

  // Sync active subject in mock exam when active question changes
  useEffect(() => {
    if (view === "active" && selectedType === "mock" && activeQuestions[activeIndex]) {
      setActiveSubject(activeQuestions[activeIndex].subject);
    }
  }, [activeIndex, activeQuestions, view, selectedType]);

  // Subject indices mappings for Option 2 (Mock Exam)
  const subjectStartIndex = (subj: SubjectType) => {
    const idx = SUBJECTS.indexOf(subj);
    return idx * 50;
  };

  const handleSubjectChange = (subject: SubjectType) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleStartExam = (typeOverride?: "diagnostics" | "mock") => {
    const examType = typeOverride || selectedType;
    if (examType === "diagnostics") {
      if (selectedSubjects.length === 0) {
        alert("Please select at least one subject to begin.");
        return;
      }

      let difficultyRange = [3];
      if (selectedDifficulty === "easy") difficultyRange = [1, 2];
      else if (selectedDifficulty === "medium") difficultyRange = [2, 3, 4];
      else if (selectedDifficulty === "hard") difficultyRange = [4, 5];

      let pool = masterQuestionBank.filter(
        (q) => selectedSubjects.includes(q.subject) && difficultyRange.includes(q.difficulty)
      );

      if (pool.length === 0) {
        pool = masterQuestionBank.filter((q) => selectedSubjects.includes(q.subject));
      }

      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(itemCount, pool.length));

      setActiveQuestions(selected);
      setActiveIndex(0);
      setSelectedAnswers({});
      setFlaggedItems([]);
      setTimeLeft(45);
      setView("active");
    } else {
      setActiveQuestions(masterQuestionBank);
      setActiveIndex(0);
      setSelectedAnswers({});
      setFlaggedItems([]);
      setTimeLeft(180 * 60);
      setActiveSubject("Mathematics");
      setView("active");
    }
  };

  const toggleFlag = () => {
    setFlaggedItems((prev) =>
      prev.includes(activeIndex)
        ? prev.filter((i) => i !== activeIndex)
        : [...prev, activeIndex]
    );
  };

  const handleFinishExam = () => {
    const unanswered = activeQuestions.length - Object.keys(selectedAnswers).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered questions. Are you sure you want to finish the exam?`)) {
        return;
      }
    }
    setView("feedback");
  };

  const handleRestart = () => {
    setView("setup");
    setSelectedAnswers({});
    setFlaggedItems([]);
    setActiveIndex(0);
  };

  // Computations
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressValue = activeQuestions.length > 0 ? Math.round((answeredCount / activeQuestions.length) * 100) : 0;

  const score = useMemo(() => {
    let correct = 0;
    activeQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  }, [activeQuestions, selectedAnswers]);

  const scorePercentage = useMemo(() => {
    if (activeQuestions.length === 0) return 0;
    return Math.round((score / activeQuestions.length) * 100);
  }, [score, activeQuestions]);

  const subjectScores = useMemo(() => {
    const scores: Record<SubjectType, { correct: number; total: number; answered: number }> = {
      "Mathematics": { correct: 0, total: 0, answered: 0 },
      "Science": { correct: 0, total: 0, answered: 0 },
      "English": { correct: 0, total: 0, answered: 0 },
      "Filipino": { correct: 0, total: 0, answered: 0 },
      "Logical Reasoning": { correct: 0, total: 0, answered: 0 },
    };

    activeQuestions.forEach((q, index) => {
      scores[q.subject].total += 1;
      const ans = selectedAnswers[index];
      if (ans !== undefined) {
        scores[q.subject].answered += 1;
        if (ans === q.correctAnswer) {
          scores[q.subject].correct += 1;
        }
      }
    });

    return scores;
  }, [activeQuestions, selectedAnswers]);

  const readinessDetails = useMemo(() => {
    if (scorePercentage >= 80) {
      return {
        level: "Highly Prepared",
        color: "bg-emerald-100 border-emerald-400 text-emerald-800",
        icon: <span className="text-emerald-600">✓</span>,
        text: "Exceptional! Your aptitude score demonstrates absolute core readiness to excel in complex scholarship grants like DOST-SEI, CHED Merit, or private foundation reviews."
      };
    } else if (scorePercentage >= 50) {
      return {
        level: "Needs Minor Review",
        color: "bg-amber-100 border-amber-400 text-amber-800",
        icon: <span className="text-amber-600">⚠</span>,
        text: "Good attempt! You meet basic competencies. A bit of focused review in weaker subject segments will solidify your competitiveness."
      };
    } else {
      return {
        level: "Needs Intensive Improvement",
        color: "bg-accent-rose/50 border-accent-rose",
        icon: <span className="text-red-600">⚠</span>,
        text: "Don't worry! This is a roadmap indicator. Focus on targeted study modules to strengthen your primary vocabulary, mathematical formulas, and scientific facts."
      };
    }
  }, [scorePercentage]);

  const studyRecommendations = useMemo(() => {
    const recs: string[] = [];
    Object.entries(subjectScores).forEach(([subj, stats]) => {
      const accuracy = stats.answered > 0 ? (stats.correct / stats.answered) * 100 : 0;
      if (stats.total > 0 && accuracy < 75) {
        if (subj === "Mathematics") recs.push("Mathematics: Practice linear equations, trigonometric ratios, logarithm conversions, and basic probability sets.");
        if (subj === "Science") recs.push("Science: Memorize key element configurations, chemical formula nomenclature, physics kinematics, and atmospheric stratification layers.");
        if (subj === "English") recs.push("English: Review grammar rules, literary devices, subject-verb agreement, and vocabulary building exercises.");
        if (subj === "Filipino") recs.push("Filipino: Practice grammar structures (balarila), figure of speech identification, and reading comprehension in Filipino.");
        if (subj === "Logical Reasoning") recs.push("Logical Reasoning: Strengthen deductive logic arguments, numerical pattern sequencing, and lexical classification filters.");
      }
    });

    if (recs.length === 0) {
      recs.push("Review all topics briefly to sustain your high performance across subjects!");
    }
    return recs;
  }, [subjectScores]);

  return (
    <div className="w-full mx-auto font-sans">
      <AnimatePresence mode="wait">
        
        {/* ── 1. SETUP CONFIGURATION LAYER ─────────────────────────────────── */}
        {view === "setup" && (
          <ReadinessSetup
            selectedSubjects={selectedSubjects}
            onSubjectChange={handleSubjectChange}
            itemCount={itemCount}
            onItemCountChange={setItemCount}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            onStartDiagnostics={() => {
              setSelectedType("diagnostics");
              handleStartExam("diagnostics");
            }}
            onStartMockExam={() => {
              setSelectedType("mock");
              handleStartExam("mock");
            }}
          />
        )}

        {/* ── 2. ACTIVE QUIZ/SIMULATION BOARD ──────────────────────────────── */}
        {view === "active" && activeQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full"
          >
            {selectedType === "diagnostics" ? (
              <ReadinessQuestion
                question={activeQuestions[activeIndex]}
                questionIndex={activeIndex}
                totalQuestions={activeQuestions.length}
                selectedAnswer={selectedAnswers[activeIndex]}
                onSelectOption={handleSelectOption}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                timeLeft={timeLeft}
                canGoNext={selectedAnswers[activeIndex] !== undefined}
                canGoPrev={activeIndex > 0}
              />
            ) : (
              // Option 2 Layout: Massive Mock Exam split viewport (sidebar navigation + matrix)
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left persistent subject navigator & question grid */}
                <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 max-h-[85vh] overflow-y-auto">
                  <div className="rounded-[2rem] border border-accent-muted/30 bg-[color:var(--theme-surface)] p-6 shadow-2xl space-y-5">
                    
                    {/* Header summary */}
                    <div className="flex justify-between items-start pb-4 border-b border-accent-muted/40">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[color:var(--theme-text-muted)] font-black">Simulation Map</p>
                        <p className="text-base font-black text-text-primary mt-1">{answeredCount} of 250 Completed</p>
                      </div>
                      <button
                        onClick={handleFinishExam}
                        className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md cursor-pointer transition-colors"
                      >
                        Finish Exam
                      </button>
                    </div>

                    {/* Subjects Menu */}
                    <div className="space-y-2">
                      {SUBJECTS.map((subj) => {
                        const start = subjectStartIndex(subj);
                        const answeredInSubj = Array.from({ length: 50 }, (_, i) => selectedAnswers[start + i] !== undefined).filter(Boolean).length;
                        const isFocus = activeSubject === subj;
                        
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => {
                              setActiveSubject(subj);
                              setActiveIndex(start);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                              isFocus
                                ? "bg-primary border-primary-hover text-white shadow-sm"
                                : "bg-[color:var(--theme-canvas)]/55 border-accent-periwinkle/30 text-[color:var(--theme-text-body)] hover:border-accent-periwinkle"
                            }`}
                          >
                            <span>{subj}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${isFocus ? "bg-white/20 text-white" : "bg-base-pastel text-text-primary"}`}>
                              {answeredInSubj}/50
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Questions Matrix scroll container */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--theme-text-muted)]">
                        {activeSubject} Matrix:
                      </p>
                      <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                        {Array.from({ length: 50 }).map((_, i) => {
                          const globalIdx = subjectStartIndex(activeSubject) + i;
                          const isActive = globalIdx === activeIndex;
                          const answered = selectedAnswers[globalIdx] !== undefined;
                          const flagged = flaggedItems.includes(globalIdx);

                          let stateClass = "bg-[color:var(--theme-canvas)] border-accent-periwinkle/35 text-[color:var(--theme-text-body)]";
                          if (flagged) {
                            stateClass = "bg-amber-300 border-amber-400 text-zinc-900";
                          } else if (isActive) {
                            stateClass = "bg-primary border-primary-hover text-white";
                          } else if (answered) {
                            stateClass = "bg-emerald-600 border-emerald-700 text-white";
                          }

                          return (
                            <button
                              key={globalIdx}
                              onClick={() => setActiveIndex(globalIdx)}
                              className={`aspect-square rounded-xl border text-[11px] font-black transition-all hover:scale-105 cursor-pointer ${stateClass}`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[color:var(--theme-text-body)] opacity-85 pt-3 border-t border-accent-muted/20">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded bg-primary" /> Active
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded bg-emerald-600" /> Answered
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded bg-[color:var(--theme-canvas)] border border-accent-periwinkle" /> Unattended
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded bg-amber-300" /> Flagged
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Right Question card panel */}
                <main className="lg:col-span-8 space-y-6">
                  {/* Timer widget & overall progress */}
                  <div className="rounded-[2rem] border border-accent-muted/30 bg-[color:var(--theme-surface)] p-6 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[color:var(--theme-text-muted)] font-black">Remaining Time</p>
                        <p className="text-2xl font-black text-text-primary">
                          {Math.floor(timeLeft / 3600)}h {Math.floor((timeLeft % 3600) / 60)}m {timeLeft % 60}s
                        </p>
                      </div>
                    </div>
                    <div className="w-full sm:max-w-xs space-y-2">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span>Completion Rate</span>
                        <span>{progressValue}%</span>
                      </div>
                      <div className="h-2.5 bg-base-pastel rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progressValue}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Question Container */}
                  <div className="rounded-[2rem] border border-accent-muted/30 bg-[color:var(--theme-surface)] p-6 sm:p-8 shadow-2xl">
                    <div className="flex justify-between items-center pb-4 mb-6 border-b border-accent-muted/35">
                      <span className="text-xs bg-[color:var(--theme-canvas)] border border-accent-periwinkle px-3 py-1 rounded-full font-bold text-text-primary">
                        {activeQuestions[activeIndex].subject}
                      </span>
                      <span className="text-xs text-[color:var(--theme-text-muted)] font-black uppercase tracking-widest">
                        Item {activeIndex - subjectStartIndex(activeQuestions[activeIndex].subject) + 1} of 50
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-text-primary mb-6 leading-relaxed">
                      {activeQuestions[activeIndex].questionText}
                    </h3>

                    <div className="space-y-3">
                      {activeQuestions[activeIndex].options.map((opt, idx) => {
                        const isSelected = selectedAnswers[activeIndex] === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(idx)}
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

                    {/* Navigation toolbar */}
                    <div className="mt-8 pt-6 border-t border-accent-muted/30 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={toggleFlag}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                          flaggedItems.includes(activeIndex)
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-[color:var(--theme-canvas)] border-accent-periwinkle text-[color:var(--theme-text-body)] hover:bg-amber-50 hover:border-amber-200"
                        }`}
                      >
                        <Flag className="h-4 w-4" />
                        {flaggedItems.includes(activeIndex) ? "Unflag" : "Flag for Review"}
                      </button>

                      <div className="flex gap-3">
                        <button
                          onClick={handlePrevQuestion}
                          disabled={activeIndex === 0}
                          className="px-4 py-2 bg-white rounded-xl text-xs font-bold border border-accent-muted text-zinc-700 hover:bg-base-pastel disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          disabled={selectedAnswers[activeIndex] === undefined}
                          className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-xl text-xs font-bold border border-accent-muted shadow-sm hover:bg-primary-hover cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            )}
          </motion.div>
        )}

        {/* ── 3. EVALUATION AND SCORE RESULTS FEEDBACK ──────────────────────── */}
        {view === "feedback" && (
          <ReadinessFeedback
            score={score}
            total={activeQuestions.length}
            scorePercentage={scorePercentage}
            subjectScores={subjectScores}
            readinessDetails={readinessDetails}
            studyRecommendations={studyRecommendations}
            onRestart={handleRestart}
          />
        )}
        
      </AnimatePresence>
    </div>
  );
}
