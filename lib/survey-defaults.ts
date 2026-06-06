import type { SurveyQuestionType } from "@/lib/types";

export type DefaultSurveyQuestion = {
  question: string;
  type: SurveyQuestionType;
  options: string[];
  allow_custom: boolean;
};

export const DEFAULT_SURVEY_QUESTIONS: DefaultSurveyQuestion[] = [
  {
    question: "Have you been to an OzGeeOm event before?",
    type: "single",
    options: ["Yes", "No", "This is my first"],
    allow_custom: false,
  },
  {
    question: "How would you rate tonight so far?",
    type: "single",
    options: ["Excellent", "Good", "Okay", "Disappointing"],
    allow_custom: false,
  },
  {
    question: "What would you like to see more of in the live auction?",
    type: "multi",
    options: [
      "Sporting memorabilia",
      "Wine & spirits",
      "Travel & experiences",
      "Art & collectibles",
      "Dining packages",
    ],
    allow_custom: true,
  },
  {
    question:
      "Do you feel the money you donate to OzGeeOm actually reaches people in need?",
    type: "single",
    options: ["Strongly agree", "Agree", "Not sure", "Disagree"],
    allow_custom: false,
  },
  {
    question: "Which parts of tonight's program did you enjoy most?",
    type: "multi",
    options: [
      "Welcome & drinks",
      "Live auction",
      "Impact stories",
      "Tonight's detailed format",
      "Dinner",
      "Q&A discussion",
    ],
    allow_custom: false,
  },
  {
    question: "For future events, what would you prefer?",
    type: "single",
    options: [
      "More guest speakers",
      "More detailed stories like tonight",
      "A mix of both",
    ],
    allow_custom: false,
  },
  {
    question: "What's one thing we could do better next year?",
    type: "text",
    options: [],
    allow_custom: false,
  },
  {
    question: "What would make you most likely to come back?",
    type: "text",
    options: [],
    allow_custom: false,
  },
];
