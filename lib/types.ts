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
