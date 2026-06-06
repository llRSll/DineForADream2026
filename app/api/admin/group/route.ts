import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";
import { groupQuestions } from "@/lib/ai";

export const POST = async () => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, text");

  if (!questions || questions.length === 0) {
    return NextResponse.json({ clusters: 0 });
  }

  const { clusters, engine, error } = await groupQuestions(questions);

  // Rebuild groups from scratch each run for a clean re-cluster.
  await supabase.from("questions").update({ group_id: null }).not("id", "is", null);
  await supabase.from("question_groups").delete().not("id", "is", null);

  for (const cluster of clusters) {
    const { data: group, error } = await supabase
      .from("question_groups")
      .insert({
        label: cluster.label,
        summary: cluster.summary || null,
        proposed_question: cluster.question || null,
        count: cluster.questionIds.length,
      })
      .select("id")
      .single();

    if (error || !group) continue;

    await supabase
      .from("questions")
      .update({ group_id: group.id })
      .in("id", cluster.questionIds);
  }

  return NextResponse.json({ clusters: clusters.length, engine, error });
};
