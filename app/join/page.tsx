"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EventLogo from "@/components/EventLogo";
import { branding } from "@/lib/branding";

type FormState = {
  name: string;
  email: string;
  table: string;
  company: string;
};

const inputClassName =
  "rounded-lg border border-stage-border bg-white px-3 py-2 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const JoinPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    table: "",
    company: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }

    router.push("/live");
  };

  return (
    <main className="stage-gradient flex min-h-screen flex-col">
      <div className="accent-bar w-full" />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="panel w-full max-w-md rounded-2xl p-8"
        >
          <EventLogo size="sm" className="mb-6" />

          <h1 className="font-display text-2xl font-bold text-ink">Welcome</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Sign up to join tonight&apos;s polls and Q&amp;A.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                required
                aria-label="Your name"
                placeholder="Your name"
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                required
                aria-label="Your email"
                placeholder="you@example.com"
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">
                Table <span className="text-ink-faint">(optional)</span>
              </span>
              <input
                type="text"
                value={form.table}
                onChange={handleChange("table")}
                aria-label="Your table"
                placeholder="e.g. Table 5"
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">
                Company <span className="text-ink-faint">(optional)</span>
              </span>
              <input
                type="text"
                value={form.company}
                onChange={handleChange("company")}
                aria-label="Your company"
                placeholder="e.g. Acme Inc."
                className={inputClassName}
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg bg-accent-red/10 px-3 py-2 text-sm text-accent-red">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Joining…" : `Join ${branding.eventTitle}`}
          </button>
        </form>
      </div>
    </main>
  );
};

export default JoinPage;
