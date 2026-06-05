export type AnswerOption = "A" | "B" | "C" | "D";

export type Question = {
  id: number;
  title: string;
  options: [string, string, string, string];
  answer: AnswerOption;
  analysis: string;
};

export type Paper = {
  id: number;
  name: string;
  questions: Question[];
};

export type Category = {
  id: string;
  name: string;
  papers: Paper[];
};

export type QuestionBank = {
  categories: Category[];
};

export type PaperStatus = "not_started" | "in_progress" | "completed";

export type PaperListItem = {
  id: number;
  name: string;
  totalQuestions: number;
  status: PaperStatus;
  answeredCount: number;
  progressId: number | null;
  history: HistoryRecord[];
};

export type HistoryRecord = {
  id: number;
  score: number;
  totalQuestions: number;
  completedAt: string;
};

export type AnswerRecord = {
  questionId: number;
  selectedAnswer: AnswerOption | null;
  isCorrect: boolean | null;
};

export type ProgressDetail = {
  progressId: number;
  paperId: number;
  paperName: string;
  currentQuestionIndex: number;
  completed: boolean;
  score: number | null;
  totalQuestions: number;
  answers: AnswerRecord[];
};

export type ResultDetail = {
  progressId: number;
  paperId: number;
  paperName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  answers: Array<{
    questionId: number;
    questionIndex: number;
    title: string;
    options: [string, string, string, string];
    correctAnswer: AnswerOption;
    selectedAnswer: AnswerOption | null;
    isCorrect: boolean;
    analysis: string;
  }>;
};
