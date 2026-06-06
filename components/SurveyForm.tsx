"use client";



import { useEffect, useState } from "react";

import type { SurveyAnswer, SurveyQuestion } from "@/lib/types";



type SurveyFormProps = {

  onSaved?: () => void;

};



type SurveyPayload = {

  open: boolean;

  showResults: boolean;

  questions: SurveyQuestion[];

  answers: SurveyAnswer[];

};



type Draft = { indices: number[]; customText: string };



const inputClassName =

  "w-full rounded-xl border border-stage-border bg-white px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";



const isQuestionComplete = (question: SurveyQuestion, draft: Draft) => {

  if (question.type === "text") {

    return draft.customText.trim().length > 0;

  }

  if (draft.indices.length > 0) {

    return true;

  }

  return question.allow_custom && draft.customText.trim().length > 0;

};



const SurveyForm = ({ onSaved }: SurveyFormProps) => {

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  const [answersByQuestion, setAnswersByQuestion] = useState<

    Record<string, SurveyAnswer>

  >({});

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [editing, setEditing] = useState(false);



  const loadSurvey = async () => {

    setLoading(true);

    const response = await fetch("/api/survey");

    if (response.status === 401) {

      setOpen(false);

      setLoading(false);

      return;

    }



    const body = (await response.json()) as SurveyPayload;

    setOpen(body.open);

    setQuestions(body.questions ?? []);



    const answerMap: Record<string, SurveyAnswer> = {};

    const draftMap: Record<string, Draft> = {};



    for (const answer of body.answers ?? []) {

      answerMap[answer.question_id] = answer;

      draftMap[answer.question_id] = {

        indices: answer.option_indices ?? [],

        customText: answer.custom_text ?? "",

      };

    }



    for (const question of body.questions ?? []) {

      if (!draftMap[question.id]) {

        draftMap[question.id] = { indices: [], customText: "" };

      }

    }



    setAnswersByQuestion(answerMap);

    setDrafts(draftMap);

    setSubmitted((body.answers ?? []).length >= (body.questions ?? []).length);

    setLoading(false);

  };



  useEffect(() => {

    loadSurvey();

  }, []);



  const handleSubmit = async () => {

    setError(null);



    const incomplete = questions.filter(

      (question) => !isQuestionComplete(question, drafts[question.id] ?? { indices: [], customText: "" }),

    );

    if (incomplete.length > 0) {

      setError(

        `Please answer all ${questions.length} questions before submitting.`,

      );

      return;

    }



    setSubmitting(true);



    const response = await fetch("/api/survey", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        answers: questions.map((question) => {

          const draft = drafts[question.id] ?? { indices: [], customText: "" };

          return {

            questionId: question.id,

            optionIndices: question.type === "text" ? undefined : draft.indices,

            customText:

              question.type === "text"

                ? draft.customText

                : question.allow_custom

                  ? draft.customText

                  : undefined,

          };

        }),

      }),

    });



    setSubmitting(false);



    if (!response.ok) {

      const body = await response.json().catch(() => ({}));

      setError(body.error ?? "Could not submit survey");

      return;

    }



    setSubmitted(true);

    setEditing(false);

    await loadSurvey();

    onSaved?.();

  };



  const handleToggleOption = (question: SurveyQuestion, index: number) => {

    setDrafts((prev) => {

      const current = prev[question.id] ?? { indices: [], customText: "" };

      if (question.type === "single") {

        return { ...prev, [question.id]: { ...current, indices: [index] } };

      }



      const next = current.indices.includes(index)

        ? current.indices.filter((value) => value !== index)

        : [...current.indices, index];

      return { ...prev, [question.id]: { ...current, indices: next } };

    });

  };



  if (loading) {

    return (

      <div className="panel rounded-3xl p-7 text-center text-ink-muted">

        Loading survey…

      </div>

    );

  }



  if (!open) {

    return (

      <div className="panel flex flex-col items-center rounded-3xl p-7 text-center">

        <p className="font-display text-lg text-ink">Survey not open yet</p>

        <p className="mt-1 text-sm text-ink-muted">

          Your host will open the evening survey shortly. You can still ask

          questions and check the agenda in the meantime.

        </p>

      </div>

    );

  }



  if (submitted && !editing) {

    return (

      <div className="panel flex flex-col items-center rounded-3xl p-8 text-center">

        <span

          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-2xl text-brand"

          aria-hidden="true"

        >

          ✓

        </span>

        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">

          Thank you!

        </h2>

        <p className="mt-2 max-w-sm text-sm text-ink-muted">

          Your feedback has been submitted. You&apos;re in the draw for the

          hamper — good luck!

        </p>

        <button

          type="button"

          onClick={() => setEditing(true)}

          className="mt-6 rounded-xl border border-stage-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"

        >

          Edit my responses

        </button>

      </div>

    );

  }



  const completedCount = questions.filter((question) =>

    isQuestionComplete(question, drafts[question.id] ?? { indices: [], customText: "" }),

  ).length;

  const previouslySubmitted = Object.keys(answersByQuestion).length > 0;



  return (

    <div className="flex flex-col gap-5">

      <div className="panel rounded-3xl p-7">

        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">

          Tonight&apos;s survey

        </p>

        <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">

          Share your feedback

        </h2>

        <p className="mt-2 text-sm text-ink-muted">

          Please fill in all questions, then tap submit once at the end. Results

          will be shared at the end of the evening.

        </p>

        <p className="mt-3 text-sm font-medium text-brand">

          {completedCount} of {questions.length} ready to submit

        </p>

      </div>



      {questions.map((question, index) => {

        const draft = drafts[question.id] ?? { indices: [], customText: "" };

        const complete = isQuestionComplete(question, draft);



        return (

          <section key={question.id} className="panel rounded-3xl p-7">

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">

                  Question {index + 1}

                </p>

                <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-ink">

                  {question.question}

                </h3>

              </div>

              {complete ? (

                <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand">

                  Ready

                </span>

              ) : null}

            </div>



            {question.type === "text" ? (

              <textarea

                value={draft.customText}

                onChange={(event) =>

                  setDrafts((prev) => ({

                    ...prev,

                    [question.id]: {

                      ...(prev[question.id] ?? { indices: [], customText: "" }),

                      customText: event.target.value,

                    },

                  }))

                }

                rows={3}

                maxLength={500}

                aria-label={question.question}

                placeholder="Your thoughts…"

                className={`mt-4 ${inputClassName}`}

              />

            ) : (

              <div className="mt-4 flex flex-col gap-2.5">

                {question.options.map((option, optionIndex) => {

                  const selected = draft.indices.includes(optionIndex);

                  return (

                    <button

                      key={optionIndex}

                      type="button"

                      onClick={() => handleToggleOption(question, optionIndex)}

                      aria-pressed={selected}

                      className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${

                        selected

                          ? "border-brand bg-brand-light text-brand"

                          : "border-stage-border bg-white text-ink hover:border-brand/40"

                      }`}

                    >

                      {option}

                    </button>

                  );

                })}



                {question.allow_custom ? (

                  <input

                    type="text"

                    value={draft.customText}

                    onChange={(event) =>

                      setDrafts((prev) => ({

                        ...prev,

                        [question.id]: {

                          ...(prev[question.id] ?? { indices: [], customText: "" }),

                          customText: event.target.value,

                        },

                      }))

                    }

                    maxLength={120}

                    aria-label={`Custom answer for ${question.question}`}

                    placeholder="Add your own option…"

                    className={inputClassName}

                  />

                ) : null}

              </div>

            )}

          </section>

        );

      })}



      {error ? <p className="text-sm text-accent-red">{error}</p> : null}



      <button

        type="button"

        onClick={handleSubmit}

        disabled={submitting || completedCount < questions.length}

        className="rounded-2xl bg-brand px-6 py-4 text-base font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"

      >

        {submitting

          ? "Submitting…"

          : previouslySubmitted

            ? "Update my feedback"

            : "Submit feedback"}

      </button>

    </div>

  );

};



export default SurveyForm;

