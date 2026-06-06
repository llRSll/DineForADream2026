"use client";

import { useState } from "react";
import Link from "next/link";
import EventLogo from "@/components/EventLogo";
import { useEventData } from "@/components/useEventData";
import PollResults from "@/components/PollResults";
import QuestionClusters from "@/components/QuestionClusters";
import ScheduleList from "@/components/ScheduleList";
import { branding } from "@/lib/branding";

type Tab = "poll" | "qa" | "schedule";

const TABS: { value: Tab; label: string }[] = [
  { value: "poll", label: "Poll" },
  { value: "qa", label: "Q&A" },
  { value: "schedule", label: "Agenda" },
];

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const inputClassName =
  "w-full rounded-xl border border-stage-border bg-white px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
    {children}
  </p>
);

const LivePage = () => {
  const data = useEventData();
  const [tab, setTab] = useState<Tab>("poll");
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionSent, setQuestionSent] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const handleVote = async (optionIndex: number) => {
    if (!data.activePoll) return;
    setVoteError(null);
    setVotedIndex(optionIndex);

    const response = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId: data.activePoll.id, optionIndex }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setVoteError(body.error ?? "Could not vote");
      setVotedIndex(null);
    }
  };

  const handleSubmitQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    setQuestionError(null);

    const response = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: questionText }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setQuestionError(body.error ?? "Could not submit");
      return;
    }

    setQuestionText("");
    setQuestionSent(true);
    setTimeout(() => setQuestionSent(false), 2500);
  };

  return (
    <main className="stage-gradient min-h-screen pb-12">
      <div className="accent-bar fixed left-0 right-0 top-0 z-20" />

      <header className="sticky top-0 z-10 border-b border-stage-border/70 bg-stage-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3.5">
          <EventLogo size="sm" showTagline={false} />
          <Link
            href="/"
            className="text-sm font-medium text-ink-faint transition hover:text-ink-muted"
          >
            Home
          </Link>
        </div>

        <div className="mx-auto max-w-2xl px-5 pb-3.5">
          <nav
            className="grid grid-cols-3 gap-1 rounded-2xl border border-stage-border bg-white p-1 shadow-sm"
            aria-label="Sections"
          >
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                aria-pressed={tab === value}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab === value
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-muted hover:bg-brand-light/50 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pt-7">
        {tab === "poll" ? (
          <section className="animate-pop-in panel rounded-3xl p-7">
            {!data.activePoll ? (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-stage-border text-ink-faint">
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-faint/50" />
                </span>
                <p className="font-display text-lg text-ink">
                  No poll open right now
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  Hang tight — the next one appears here automatically.
                </p>
              </div>
            ) : votedIndex !== null ? (
              <>
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-brand-light px-4 py-3 text-sm font-medium text-brand">
                  <span aria-hidden="true">✓</span>
                  Thanks for voting — live results below.
                </div>
                <PollResults
                  poll={data.activePoll}
                  counts={data.pollCounts}
                  total={data.pollTotal}
                />
              </>
            ) : (
              <>
                <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-red">
                  <span className="live-dot" />
                  Live now
                </span>
                <h2 className="mb-6 font-display text-2xl font-semibold leading-snug text-ink">
                  {data.activePoll.question}
                </h2>
                <div className="flex flex-col gap-3">
                  {data.activePoll.options.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleVote(index)}
                      className="group flex items-center gap-3.5 rounded-2xl border border-stage-border bg-white px-4 py-4 text-left text-ink transition hover:border-brand hover:bg-brand-light/40 active:scale-[0.99]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light font-bold text-brand transition group-hover:bg-brand group-hover:text-white">
                        {OPTION_LETTERS[index] ?? index + 1}
                      </span>
                      <span className="font-medium">{option}</span>
                    </button>
                  ))}
                </div>
                {voteError ? (
                  <p className="mt-3 text-sm text-accent-red">{voteError}</p>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {tab === "qa" ? (
          <section className="flex flex-col gap-5">
            <form
              onSubmit={handleSubmitQuestion}
              className="animate-pop-in panel rounded-3xl p-7"
            >
              <Kicker>Ask</Kicker>
              <h2 className="mb-1 mt-1.5 font-display text-2xl font-semibold text-ink">
                Ask a question
              </h2>
              <p className="mb-4 text-sm text-ink-muted">
                Anonymous — your question joins the live Q&amp;A.
              </p>
              <textarea
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                rows={3}
                maxLength={400}
                aria-label="Your question"
                placeholder="What would you like to ask?"
                className={inputClassName}
              />
              <div className="mt-1 flex justify-end">
                <span className="text-xs text-ink-faint">
                  {questionText.length}/400
                </span>
              </div>
              {questionError ? (
                <p className="mt-1 text-sm text-accent-red">{questionError}</p>
              ) : null}
              {questionSent ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand">
                  <span aria-hidden="true">✓</span> Question submitted!
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!questionText.trim()}
                className="mt-3 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                Submit question
              </button>
            </form>

            <div className="animate-pop-in panel rounded-3xl p-7">
              <Kicker>From the room</Kicker>
              <h2 className="mb-4 mt-1.5 font-display text-2xl font-semibold text-ink">
                Question themes
              </h2>
              <QuestionClusters groups={data.groupedQuestions} />
            </div>
          </section>
        ) : null}

        {tab === "schedule" ? (
          <section className="animate-pop-in panel rounded-3xl p-7">
            <Kicker>The evening</Kicker>
            <h2 className="mb-5 mt-1.5 font-display text-2xl font-semibold text-ink">
              Tonight&apos;s agenda
            </h2>
            <ScheduleList items={data.schedule} />
          </section>
        ) : null}

        <footer className="mt-10 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          <span>{branding.name}</span>
          <span className="text-stage-border">·</span>
          <span>{branding.tagline}</span>
        </footer>
      </div>
    </main>
  );
};

export default LivePage;
