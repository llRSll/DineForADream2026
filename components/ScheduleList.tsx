"use client";

import type { ScheduleItem } from "@/lib/types";

type ScheduleListProps = {
  items: ScheduleItem[];
  large?: boolean;
};

const ScheduleList = ({ items, large }: ScheduleListProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <span className="mb-2 text-2xl" aria-hidden="true">
          🗓️
        </span>
        <p className="text-ink-muted">
          The agenda will appear here once it is published.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col">
      {items.map((item, index) => (
        <li key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              className={`mt-1.5 shrink-0 rounded-full bg-brand ${
                large ? "h-3.5 w-3.5" : "h-3 w-3"
              }`}
            />
            {index < items.length - 1 ? (
              <span className="my-1 w-px flex-1 bg-stage-border" />
            ) : null}
          </div>

          <div className={`min-w-0 ${index < items.length - 1 ? "pb-5" : ""}`}>
            <p
              className={`font-semibold text-brand ${
                large ? "text-lg" : "text-sm"
              }`}
            >
              {item.start_time ?? "—"}
              {item.end_time ? ` – ${item.end_time}` : ""}
            </p>
            <p
              className={`font-semibold text-ink ${
                large ? "text-2xl" : "text-base"
              }`}
            >
              {item.title}
            </p>
            {item.speaker ? (
              <p
                className={`text-ink-muted ${large ? "text-base" : "text-sm"}`}
              >
                {item.speaker}
              </p>
            ) : null}
            {item.description ? (
              <p
                className={`mt-1 text-ink-faint ${
                  large ? "text-base" : "text-sm"
                }`}
              >
                {item.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default ScheduleList;
