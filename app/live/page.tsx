"use client";

import { useState } from "react";
import Link from "next/link";
import EventLogo from "@/components/EventLogo";
import SurveyForm from "@/components/SurveyForm";
import QuestionClusters from "@/components/QuestionClusters";
import ScheduleList from "@/components/ScheduleList";
import { useEventData } from "@/components/useEventData";
import { branding } from "@/lib/branding";

type Tab = "survey" | "qa" | "schedule";

const TABS: { value: Tab; label: string }[] = [
  { value: "survey", label: "Survey" },
  { value: "qa", label: "Q&A" },
  { value: "schedule", label: "Agenda" },
];

const inputClassName =
  "w-full rounded-xl border border-stage-border bg-white px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
    {children}
  </p>
);

const LivePage = () => {
  const data = useEventData();
  const [tab, setTab] = useState<Tab>("survey");
  const [questionText, setQuestionText] = useState("");
  const [questionSent, setQuestionSent] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

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
        {tab === "survey" ? (
          <section className="animate-pop-in">
            <SurveyForm />
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
