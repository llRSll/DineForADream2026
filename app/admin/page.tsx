"use client";

import { useEffect, useRef, useState } from "react";
import EventLogo from "@/components/EventLogo";
import { useEventData } from "@/components/useEventData";
import { branding } from "@/lib/branding";
import type { Poll } from "@/lib/types";

const inputClassName =
  "w-full rounded-xl border border-stage-border bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

type Suggestion = { question: string; options: string[] };

const POLL_SUGGESTIONS: Suggestion[] = [
  {
    question: "How did you hear about tonight?",
    options: ["A friend", "Social media", "OzGeeOm", "Other"],
  },
  {
    question: "What brought you here tonight?",
    options: ["The cause", "Friends & family", "Company table", "The food!"],
  },
  {
    question: "Would you join us again next year?",
    options: ["Absolutely", "Probably", "Maybe"],
  },
];

const AdminLogin = ({ onSuccess }: { onSuccess: () => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("Wrong password");
      return;
    }
    onSuccess();
  };

  return (
    <main className="stage-gradient flex min-h-screen flex-col">
      <div className="accent-bar w-full" />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="panel w-full max-w-sm rounded-3xl p-8"
        >
          <EventLogo size="sm" className="mb-5" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            Control room
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold text-ink">
            Admin
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter the password to run {branding.eventTitle}.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-label="Admin password"
            placeholder="Password"
            className={`mt-6 ${inputClassName}`}
          />
          {error ? (
            <p className="mt-2 text-sm text-accent-red">{error}</p>
          ) : null}
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
};

