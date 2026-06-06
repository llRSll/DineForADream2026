import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";
import { ensureSurveySettings, seedDefaultSurveyQuestions } from "@/lib/survey-seed";

const questionTypeSchema = z.enum(["single", "multi", "text"]);

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    question: z.string().min(1),
    type: questionTypeSchema,
    options: z.array(z.string()).default([]),
    allow_custom: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("update"),
    questionId: z.string().uuid(),
    question: z.string().min(1),
    type: questionTypeSchema,
    options: z.array(z.string()).default([]),
    allow_custom: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("delete"),
    questionId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("reorder"),
    orderedIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    action: z.literal("setOpen"),
    is_open: z.boolean(),
  }),
  z.object({
    action: z.literal("setShowResults"),
    show_results: z.boolean(),
  }),
  z.object({
    action: z.literal("seed"),
  }),
]);

export const GET = async () => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  await ensureSurveySettings(supabase);

  const [{ data: settings }, { data: questions }, { data: answers }] =
    await Promise.all([
      supabase.from("survey_settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("survey_questions")
        .select("*")
        .order("position", { ascending: true }),
      supabase.from("survey_answers").select("*"),
    ]);

  return NextResponse.json({
    settings: settings ?? { is_open: false, show_results: false },
    questions: questions ?? [],
    answers: answers ?? [],
  });
};

export const POST = async (request: Request) => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  await ensureSurveySettings(supabase);
  const payload = parsed.data;

  if (payload.action === "seed") {
    const count = await seedDefaultSurveyQuestions(supabase);
    return NextResponse.json({ seeded: count });
  }

  if (payload.action === "setOpen") {
    await supabase
      .from("survey_settings")
      .update({ is_open: payload.is_open, updated_at: new Date().toISOString() })
      .not("id", "is", null);
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "setShowResults") {
    await supabase
      .from("survey_settings")
      .update({
        show_results: payload.show_results,
        updated_at: new Date().toISOString(),
      })
      .not("id", "is", null);
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "delete") {
    await supabase.from("survey_questions").delete().eq("id", payload.questionId);
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "reorder") {
    await Promise.all(
      payload.orderedIds.map((id, position) =>
        supabase.from("survey_questions").update({ position }).eq("id", id),
      ),
    );
    return NextResponse.json({ ok: true });
  }

  const cleanedOptions =
    payload.action === "create" || payload.action === "update"
      ? payload.options.map((option) => option.trim()).filter(Boolean)
      : [];

  if (payload.action === "create") {
    if (payload.type !== "text" && cleanedOptions.length < 2) {
      return NextResponse.json(
        { error: "Choice questions need at least 2 options." },
        { status: 400 },
      );
    }

    const { count } = await supabase
      .from("survey_questions")
      .select("*", { count: "exact", head: true });

    const { error } = await supabase.from("survey_questions").insert({
      question: payload.question.trim(),
      type: payload.type,
      options: cleanedOptions,
      allow_custom: payload.allow_custom,
      position: count ?? 0,
    });

    if (error) {
      return NextResponse.json({ error: "Could not create question." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.type !== "text" && cleanedOptions.length < 2) {
    return NextResponse.json(
      { error: "Choice questions need at least 2 options." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("survey_questions")
    .update({
      question: payload.question.trim(),
      type: payload.type,
      options: cleanedOptions,
      allow_custom: payload.allow_custom,
    })
    .eq("id", payload.questionId);

  if (error) {
    return NextResponse.json({ error: "Could not update question." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
};
