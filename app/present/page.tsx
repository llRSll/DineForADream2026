"use client";

import { useEffect, useState } from "react";
import EventLogo from "@/components/EventLogo";
import { useEventData } from "@/components/useEventData";
import JoinQR from "@/components/JoinQR";
import PollResults from "@/components/PollResults";
import QuestionClusters from "@/components/QuestionClusters";
import ScheduleList from "@/components/ScheduleList";
import { branding } from "@/lib/branding";

type Stat = { label: string; value: number };

const StatGroup = ({ stats }: { stats: Stat[] }) => (
  <div className="flex items-stretch divide-x divide-stage-border overflow-hidden rounded-xl border border-stage-border bg-white shadow-sm">
    {stats.map((stat) => (
      <div key={stat.label} className="px-4 py-2 text-center">
        <p className="font-display text-xl font-semibold leading-none tabular-nums text-ink">
          {stat.value}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {stat.label}
        </p>
      </div>
    ))}
  </div>
);

const SectionHead = ({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) => (
  <div className="mb-3 shrink-0">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
      {kicker}
    </p>
    <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-ink">
      {title}
    </h2>
  </div>
);

const PresentPage = () => {
  const data = useEventData();
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    setJoinUrl(`${base.replace(/\/$/, "")}/join`);
  }, []);

  return (
    <main className="stage-gradient flex h-dvh flex-col overflow-hidden">
      <div className="accent-bar shrink-0" />

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-6 py-4">
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
          <EventLogo size="md" showTagline />
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-2 rounded-full border border-stage-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-red shadow-sm">
              <span className="live-dot" />
              Live
            </span>
            <StatGroup
              stats={[
                { label: "Questions", value: data.questions.length },
                { label: "Votes", value: data.pollTotal },
                { label: "Themes", value: data.groupedQuestions.length },
              ]}
            />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-4">
          <section className="brand-surface relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-5 text-center text-white shadow-lg">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative flex min-h-0 flex-col items-center justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                Presents
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">
                {branding.eventTitle}
              </h2>
              <p className="mt-1 max-w-[200px] text-xs leading-snug text-white/75">
                Scan to vote and ask questions from your phone.
              </p>

              {joinUrl ? (
                <div className="mt-3">
                  <JoinQR url={joinUrl} size={148} tone="dark" showCaption={false} />
                </div>
              ) : null}
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Scan to join
              </p>
            </div>
          </section>

          <section className="panel flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 lg:col-span-2">
            <SectionHead kicker="Live now" title="Audience poll" />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {data.activePoll ? (
                <PollResults
                  poll={data.activePoll}
                  counts={data.pollCounts}
                  total={data.pollTotal}
                />
              ) : (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-stage-border text-center">
                  <p className="font-display text-lg text-ink-muted">
                    No poll open right now
                  </p>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    The next poll will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="panel flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 lg:col-span-2">
            <SectionHead kicker="From the room" title="Question themes" />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <QuestionClusters groups={data.groupedQuestions} />
            </div>
          </section>

          <section className="panel flex min-h-0 flex-col overflow-hidden rounded-2xl p-5">
            <SectionHead kicker="The evening" title="Agenda" />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ScheduleList items={data.schedule} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PresentPage;
