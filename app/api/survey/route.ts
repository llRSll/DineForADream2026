import { NextResponse } from "next/server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";

import { getAttendeeId } from "@/lib/session";

import type { SurveyQuestion } from "@/lib/types";



const answerSchema = z.object({

  questionId: z.string().uuid(),

  optionIndices: z.array(z.number().int().min(0)).optional(),

  customText: z.string().max(500).optional(),

});



const submitSchema = z.union([

  answerSchema,

  z.object({ answers: z.array(answerSchema).min(1) }),

]);



type AnswerInput = z.infer<typeof answerSchema>;



const sameIndices = (a: number[] | null | undefined, b: number[] | null | undefined) => {

  const left = [...(a ?? [])].sort((x, y) => x - y);

  const right = [...(b ?? [])].sort((x, y) => x - y);

  return left.length === right.length && left.every((value, index) => value === right[index]);

};



const saveAnswer = async (

  supabase: ReturnType<typeof createAdminClient>,

  attendeeId: string,

  question: SurveyQuestion,

  input: AnswerInput,

) => {

  const { questionId, optionIndices, customText } = input;



  const { data: existing } = await supabase

    .from("survey_answers")

    .select("custom_text, option_indices, group_id")

    .eq("question_id", questionId)

    .eq("attendee_id", attendeeId)

    .maybeSingle();



  if (question.type === "text") {

    const text = customText?.trim();

    if (!text) {

      return { ok: false as const, error: `Please answer: ${question.question}` };

    }



    const contentChanged = existing?.custom_text?.trim() !== text;

    const { error } = await supabase.from("survey_answers").upsert(

      {

        question_id: questionId,

        attendee_id: attendeeId,

        option_indices: null,

        custom_text: text,

        group_id: contentChanged ? null : (existing?.group_id ?? null),

      },

      { onConflict: "question_id,attendee_id" },

    );



    if (error) {

      return { ok: false as const, error: "Could not save answer." };

    }

    return { ok: true as const };

  }



  const indices = optionIndices ?? [];

  if (indices.length === 0 && !customText?.trim()) {

    return { ok: false as const, error: `Please answer: ${question.question}` };

  }



  for (const index of indices) {

    if (index >= question.options.length) {

      return { ok: false as const, error: "Invalid option." };

    }

  }



  if (question.type === "single" && indices.length > 1) {

    return { ok: false as const, error: "Pick one option only." };

  }



  const nextCustom = question.allow_custom ? customText?.trim() || null : null;

  const contentChanged =

    !sameIndices(existing?.option_indices, indices) ||

    (existing?.custom_text?.trim() ?? null) !== nextCustom;



  const { error } = await supabase.from("survey_answers").upsert(

    {

      question_id: questionId,

      attendee_id: attendeeId,

      option_indices: indices,

      custom_text: nextCustom,

      group_id: contentChanged ? null : (existing?.group_id ?? null),

    },

    { onConflict: "question_id,attendee_id" },

  );



  if (error) {

    return { ok: false as const, error: "Could not save answer." };

  }

  return { ok: true as const };

};



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



  const parsed = submitSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {

    return NextResponse.json({ error: "Invalid answer" }, { status: 400 });

  }



  const supabase = createAdminClient();

  const inputs = "answers" in parsed.data ? parsed.data.answers : [parsed.data];



  const [{ data: settings }, { data: questions }] = await Promise.all([

    supabase.from("survey_settings").select("is_open").limit(1).maybeSingle(),

    supabase.from("survey_questions").select("*"),

  ]);



  if (!settings?.is_open) {

    return NextResponse.json({ error: "Survey is closed." }, { status: 409 });

  }



  const questionMap = new Map(

    (questions ?? []).map((question) => [question.id, question as SurveyQuestion]),

  );



  for (const input of inputs) {

    const question = questionMap.get(input.questionId);

    if (!question) {

      return NextResponse.json({ error: "Question not found." }, { status: 404 });

    }



    const result = await saveAnswer(supabase, attendeeId, question, input);

    if (!result.ok) {

      return NextResponse.json({ error: result.error }, { status: 400 });

    }

  }



  return NextResponse.json({ ok: true, saved: inputs.length });

};

