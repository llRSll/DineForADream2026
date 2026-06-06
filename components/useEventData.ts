"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  GroupedQuestions,
  Poll,
  Question,
  QuestionGroup,
  ScheduleItem,
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
  loading: boolean;
};

export const useEventData = (): EventData => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (supabase: SupabaseClient) => {
    const [pollRes, voteRes, questionRes, groupRes, scheduleRes] =
      await Promise.all([
        supabase.from("polls").select("*").order("created_at", { ascending: false }),
        supabase.from("votes").select("*"),
        supabase.from("questions").select("*").order("created_at", { ascending: true }),
        supabase.from("question_groups").select("*").order("count", { ascending: false }),
        supabase.from("schedule_items").select("*").order("position", { ascending: true }),
      ]);

    setPolls((pollRes.data as Poll[]) ?? []);
    setVotes((voteRes.data as Vote[]) ?? []);
    setQuestions((questionRes.data as Question[]) ?? []);
    setGroups((groupRes.data as QuestionGroup[]) ?? []);
    setSchedule((scheduleRes.data as ScheduleItem[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    loadAll(supabase);

    const channel = supabase
      .channel("event-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, () =>
        loadAll(supabase),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () =>
        loadAll(supabase),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, () =>
        loadAll(supabase),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "question_groups" }, () =>
        loadAll(supabase),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_items" }, () =>
        loadAll(supabase),
      )
      .subscribe();

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
    loading,
  };
};
