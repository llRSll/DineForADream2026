export type Attendee = {
  id: string;
  name: string;
  email: string;
  table_name: string | null;
  company: string | null;
  created_at: string;
};

export type Poll = {
  id: string;
  question: string;
  options: string[];
  is_open: boolean;
  created_at: string;
};

export type Vote = {
  id: string;
  poll_id: string;
  attendee_id: string;
  option_index: number;
  created_at: string;
};

export type PollResults = {
  poll: Poll;
  counts: number[];
  total: number;
};

export type QuestionGroup = {
  id: string;
  label: string;
  summary: string | null;
  proposed_question: string | null;
  count: number;
  created_at: string;
};

export type Question = {
  id: string;
  text: string;
  attendee_id: string | null;
  group_id: string | null;
  created_at: string;
};

export type GroupedQuestions = QuestionGroup & {
  questions: Question[];
};

export type ScheduleItem = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  speaker: string | null;
  description: string | null;
  position: number;
  created_at: string;
};

export type SurveyQuestionType = "single" | "multi" | "text";

export type SurveySettings = {
  id: string;
  is_open: boolean;
  show_results: boolean;
  updated_at: string;
};

export type SurveyQuestion = {
  id: string;
  question: string;
  type: SurveyQuestionType;
  options: string[];
  allow_custom: boolean;
  position: number;
  created_at: string;
};

export type SurveyAnswer = {
  id: string;
  question_id: string;
  attendee_id: string;
  option_indices: number[] | null;
  custom_text: string | null;
  group_id: string | null;
  created_at: string;
};

export type SurveyAnswerGroup = {
  id: string;
  question_id: string;
  label: string;
  summary: string | null;
  proposed_summary: string | null;
  count: number;
  created_at: string;
};

export type GroupedSurveyAnswers = SurveyAnswerGroup & {
  answers: SurveyAnswer[];
};

export type SurveyChoiceResult = {
  question: SurveyQuestion;
  counts: number[];
  customCount: number;
  customTexts: string[];
  respondentCount: number;
};
