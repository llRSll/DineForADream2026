"use client";

import { useState } from "react";
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

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 ${
      expanded ? "rotate-180" : ""
    }`}
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const QuestionClusters = ({ groups, large }: QuestionClustersProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggle = (groupId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

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
        const isExpandable = count > 1;
        const isExpanded = expandedIds.has(group.id);

        return (
          <li
            key={group.id}
            className="animate-pop-in panel overflow-hidden rounded-2xl"
          >
            {isExpandable ? (
              <button
                type="button"
                onClick={() => handleToggle(group.id)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Hide" : "Show"} ${count} combined questions`}
                className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-stage-bg/60"
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
                <span className="min-w-0 flex-1">
                  <p
                    className={`font-medium leading-snug text-ink ${
                      large ? "text-2xl" : "text-base"
                    }`}
                  >
                    {question}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {isExpanded ? "Tap to collapse" : "Tap to see individual questions"}
                  </p>
                </span>
                <ChevronIcon expanded={isExpanded} />
              </button>
            ) : (
              <div className="flex items-start gap-4 p-4">
                <span
                  className={`flex shrink-0 items-center justify-center gap-1 rounded-full border font-semibold ${
                    COUNT_COLORS[index % COUNT_COLORS.length]
                  } ${large ? "px-4 py-2 text-xl" : "px-3 py-1 text-sm"}`}
                >
                  <span className={large ? "text-2xl" : "text-base"}>{count}</span>
                  <span className={large ? "text-sm" : "text-[11px]"}>Q</span>
                </span>
                <p
                  className={`min-w-0 font-medium leading-snug text-ink ${
                    large ? "text-2xl" : "text-base"
                  }`}
                >
                  {question}
                </p>
              </div>
            )}

            {isExpandable && isExpanded ? (
              <ul className="border-t border-stage-border/50 bg-stage-bg/30 px-4 py-3 pl-[4.5rem]">
                {group.questions.map((item) => (
                  <li
                    key={item.id}
                    className="relative py-1.5 pl-3 text-sm leading-snug text-ink-faint before:absolute before:left-0 before:top-[0.85rem] before:h-1 before:w-1 before:rounded-full before:bg-ink-faint/50"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
};

export default QuestionClusters;