type PanelProps = {
  kicker: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

const Panel = ({ kicker, title, action, children }: PanelProps) => (
  <section className="panel rounded-3xl p-6 sm:p-7">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
          {kicker}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">
          {title}
        </h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const AdminDashboard = () => {
  const data = useEventData();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleRaw, setScheduleRaw] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const flash = (message: string, durationMs = 3000) => {
    setStatus(message);
    setTimeout(() => setStatus(null), durationMs);
  };

  const countVotes = (pollId: string) =>
    data.votes.filter((vote) => vote.poll_id === pollId).length;

  const resetForm = () => {
    setEditingId(null);
    setQuestion("");
    setOptions(["", ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  };

  const handleAddOption = () => {
    setOptions((prev) => (prev.length < 6 ? [...prev, ""] : prev));
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  };

  const applySuggestion = (suggestion: Suggestion) => {
    setEditingId(null);
    setQuestion(suggestion.question);
    setOptions(suggestion.options);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSavePoll = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = options.map((option) => option.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) {
      flash("Add a question and at least 2 options");
      return;
    }

    const payload = editingId
      ? { action: "update", pollId: editingId, question, options: cleaned }
      : { action: "create", question, options: cleaned };

    const response = await fetch("/api/admin/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      flash("Could not save poll");
      return;
    }
    flash(editingId ? "Poll updated" : "Poll saved to your library");
    resetForm();
  };

  const handleEdit = (poll: Poll) => {
    setEditingId(poll.id);
    setQuestion(poll.question);
    setOptions(poll.options.length >= 2 ? poll.options : [...poll.options, ""]);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGoLive = async (pollId: string) => {
    await fetch("/api/admin/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "golive", pollId }),
    });
    flash("Poll is now live");
  };

  const handleClosePoll = async () => {
    await fetch("/api/admin/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    flash("Poll closed");
  };

  const handleDeletePoll = async (pollId: string) => {
    await fetch("/api/admin/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", pollId }),
    });
    if (editingId === pollId) resetForm();
    flash("Poll deleted");
  };

  const handleGroup = async () => {
    flash("Grouping…");
    const response = await fetch("/api/admin/group", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      flash("Grouping failed");
      return;
    }
    const engineLabel = body.engine === "openai" ? "AI" : "offline mock";
    const suffix = body.error ? ` — reason: ${body.error}` : "";
    flash(`Grouped into ${body.clusters} theme(s) via ${engineLabel}${suffix}`, 10000);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    flash("Reading file…");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/extract", { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      flash(result.error ?? "Could not read file");
      return;
    }
    setScheduleRaw(result.text ?? "");
    flash("File loaded — review then publish");
  };

  const handlePublishSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    flash("Parsing agenda…");
    const response = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw: scheduleRaw }),
    });
    const body = await response.json().catch(() => ({}));
    flash(response.ok ? `Published ${body.items} item(s)` : body.error ?? "Failed");
  };

  const handleReset = async (scope: "questions" | "votes" | "all") => {
    await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    });
    flash(`Reset ${scope}`);
  };

  return (
    <main className="stage-gradient min-h-screen px-4 py-6 sm:px-6">
      <div className="accent-bar fixed left-0 right-0 top-0 z-10" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pt-2">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <EventLogo size="sm" showTagline={false} />
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
              Control room
            </h1>
          </div>
          <div className="flex items-center gap-5 text-sm text-ink-muted">
            <span>
              <span className="font-semibold text-ink">
                {data.questions.length}
              </span>{" "}
              questions
            </span>
            <span>
              <span className="font-semibold text-ink">{data.pollTotal}</span>{" "}
              votes
            </span>
            <a
              className="font-medium text-brand hover:underline"
              href="/present"
              target="_blank"
              rel="noreferrer"
            >
              Presenter screen ↗
            </a>
          </div>
        </header>

        {status ? (
          <p className="rounded-xl bg-brand-light px-4 py-2.5 text-sm font-medium text-brand">
            {status}
          </p>
        ) : null}

        {/* Live now banner */}
        {data.activePoll ? (
          <div className="overflow-hidden rounded-3xl bg-brand text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Live on screen now
                </p>
                <p className="mt-1.5 font-display text-2xl font-semibold">
                  {data.activePoll.question}
                </p>
                <p className="mt-1 text-sm text-white/75">
                  {data.pollTotal} {data.pollTotal === 1 ? "vote" : "votes"} so far
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePoll}
                className="shrink-0 rounded-xl bg-white px-5 py-2.5 font-semibold text-brand transition hover:bg-white/90"
              >
                Stop poll
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stage-border bg-white/50 px-6 py-5 text-center text-sm text-ink-muted">
            No poll is live. Pick one from your library below and hit{" "}
            <span className="font-semibold text-brand">Go live</span>.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: poll library + schedule */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Panel
              kicker="One click to go live"
              title="Poll library"
              action={
                <span className="rounded-full bg-stage-bg px-3 py-1 text-xs font-medium text-ink-muted">
                  {data.polls.length} saved
                </span>
              }
            >
              {data.polls.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stage-border py-10 text-center">
                  <p className="font-medium text-ink">No polls saved yet</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Add one on the right, or tap a quick-start suggestion.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.polls.map((poll) => {
                    const votes = countVotes(poll.id);
                    return (
                      <li
                        key={poll.id}
                        className={`rounded-2xl border p-4 transition ${
                          poll.is_open
                            ? "border-brand bg-brand-light/40"
                            : "border-stage-border bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {poll.is_open ? (
                              <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                Live
                              </span>
                            ) : null}
                            <p className="font-display text-lg font-semibold leading-snug text-ink">
                              {poll.question}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {poll.options.map((option, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-stage-border bg-stage-bg px-2.5 py-1 text-xs text-ink-muted"
                                >
                                  <span className="font-bold text-ink-faint">
                                    {OPTION_LETTERS[index] ?? index + 1}
                                  </span>
                                  {option}
                                </span>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-ink-faint">
                              {votes} {votes === 1 ? "vote" : "votes"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3.5 flex flex-wrap gap-2">
                          {poll.is_open ? (
                            <button
                              type="button"
                              onClick={handleClosePoll}
                              className="rounded-lg border border-accent-red/40 px-4 py-2 text-sm font-semibold text-accent-red transition hover:border-accent-red hover:bg-accent-red/5"
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGoLive(poll.id)}
                              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                            >
                              ▶ Go live
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(poll)}
                            className="rounded-lg border border-stage-border px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-ink"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePoll(poll.id)}
                            className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-faint transition hover:border-accent-red hover:text-accent-red"
                            aria-label={`Delete poll: ${poll.question}`}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel kicker="The evening" title="Schedule">
              <form onSubmit={handlePublishSchedule} className="flex flex-col gap-3">
                <input
                  type="file"
                  accept=".docx,.txt,.md,.csv"
                  onChange={handleFile}
                  aria-label="Upload schedule file"
                  className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white"
                />
                <p className="text-xs text-ink-faint">
                  Word (.docx), text, markdown or CSV — or paste below.
                </p>
                <textarea
                  value={scheduleRaw}
                  onChange={(event) => setScheduleRaw(event.target.value)}
                  rows={6}
                  placeholder="Or paste the agenda here…"
                  aria-label="Schedule text"
                  className={`${inputClassName} text-sm`}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
                >
                  Parse &amp; publish agenda
                </button>
              </form>
            </Panel>
          </div>

          {/* Right: add/edit poll + Q&A + reset */}
          <div className="flex flex-col gap-6">
            <div ref={formRef}>
              <Panel
                kicker={editingId ? "Editing" : "Prepare ahead"}
                title={editingId ? "Edit poll" : "Add a poll"}
                action={
                  editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm font-medium text-ink-faint hover:text-ink-muted"
                    >
                      Cancel
                    </button>
                  ) : undefined
                }
              >
                {!editingId ? (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
                      Quick start
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POLL_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.question}
                          type="button"
                          onClick={() => applySuggestion(suggestion)}
                          className="rounded-full border border-stage-border bg-white px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-brand hover:text-brand"
                        >
                          {suggestion.question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <form onSubmit={handleSavePoll} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Poll question"
                    aria-label="Poll question"
                    className={inputClassName}
                  />
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-sm font-bold text-brand">
                        {OPTION_LETTERS[index] ?? index + 1}
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(event) =>
                          handleOptionChange(index, event.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        aria-label={`Option ${index + 1}`}
                        className={inputClassName}
                      />
                      {options.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          aria-label={`Remove option ${index + 1}`}
                          className="shrink-0 rounded-lg border border-stage-border px-2.5 py-2 text-sm text-ink-faint transition hover:border-accent-red hover:text-accent-red"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {options.length < 6 ? (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="self-start rounded-lg border border-stage-border px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-brand"
                    >
                      + Add option
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className="mt-1 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
                  >
                    {editingId ? "Save changes" : "Save to library"}
                  </button>
                </form>
              </Panel>
            </div>

            <Panel kicker="From the room" title="Q&A grouping">
              <p className="mb-3 text-sm text-ink-muted">
                Cluster submitted questions into themes for the screen.
              </p>
              <button
                type="button"
                onClick={handleGroup}
                className="w-full rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
              >
                Group {data.questions.length} questions
              </button>
              {data.groupedQuestions.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2 text-sm text-ink">
                  {data.groupedQuestions.map((group) => (
                    <li key={group.id} className="flex items-start gap-2">
                      <span className="shrink-0 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
                        {group.questions.length}
                      </span>
                      <span>
                        {group.proposed_question?.trim() ||
                          group.questions[0]?.text ||
                          group.label}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>

            <Panel kicker="Careful" title="Reset">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleReset("votes")}
                  className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-muted transition hover:border-brand hover:text-ink"
                >
                  Clear votes
                </button>
                <button
                  type="button"
                  onClick={() => handleReset("questions")}
                  className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-muted transition hover:border-brand hover:text-ink"
                >
                  Clear questions
                </button>
                <button
                  type="button"
                  onClick={() => handleReset("all")}
                  className="rounded-lg border border-accent-red/40 px-3 py-2 text-sm text-accent-red transition hover:border-accent-red hover:bg-accent-red/5"
                >
                  Clear all
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
};

const AdminPage = () => {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((res) => res.json())
      .then((body) => setAuthed(Boolean(body.admin)))
      .catch(() => setAuthed(false))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <main className="stage-gradient flex min-h-screen items-center justify-center">
        <p className="text-ink-muted">Loading…</p>
      </main>
    );
  }

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard />;
};

export default AdminPage;
