"use client";

import { useEffect, useRef, useState } from "react";
import EventLogo from "@/components/EventLogo";
import { useEventData } from "@/components/useEventData";
import { branding } from "@/lib/branding";
import type { SurveyQuestion, SurveyQuestionType } from "@/lib/types";

const inputClassName =
  "w-full rounded-xl border border-stage-border bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const TYPE_LABELS: Record<SurveyQuestionType, string> = {
  single: "Single choice",
  multi: "Multi select",
  text: "Open text",
};

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
  const [questionType, setQuestionType] = useState<SurveyQuestionType>("single");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowCustom, setAllowCustom] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleRaw, setScheduleRaw] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const flash = (message: string, durationMs = 3000) => {
    setStatus(message);
    setTimeout(() => setStatus(null), durationMs);
  };

  const countAnswers = (questionId: string) =>
    data.surveyAnswers.filter((answer) => answer.question_id === questionId).length;

  const resetForm = () => {
    setEditingId(null);
    setQuestion("");
    setQuestionType("single");
    setOptions(["", ""]);
    setAllowCustom(false);
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  };

  const handleAddOption = () => {
    setOptions((prev) => (prev.length < 8 ? [...prev, ""] : prev));
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleEdit = (item: SurveyQuestion) => {
    setEditingId(item.id);
    setQuestion(item.question);
    setQuestionType(item.type);
    setOptions(item.options.length >= 2 ? item.options : [...item.options, "", ""]);
    setAllowCustom(item.allow_custom);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = options.map((option) => option.trim()).filter(Boolean);

    const payload = editingId
      ? {
          action: "update",
          questionId: editingId,
          question,
          type: questionType,
          options: questionType === "text" ? [] : cleaned,
          allow_custom: questionType === "multi" ? allowCustom : false,
        }
      : {
          action: "create",
          question,
          type: questionType,
          options: questionType === "text" ? [] : cleaned,
          allow_custom: questionType === "multi" ? allowCustom : false,
        };

    const response = await fetch("/api/admin/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      flash(body.error ?? "Could not save question");
      return;
    }

    flash(editingId ? "Question updated" : "Question added");
    resetForm();
  };

  const handleDelete = async (questionId: string) => {
    await fetch("/api/admin/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", questionId }),
    });
    if (editingId === questionId) resetForm();
    flash("Question deleted");
  };

  const handleMove = async (questionId: string, direction: "up" | "down") => {
    const ids = data.surveyQuestions.map((item) => item.id);
    const index = ids.indexOf(questionId);
    if (index < 0) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    await fetch("/api/admin/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", orderedIds: ids }),
    });
  };

  const handleToggleOpen = async () => {
    await fetch("/api/admin/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setOpen",
        is_open: !data.surveySettings.is_open,
      }),
    });
    flash(data.surveySettings.is_open ? "Survey closed" : "Survey open for guests");
  };

  const handleToggleResults = async () => {
    await fetch("/api/admin/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setShowResults",
        show_results: !data.surveySettings.show_results,
      }),
    });
    flash(
      data.surveySettings.show_results
        ? "Presenter results hidden"
        : "Presenter results live",
    );
  };

  const handleSeed = async () => {
    const response = await fetch("/api/admin/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    });
    const body = await response.json().catch(() => ({}));
    flash(body.seeded ? `Loaded ${body.seeded} default questions` : "Survey already has questions");
  };

  const handleGroupText = async (questionId: string) => {
    flash("Grouping responses…");
    const response = await fetch("/api/admin/survey/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      flash("Grouping failed");
      return;
    }
    const engineLabel = body.engine === "openai" ? "AI" : "offline mock";
    const suffix = body.error ? ` — ${body.error}` : "";
    flash(`Grouped into ${body.clusters} theme(s) via ${engineLabel}${suffix}`, 10000);
  };

  const handleGroup = async () => {
    flash("Grouping Q&A…");
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

  const handleReset = async (scope: "questions" | "survey" | "all") => {
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
                {data.surveyResponseCount}
              </span>{" "}
              survey replies
            </span>
            <span>
              <span className="font-semibold text-ink">
                {data.questions.length}
              </span>{" "}
              Q&amp;A
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

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleToggleOpen}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              data.surveySettings.is_open
                ? "border-brand bg-brand text-white"
                : "border-stage-border bg-white hover:border-brand"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-80">
              Guest survey
            </p>
            <p className="mt-1 font-display text-xl font-semibold">
              {data.surveySettings.is_open ? "Open for guests" : "Closed"}
            </p>
          </button>
          <button
            type="button"
            onClick={handleToggleResults}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              data.surveySettings.show_results
                ? "border-accent-gold bg-accent-gold/15"
                : "border-stage-border bg-white hover:border-brand"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">
              Presenter segment
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">
              {data.surveySettings.show_results
                ? "Results on screen"
                : "Results hidden"}
            </p>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Panel
              kicker="Editable"
              title="Evening survey"
              action={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSeed}
                    className="rounded-full border border-stage-border px-3 py-1 text-xs font-medium text-ink-muted hover:border-brand hover:text-brand"
                  >
                    Load defaults
                  </button>
                  <span className="rounded-full bg-stage-bg px-3 py-1 text-xs font-medium text-ink-muted">
                    {data.surveyQuestions.length} questions
                  </span>
                </div>
              }
            >
              {data.surveyQuestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stage-border py-10 text-center">
                  <p className="font-medium text-ink">No survey questions yet</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Add questions on the right, or load the default set.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.surveyQuestions.map((item, index) => {
                    const answers = countAnswers(item.id);
                    return (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-stage-border bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="mb-1.5 inline-flex rounded-full bg-brand-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                              {TYPE_LABELS[item.type]}
                            </span>
                            <p className="font-display text-lg font-semibold leading-snug text-ink">
                              {item.question}
                            </p>
                            {item.type !== "text" ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.options.map((option, optionIndex) => (
                                  <span
                                    key={optionIndex}
                                    className="rounded-full border border-stage-border bg-stage-bg px-2.5 py-1 text-xs text-ink-muted"
                                  >
                                    {option}
                                  </span>
                                ))}
                                {item.allow_custom ? (
                                  <span className="rounded-full border border-dashed border-stage-border px-2.5 py-1 text-xs text-ink-faint">
                                    + custom
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                            <p className="mt-2 text-xs text-ink-faint">
                              {answers} {answers === 1 ? "response" : "responses"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3.5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleMove(item.id, "up")}
                            disabled={index === 0}
                            className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-muted disabled:opacity-40"
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(item.id, "down")}
                            disabled={index === data.surveyQuestions.length - 1}
                            className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-muted disabled:opacity-40"
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-lg border border-stage-border px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-ink"
                          >
                            Edit
                          </button>
                          {item.type === "text" && answers > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleGroupText(item.id)}
                              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                            >
                              Group responses
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-faint transition hover:border-accent-red hover:text-accent-red"
                            aria-label={`Delete question: ${item.question}`}
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

          <div className="flex flex-col gap-6">
            <div ref={formRef}>
              <Panel
                kicker={editingId ? "Editing" : "Build the survey"}
                title={editingId ? "Edit question" : "Add question"}
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
                <form onSubmit={handleSaveQuestion} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Survey question"
                    aria-label="Survey question"
                    className={inputClassName}
                  />

                  <label className="text-sm font-medium text-ink-muted">
                    Question type
                    <select
                      value={questionType}
                      onChange={(event) =>
                        setQuestionType(event.target.value as SurveyQuestionType)
                      }
                      aria-label="Question type"
                      className={`mt-1.5 ${inputClassName}`}
                    >
                      <option value="single">Single choice</option>
                      <option value="multi">Multi select</option>
                      <option value="text">Open text</option>
                    </select>
                  </label>

                  {questionType !== "text" ? (
                    <>
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
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
                      {options.length < 8 ? (
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="self-start rounded-lg border border-stage-border px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-brand"
                        >
                          + Add option
                        </button>
                      ) : null}
                    </>
                  ) : null}

                  {questionType === "multi" ? (
                    <label className="flex items-center gap-2 text-sm text-ink-muted">
                      <input
                        type="checkbox"
                        checked={allowCustom}
                        onChange={(event) => setAllowCustom(event.target.checked)}
                        className="h-4 w-4 rounded border-stage-border text-brand focus:ring-brand"
                      />
                      Allow a custom option
                    </label>
                  ) : null}

                  <button
                    type="submit"
                    className="mt-1 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
                  >
                    {editingId ? "Save changes" : "Add question"}
                  </button>
                </form>
              </Panel>
            </div>

            <Panel kicker="From the room" title="Q&A grouping">
              <p className="mb-3 text-sm text-ink-muted">
                Cluster submitted questions into themes for the feedback segment.
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
                  onClick={() => handleReset("survey")}
                  className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-muted transition hover:border-brand hover:text-ink"
                >
                  Clear survey responses
                </button>
                <button
                  type="button"
                  onClick={() => handleReset("questions")}
                  className="rounded-lg border border-stage-border px-3 py-2 text-sm text-ink-muted transition hover:border-brand hover:text-ink"
                >
                  Clear Q&amp;A
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
