import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SURVEY_QUESTIONS } from "@/lib/survey-defaults";

export const ensureSurveySettings = async (
  supabase: SupabaseClient,
): Promise<void> => {
  const { count } = await supabase
    .from("survey_settings")
    .select("*", { count: "exact", head: true });

  if (!count) {
    await supabase.from("survey_settings").insert({ is_open: false, show_results: false });
  }
};

export const seedDefaultSurveyQuestions = async (
  supabase: SupabaseClient,
): Promise<number> => {
  const { count } = await supabase
    .from("survey_questions")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return 0;

  const rows = DEFAULT_SURVEY_QUESTIONS.map((item, index) => ({
    question: item.question,
    type: item.type,
    options: item.options,
    allow_custom: item.allow_custom,
    position: index,
  }));

  const { error } = await supabase.from("survey_questions").insert(rows);
  if (error) throw error;
  return rows.length;
};
