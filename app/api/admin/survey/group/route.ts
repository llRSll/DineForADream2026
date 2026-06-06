import { NextResponse } from "next/server";
import { z } from "zod";
import { groupSurveyResponses } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";

const bodySchema = z.object({
  questionId: z.string().uuid(),
});

export const POST = async (request: Request) => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { questionId } = parsed.data;

  const { data: question } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("id", questionId)
    .maybeSingle();

  if (!question || question.type !== "text") {
    return NextResponse.json({ error: "Not a text question." }, { status: 400 });
  }

  const { data: answers } = await supabase
    .from("survey_answers")
    .select("id, custom_text")
    .eq("question_id", questionId)
    .not("custom_text", "is", null);

  if (!answers || answers.length === 0) {
    return NextResponse.json({ clusters: 0 });
  }

  const raw = answers
    .filter((answer) => answer.custom_text?.trim())
    .map((answer) => ({ id: answer.id, text: answer.custom_text!.trim() }));

  const { clusters, engine, error } = await groupSurveyResponses(
    question.question,
    raw,
  );

  await supabase
    .from("survey_answers")
    .update({ group_id: null })
    .eq("question_id", questionId);
  await supabase.from("survey_answer_groups").delete().eq("question_id", questionId);

  for (const cluster of clusters) {
    const { data: group, error: groupError } = await supabase
      .from("survey_answer_groups")
      .insert({
        question_id: questionId,
        label: cluster.label,
        summary: cluster.summary || null,
        proposed_summary: cluster.question || null,
        count: cluster.questionIds.length,
      })
      .select("id")
      .single();

    if (groupError || !group) continue;

    await supabase
      .from("survey_answers")
      .update({ group_id: group.id })
      .in("id", cluster.questionIds);
  }

  return NextResponse.json({ clusters: clusters.length, engine, error });
};
