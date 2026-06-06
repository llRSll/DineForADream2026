"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EventLogo from "@/components/EventLogo";
import { useEventData } from "@/components/useEventData";
import JoinQR from "@/components/JoinQR";
import QuestionClusters from "@/components/QuestionClusters";
import SurveyResults from "@/components/SurveyResults";
import { branding } from "@/lib/branding";

const getFullscreenQrSize = () =>
  Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.42);

const PresentPage = () => {
  const data = useEventData();
  const [joinUrl, setJoinUrl] = useState("");
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [fullscreenQrSize, setFullscreenQrSize] = useState(320);

  const showResults = data.surveySettings.show_results;
  const textQuestions = useMemo(
    () => data.surveyQuestions.filter((question) => question.type === "text"),
    [data.surveyQuestions],
  );
  const allTextAnswers = useMemo(
    () =>
      data.surveyAnswers
        .filter((answer) => answer.custom_text?.trim())
        .map((answer) => ({
          questionId: answer.question_id,
          text: answer.custom_text!.trim(),
        })),
    [data.surveyAnswers],
  );

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    setJoinUrl(`${base.replace(/\/$/, "")}/join`);
  }, []);

  const handleOpenQrFullscreen = useCallback(() => {
    setFullscreenQrSize(getFullscreenQrSize());
    setQrFullscreen(true);
  }, []);

  const handleCloseQrFullscreen = useCallback(() => {
    setQrFullscreen(false);
  }, []);

  useEffect(() => {
    if (!qrFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCloseQrFullscreen();
    };
    const handleResize = () => setFullscreenQrSize(getFullscreenQrSize());

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [qrFullscreen, handleCloseQrFullscreen]);

  return (
    <main className="stage-gradient flex h-dvh flex-col overflow-hidden">
      <div className="accent-bar shrink-0" />

      {qrFullscreen && joinUrl ? (
        <div
          className="brand-surface fixed inset-0 z-50 flex flex-col items-center justify-center px-8 py-10 text-center text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Full screen join QR code"
        >
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
          <button
            type="button"
            onClick={handleCloseQrFullscreen}
            className="absolute right-6 top-6 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Exit full screen QR code"
          >
            Exit full screen
          </button>
          <div className="relative flex max-h-full flex-col items-center justify-center">
            <EventLogo size="lg" showTagline tone="dark" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Presents
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {branding.eventTitle}
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">
              Scan to complete tonight&apos;s survey and ask questions from your
              phone.
            </p>
            <div className="mt-8">
              <JoinQR
                url={joinUrl}
                size={fullscreenQrSize}
                tone="dark"
                showCaption={false}
                padding="large"
              />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
              Scan to join
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-6 py-4">
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div>
            <EventLogo size="md" showTagline />
            <p className="mt-1 text-sm text-ink-muted">
              {showResults ? "Feedback segment" : "Waiting for feedback segment"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {joinUrl ? (
              <button
                type="button"
                onClick={handleOpenQrFullscreen}
                className="rounded-full border border-stage-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand shadow-sm transition hover:border-brand"
              >
                Full screen QR
              </button>
            ) : null}
            <div className="flex items-stretch divide-x divide-stage-border overflow-hidden rounded-xl border border-stage-border bg-white shadow-sm">
              <div className="px-4 py-2 text-center">
                <p className="font-display text-xl font-semibold leading-none tabular-nums text-ink">
                  {data.surveyResponseCount}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Survey replies
                </p>
              </div>
              <div className="px-4 py-2 text-center">
                <p className="font-display text-xl font-semibold leading-none tabular-nums text-ink">
                  {data.groupedQuestions.length}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Q&amp;A themes
                </p>
              </div>
            </div>
          </div>
        </header>

        {showResults ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
            <section className="panel flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 lg:col-span-3">
              <div className="mb-3 shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                  From the room
                </p>
                <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-ink">
                  Survey results
                </h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <SurveyResults
                  choiceResults={data.surveyChoiceResults}
                  textQuestions={textQuestions}
                  groupedAnswers={data.groupedSurveyAnswers}
                  allTextAnswers={allTextAnswers}
                  large
                />
              </div>
            </section>

            <section className="panel flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 lg:col-span-2">
              <div className="mb-3 shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                  Live Q&amp;A
                </p>
                <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-ink">
                  Question themes
                </h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <QuestionClusters groups={data.groupedQuestions} />
              </div>
            </section>
          </div>
        ) : (
          <section className="panel flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl p-8 text-center">
            <p className="font-display text-3xl font-semibold text-ink">
              Feedback segment not live yet
            </p>
            <p className="mt-3 max-w-xl text-base text-ink-muted">
              Open the survey for guests during the night, then enable{" "}
              <span className="font-semibold text-brand">Show on presenter</span>{" "}
              in the control room when you&apos;re ready to review results on
              screen.
            </p>
            {joinUrl ? (
              <div className="mt-8">
                <JoinQR url={joinUrl} size={180} showCaption={false} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  Guests can still join and complete the survey
                </p>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
};

export default PresentPage;
