"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  GroupedQuestions,
  GroupedSurveyAnswers,
  Poll,
  Question,
  QuestionGroup,
  ScheduleItem,
  SurveyAnswer,
  SurveyAnswerGroup,
  SurveyChoiceResult,
  SurveyQuestion,
  SurveySettings,
  Vote,
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type EventData = {
  polls: Poll[];
  activePoll: Poll | null;
  votes: Vote[];
  questions: Question[];
  groups: QuestionGroup[];
  schedule: ScheduleItem[];
  groupedQuestions: GroupedQuestions[];
  ungroupedQuestions: Question[];
  pollCounts: number[];
  pollTotal: number;
  surveySettings: SurveySettings;
  surveyQuestions: SurveyQuestion[];
  surveyAnswers: SurveyAnswer[];
  surveyGroups: SurveyAnswerGroup[];
  groupedSurveyAnswers: GroupedSurveyAnswers[];
  surveyChoiceResults: SurveyChoiceResult[];
  surveyResponseCount: number;
  loading: boolean;
};

const defaultSettings: SurveySettings = {
  id: "",
  is_open: false,
  show_results: false,
  updated_at: "",
};

export const useEventData = (): EventData => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [surveySettings, setSurveySettings] = useState<SurveySettings | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswer[]>([]);
  const [surveyGroups, setSurveyGroups] = useState<SurveyAnswerGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (supabase: SupabaseClient) => {
    const [
      pollRes,
      voteRes,
      questionRes,
      groupRes,
      scheduleRes,
      surveySettingsRes,
      surveyQuestionsRes,
      surveyAnswersRes,
      surveyGroupsRes,
    ] = await Promise.all([
      supabase.from("polls").select("*").order("created_at", { ascending: false }),
      supabase.from("votes").select("*"),
      supabase.from("questions").select("*").order("created_at", { ascending: true }),
      supabase.from("question_groups").select("*").order("count", { ascending: false }),
      supabase.from("schedule_items").select("*").order("position", { ascending: true }),
      supabase.from("survey_settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("survey_questions")
        .select("*")
        .order("position", { ascending: true }),
      supabase.from("survey_answers").select("*"),
      supabase.from("survey_answer_groups").select("*").order("count", { ascending: false }),
    ]);

    setPolls((pollRes.data as Poll[]) ?? []);
    setVotes((voteRes.data as Vote[]) ?? []);
    setQuestions((questionRes.data as Question[]) ?? []);
    setGroups((groupRes.data as QuestionGroup[]) ?? []);
    setSchedule((scheduleRes.data as ScheduleItem[]) ?? []);
    setSurveySettings((surveySettingsRes.data as SurveySettings) ?? null);
    setSurveyQuestions((surveyQuestionsRes.data as SurveyQuestion[]) ?? []);
    setSurveyAnswers((surveyAnswersRes.data as SurveyAnswer[]) ?? []);
    setSurveyGroups((surveyGroupsRes.data as SurveyAnswerGroup[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    loadAll(supabase);

    const tables = [
      "polls",
      "votes",
      "questions",
      "question_groups",
      "schedule_items",
      "survey_settings",
      "survey_questions",
      "survey_answers",
      "survey_answer_groups",
    ] as const;

    const channel = supabase.channel("event-realtime");
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => loadAll(supabase),
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  const activePoll = polls.find((p) => p.is_open) ?? null;

  const pollCounts = activePoll
    ? activePoll.options.map(
        (_, index) =>
          votes.filter(
            (v) => v.poll_id === activePoll.id && v.option_index === index,
          ).length,
      )
    : [];
  const pollTotal = pollCounts.reduce((sum, c) => sum + c, 0);

  const groupedQuestions: GroupedQuestions[] = groups
    .map((group) => ({
      ...group,
      questions: questions.filter((q) => q.group_id === group.id),
    }))
    .filter((g) => g.questions.length > 0)
    .sort((a, b) => b.questions.length - a.questions.length);

  const ungroupedQuestions = questions.filter((q) => q.group_id === null);

  const groupedSurveyAnswers: GroupedSurveyAnswers[] = surveyGroups
    .map((group) => ({
      ...group,
      answers: surveyAnswers.filter((answer) => answer.group_id === group.id),
    }))
    .filter((group) => group.answers.length > 0)
    .sort((a, b) => b.answers.length - a.answers.length);

  const surveyChoiceResults: SurveyChoiceResult[] = surveyQuestions
    .filter((question) => question.type === "single" || question.type === "multi")
    .map((question) => {
      const answers = surveyAnswers.filter((answer) => answer.question_id === question.id);
      const counts = question.options.map((_, index) =>
        answers.reduce((sum, answer) => {
          const indices = answer.option_indices ?? [];
          return sum + (indices.includes(index) ? 1 : 0);
        }, 0),
      );
      const customTexts = answers
        .map((answer) => answer.custom_text?.trim())
        .filter((text): text is string => Boolean(text));

      return {
        question,
        counts,
        customCount: customTexts.length,
        customTexts,
        respondentCount: answers.length,
      };
    });

  const surveyResponseCount = new Set(surveyAnswers.map((answer) => answer.attendee_id))
    .size;

  return {
    polls,
    activePoll,
    votes,
    questions,
    groups,
    schedule,
    groupedQuestions,
    ungroupedQuestions,
    pollCounts,
    pollTotal,
    surveySettings: surveySettings ?? defaultSettings,
    surveyQuestions,
    surveyAnswers,
    surveyGroups,
    groupedSurveyAnswers,
    surveyChoiceResults,
    surveyResponseCount,
    loading,
  };
};
