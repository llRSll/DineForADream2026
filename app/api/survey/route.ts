import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getAttendeeId } from "@/lib/session";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  optionIndices: z.array(z.number().int().min(0)).optional(),
  customText: z.string().max(500).optional(),
});

export const GET = async () => {
  const attendeeId = await getAttendeeId();
  if (!attendeeId) {
    return NextResponse.json({ error: "Please sign up first." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [{ data: settings }, { data: questions }, { data: answers }] =
    await Promise.all([
      supabase.from("survey_settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("survey_questions")
        .select("*")
        .order("position", { ascending: true }),
      supabase
        .from("survey_answers")
        .select("*")
        .eq("attendee_id", attendeeId),
    ]);

  if (!settings?.is_open) {
    return NextResponse.json({
      open: false,
      showResults: settings?.show_results ?? false,
      questions: [],
      answers: [],
    });
  }

  return NextResponse.json({
    open: true,
    showResults: settings.show_results,
    questions: questions ?? [],
    answers: answers ?? [],
  });
};

export const POST = async (request: Request) => {
  const attendeeId = await getAttendeeId();
  if (!attendeeId) {
    return NextResponse.json({ error: "Please sign up first." }, { status: 401 });
  }

  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { questionId, optionIndices, customText } = parsed.data;

  const [{ data: settings }, { data: question }] = await Promise.all([
    supabase.from("survey_settings").select("is_open").limit(1).maybeSingle(),
    supabase.from("survey_questions").select("*").eq("id", questionId).maybeSingle(),
  ]);

  if (!settings?.is_open) {
    return NextResponse.json({ error: "Survey is closed." }, { status: 409 });
  }
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  if (question.type === "text") {
    const text = customText?.trim();
    if (!text) {
      return NextResponse.json({ error: "Please enter a response." }, { status: 400 });
    }

    const { error } = await supabase.from("survey_answers").upsert(
      {
        question_id: questionId,
        attendee_id: attendeeId,
        option_indices: null,
        custom_text: text,
        group_id: null,
      },
      { onConflict: "question_id,attendee_id" },
    );

    if (error) {
      return NextResponse.json({ error: "Could not save answer." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const indices = optionIndices ?? [];
  if (indices.length === 0 && !customText?.trim()) {
    return NextResponse.json({ error: "Please select an option." }, { status: 400 });
  }

  for (const index of indices) {
    if (index >= question.options.length) {
      return NextResponse.json({ error: "Invalid option." }, { status: 400 });
    }
  }

  if (question.type === "single" && indices.length > 1) {
    return NextResponse.json({ error: "Pick one option only." }, { status: 400 });
  }

  const { error } = await supabase.from("survey_answers").upsert(
    {
      question_id: questionId,
      attendee_id: attendeeId,
      option_indices: indices,
      custom_text: question.allow_custom ? customText?.trim() || null : null,
      group_id: null,
    },
    { onConflict: "question_id,attendee_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Could not save answer." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
};
