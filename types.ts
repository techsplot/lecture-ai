export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Badge {
  name: string;
  description: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface ProblemSolvingChallenge {
  scenario: string;
  task: string;
}

export interface Concept {
  title: string;
  summary: string;
  story_scene: string;
  image_prompt: string;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  badge: Badge;
  narration: string;
  problem_solving_challenge: ProblemSolvingChallenge;
}

export interface VisualTaskItem {
  term: string;
  image_prompt: string;
}

export interface ModuleData {
  simple_summary: string;
  visual_task: VisualTaskItem[];
  concepts: Concept[];
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
}

export type QuizAnswers = Record<number, Record<number, { selected: string; isCorrect: boolean }>>;

export type SelectedMedia = File | YouTubeVideo;