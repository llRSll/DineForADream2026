"use client";

import type { Poll } from "@/lib/types";

type PollResultsProps = {
  poll: Poll;
  counts: number[];
  total: number;
  large?: boolean;
};

const BAR_COLORS = [
  "bg-brand",
  "bg-accent-gold",
  "bg-accent-blue",
  "bg-accent-red",
  "bg-accent-green",
];

const PollResults = ({ poll, counts, total, large }: PollResultsProps) => {
  const leadingCount = Math.max(...counts, 0);

  return (
    <div className="w-full">
      <h3
        className={`mb-5 font-semibold leading-snug text-ink ${
          large ? "text-3xl" : "text-xl"
        }`}
      >
        {poll.question}
      </h3>
      <ul className={`flex flex-col ${large ? "gap-5" : "gap-4"}`}>
        {poll.options.map((option, index) => {
          const count = counts[index] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isLeading = total > 0 && count === leadingCount;
          return (
            <li key={index}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span
                  className={`flex items-center gap-2 font-medium text-ink ${
                    large ? "text-xl" : "text-base"
                  }`}
                >
                  {option}
                  {isLeading ? (
                    <span
                      className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand"
                      aria-label="Leading option"
                    >
                      Leading
                    </span>
                  ) : null}
                </span>
                <span
                  className={`shrink-0 font-bold tabular-nums text-ink ${
                    large ? "text-2xl" : "text-base"
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <div
                className={`w-full overflow-hidden rounded-full bg-stage-border/70 ${
                  large ? "h-5" : "h-3.5"
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    BAR_COLORS[index % BAR_COLORS.length]
                  }`}
                  style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <p
                className={`mt-1 text-ink-faint ${large ? "text-sm" : "text-xs"}`}
              >
                {count} {count === 1 ? "vote" : "votes"}
              </p>
            </li>
          );
        })}
      </ul>
      <p
        className={`mt-5 border-t border-stage-border pt-3 font-medium text-ink-muted ${
          large ? "text-base" : "text-sm"
        }`}
      >
        {total} total {total === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
};

export default PollResults;
