export type ActivityType =
  | "lesson"
  | "multiple_choice"
  | "quiz"
  | "fill_in_the_blank"
  | "coding_challenge"
  | "debugging_exercise"
  | "project";
export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  type: ActivityType;
  position: number;
  body: string;
  example: string;
  instructions: string;
  xp: number;
  duration_minutes: number;
  license: string;
  attribution: string;
  source_url: string;
  modifications?: string[];
};
export type Module = { id: string; title: string; position: number };
export type Progress = {
  lesson_id: string;
  completed_at: string | null;
  draft_code: string | null;
  hints_revealed: number;
  project_steps: TestResult[];
};
export type TestResult = {
  label: string;
  passed: boolean;
  error?: string;
  actual?: unknown;
};
export type Question = {
  id: string;
  prompt: string;
  kind: "choice" | "blank";
  answer_options: {
    id: string;
    label: string;
    value: string;
    position: number;
  }[];
};
export type Challenge = {
  starter_code: string;
  steps: string[];
  language: string;
};
export type Settings = {
  goal: string;
  languages: string[];
  daily_goal: number;
  dark_mode: boolean;
  sound: boolean;
  leaderboard_visible: boolean;
};
export type Attempt = {
  id: string;
  lesson_id: string;
  status: string;
  results: TestResult[];
  created_at: string;
  submission: { code?: string };
};
export type LearningData = {
  lessons: Lesson[];
  modules: Module[];
  progress: Progress[];
  prerequisites: { lesson_id: string; required_lesson_id: string }[];
};
