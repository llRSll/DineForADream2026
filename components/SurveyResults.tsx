"use client";



import { useState } from "react";

import type {

  GroupedSurveyAnswers,

  SurveyChoiceResult,

  SurveyQuestion,

} from "@/lib/types";



const BAR_COLORS = [

  "bg-brand",

  "bg-accent-gold",

  "bg-accent-blue",

  "bg-accent-red",

  "bg-accent-green",

];



type SurveyResultsProps = {

  choiceResults: SurveyChoiceResult[];

  textQuestions: SurveyQuestion[];

  groupedAnswers: GroupedSurveyAnswers[];

  allTextAnswers: { questionId: string; text: string }[];

  large?: boolean;

};



const SurveyResults = ({

  choiceResults,

  textQuestions,

  groupedAnswers,

  allTextAnswers,

  large = false,

}: SurveyResultsProps) => {

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());



  const handleToggle = (id: string) => {

    setExpandedIds((prev) => {

      const next = new Set(prev);

      if (next.has(id)) next.delete(id);

      else next.add(id);

      return next;

    });

  };



  if (choiceResults.length === 0 && textQuestions.length === 0) {

    return (

      <p className="text-center text-ink-muted">

        No survey questions yet. Add them in the control room.

      </p>

    );

  }



  return (

    <div className={`flex flex-col ${large ? "gap-8" : "gap-6"}`}>

      {choiceResults.map((result) => {

        const totalSelections = result.counts.reduce((sum, count) => sum + count, 0);

        const leadingCount = Math.max(...result.counts, result.customCount, 0);

        const customKey = `custom-${result.question.id}`;

        const customExpanded = expandedIds.has(customKey);



        return (

          <section key={result.question.id}>

            <h3

              className={`mb-3 font-semibold leading-snug text-ink ${

                large ? "text-2xl" : "text-lg"

              }`}

            >

              {result.question.question}

            </h3>

            <ul className={`flex flex-col ${large ? "gap-4" : "gap-3"}`}>

              {result.question.options.map((option, index) => {

                const count = result.counts[index] ?? 0;

                const pct =

                  totalSelections > 0

                    ? Math.round((count / totalSelections) * 100)

                    : 0;

                const isLeading = totalSelections > 0 && count === leadingCount;



                return (

                  <li key={index}>

                    <div className="mb-1 flex items-center justify-between gap-3">

                      <span

                        className={`font-medium text-ink ${

                          large ? "text-lg" : "text-sm"

                        }`}

                      >

                        {option}

                        {isLeading ? (

                          <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">

                            Top

                          </span>

                        ) : null}

                      </span>

                      <span

                        className={`shrink-0 font-bold tabular-nums text-ink ${

                          large ? "text-xl" : "text-base"

                        }`}

                      >

                        {pct}%

                      </span>

                    </div>

                    <div

                      className={`w-full overflow-hidden rounded-full bg-stage-border/70 ${

                        large ? "h-4" : "h-3"

                      }`}

                    >

                      <div

                        className={`h-full rounded-full transition-all duration-700 ease-out ${

                          BAR_COLORS[index % BAR_COLORS.length]

                        }`}

                        style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}

                      />

                    </div>

                    <p className="mt-1 text-xs text-ink-faint">

                      {count} {count === 1 ? "response" : "responses"}

                    </p>

                  </li>

                );

              })}



              {result.question.allow_custom && result.customCount > 0 ? (

                <li className="overflow-hidden rounded-2xl border border-stage-border bg-white">

                  <button

                    type="button"

                    onClick={() => handleToggle(customKey)}

                    aria-expanded={customExpanded}

                    className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-stage-bg/60"

                  >

                    <span className="rounded-full border border-brand/30 bg-brand-light px-3 py-1 text-sm font-semibold text-brand">

                      {result.customCount}

                    </span>

                    <span className="min-w-0 flex-1">

                      <p

                        className={`font-medium leading-snug text-ink ${

                          large ? "text-lg" : "text-sm"

                        }`}

                      >

                        Custom responses

                      </p>

                      <p className="mt-1 text-xs text-ink-faint">

                        {customExpanded ? "Tap to collapse" : "Tap to see responses"}

                      </p>

                    </span>

                  </button>

                  {customExpanded ? (

                    <ul className="border-t border-stage-border/50 bg-stage-bg/30 px-4 py-3 pl-16">

                      {result.customTexts.map((text, index) => (

                        <li

                          key={index}

                          className="py-1.5 text-sm leading-snug text-ink-faint"

                        >

                          {text}

                        </li>

                      ))}

                    </ul>

                  ) : null}

                </li>

              ) : null}

            </ul>

            <p className="mt-3 text-sm text-ink-muted">

              {result.respondentCount}{" "}

              {result.respondentCount === 1 ? "person" : "people"} answered

            </p>

          </section>

        );

      })}



      {textQuestions.map((question) => {

        const groups = groupedAnswers.filter(

          (group) => group.question_id === question.id,

        );

        const groupedTexts = new Set(

          groups.flatMap((group) =>

            group.answers.map((answer) => answer.custom_text?.trim()).filter(Boolean),

          ),

        );

        const ungrouped = allTextAnswers

          .filter((answer) => answer.questionId === question.id)

          .map((answer) => answer.text)

          .filter((text) => !groupedTexts.has(text));



        return (

          <section key={question.id}>

            <h3

              className={`mb-3 font-semibold leading-snug text-ink ${

                large ? "text-2xl" : "text-lg"

              }`}

            >

              {question.question}

            </h3>



            {groups.length > 0 ? (

              <ol className="flex flex-col gap-3">

                {groups.map((group) => {

                  const isExpanded = expandedIds.has(group.id);

                  const summary =

                    group.label?.trim() ||

                    group.proposed_summary?.trim() ||

                    group.summary?.trim() ||

                    group.answers[0]?.custom_text ||

                    "Theme";



                  return (

                    <li

                      key={group.id}

                      className="overflow-hidden rounded-2xl border border-stage-border bg-white"

                    >

                      <button

                        type="button"

                        onClick={() => handleToggle(group.id)}

                        aria-expanded={isExpanded}

                        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-stage-bg/60"

                      >

                        <span className="rounded-full border border-brand/30 bg-brand-light px-3 py-1 text-sm font-semibold text-brand">

                          {group.answers.length}

                        </span>

                        <span className="min-w-0 flex-1">

                          <p

                            className={`font-medium leading-snug text-ink ${

                              large ? "text-xl" : "text-base"

                            }`}

                          >

                            {summary}

                          </p>

                          {group.summary?.trim() &&

                          group.summary.trim() !== summary ? (

                            <p className="mt-1 text-sm text-ink-muted">

                              {group.summary}

                            </p>

                          ) : null}

                          <p className="mt-1 text-xs text-ink-faint">

                            {isExpanded ? "Tap to collapse" : "Tap to see responses"}

                          </p>

                        </span>

                      </button>

                      {isExpanded ? (

                        <ul className="border-t border-stage-border/50 bg-stage-bg/30 px-4 py-3 pl-16">

                          {group.answers.map((answer) => (

                            <li

                              key={answer.id}

                              className="py-1.5 text-sm leading-snug text-ink-faint"

                            >

                              {answer.custom_text}

                            </li>

                          ))}

                        </ul>

                      ) : null}

                    </li>

                  );

                })}



                {ungrouped.length > 0 ? (

                  <li className="overflow-hidden rounded-2xl border border-dashed border-stage-border bg-stage-bg/20 p-4">

                    <p className="text-sm font-medium text-ink">

                      Ungrouped responses ({ungrouped.length})

                    </p>

                    <ul className="mt-2 flex flex-col gap-1.5">

                      {ungrouped.map((text, index) => (

                        <li key={index} className="text-sm text-ink-muted">

                          {text}

                        </li>

                      ))}

                    </ul>

                  </li>

                ) : null}

              </ol>

            ) : ungrouped.length > 0 ? (

              <ul className="flex flex-col gap-2">

                {ungrouped.slice(0, 12).map((text, index) => (

                  <li

                    key={index}

                    className="rounded-xl border border-stage-border bg-white px-4 py-3 text-sm text-ink-muted"

                  >

                    {text}

                  </li>

                ))}

                {ungrouped.length > 12 ? (

                  <li className="text-sm text-ink-faint">

                    + {ungrouped.length - 12} more responses — group them in the

                    control room

                  </li>

                ) : null}

              </ul>

            ) : (

              <p className="text-sm text-ink-muted">No responses yet.</p>

            )}

          </section>

        );

      })}

    </div>

  );

};



export default SurveyResults;

