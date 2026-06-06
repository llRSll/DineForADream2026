"use client";

import type { GroupedQuestions } from "@/lib/types";

type QuestionClustersProps = {
  groups: GroupedQuestions[];
  large?: boolean;
};

const COUNT_COLORS = [
  "bg-brand-light text-brand border-brand/30",
  "bg-accent-gold/15 text-accent-gold border-accent-gold/30",
  "bg-accent-blue/10 text-accent-blue border-accent-blue/25",
  "bg-accent-red/10 text-accent-red border-accent-red/25",
  "bg-accent-green/10 text-accent-green border-accent-green/25",
];

const QuestionClusters = ({ groups, large }: QuestionClustersProps) => {
  if (groups.length === 0) {
    return (
      <p className="text-center text-ink-muted">
        No questions yet. Once grouped, each topic appears here as a single
        combined question with the number of questions it merged.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {groups.map((group, index) => {
        const count = group.questions.length;
        const question =
          group.proposed_question?.trim() ||
          group.questions[0]?.text ||
          group.label;
        return (
          <li
            key={group.id}
            className="animate-pop-in panel flex items-start gap-4 rounded-2xl p-4"
          >
            <span
              className={`flex shrink-0 items-center justify-center gap-1 rounded-full border font-semibold ${
                COUNT_COLORS[index % COUNT_COLORS.length]
              } ${large ? "px-4 py-2 text-xl" : "px-3 py-1 text-sm"}`}
            >
              <span className={large ? "text-2xl" : "text-base"}>{count}</span>
              <span className={large ? "text-sm" : "text-[11px]"}>
                {count === 1 ? "Q" : "Qs"}
              </span>
            </span>
            <p
              className={`min-w-0 font-medium leading-snug text-ink ${
                large ? "text-2xl" : "text-base"
              }`}
            >
              {question}
            </p>
          </li>
        );
      })}
    </ol>
  );
};

export default QuestionClusters;
