import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export type RawQuestion = { id: string; text: string };

export type GroupResult = {
  clusters: QuestionCluster[];
  engine: "openai" | "mock";
  error?: string;
};

export type QuestionCluster = {
  label: string;
  summary: string;
  question: string;
  questionIds: string[];
};

export type ParsedScheduleItem = {
  title: string;
  start_time: string | null;
  end_time: string | null;
  speaker: string | null;
  description: string | null;
};

const hasOpenAI = (): boolean => Boolean(process.env.OPENAI_API_KEY);

const MODEL = "gpt-4o-mini";

// --- Question grouping ---------------------------------------------------

const clusterSchema = z.object({
  clusters: z.array(
    z.object({
      label: z.string().describe("Short 2-5 word theme for this group"),
      summary: z
        .string()
        .describe("One sentence summarising what these questions ask"),
      question: z
        .string()
        .describe(
          "A single clear, generalised question that represents and combines all the questions in this group, phrased for the presenter to read aloud and answer",
        ),
      questionIds: z.array(z.string()),
    }),
  ),
});

const surveyClusterSchema = z.object({
  clusters: z.array(
    z.object({
      label: z
        .string()
        .describe("Short 2-5 word theme label, e.g. 'Audio & sound'"),
      summary: z
        .string()
        .describe(
          "One sentence summarising the shared theme of these responses",
        ),
      question: z
        .string()
        .describe(
          "A single headline the presenter can read aloud that captures this theme",
        ),
      responseIds: z.array(z.string()),
    }),
  ),
});

export const groupSurveyResponses = async (
  questionText: string,
  responses: RawQuestion[],
): Promise<GroupResult> => {
  if (responses.length === 0) return { clusters: [], engine: "mock" };
  if (!hasOpenAI()) {
    return {
      clusters: mockGroupSurveyResponses(responses),
      engine: "mock",
      error: "OPENAI_API_KEY is not set",
    };
  }

  try {
    const { object } = await generateObject({
      model: openai(MODEL),
      schema: surveyClusterSchema,
      prompt: [
        "You are clustering free-text survey feedback for a charity gala.",
        `Survey question: "${questionText}"`,
        "",
        "Group responses that share the SAME specific theme or suggestion.",
        "Rules:",
        "- Keep distinct topics in separate clusters — do NOT lump unrelated feedback together.",
        "- Responses that only say nothing to improve, no comment, or purely positive praise",
        "  (e.g. 'Nothing', 'Great event', 'Well done') belong in ONE 'No suggestions' cluster.",
        "- Constructive criticism about audio, sound, AV, or microphones should be its own cluster.",
        "- Each cluster needs a clear shared theme; prefer several small clusters over one large catch-all.",
        "- Very short unique responses (e.g. 'Branding', 'Advertising') can be their own single-item cluster.",
        "- Every response id must appear in exactly one cluster. Use the exact ids provided.",
        "",
        "Responses (JSON):",
        JSON.stringify(responses),
      ].join("\n"),
    });

    const mapped: QuestionCluster[] = object.clusters.map((cluster) => ({
      label: cluster.label,
      summary: cluster.summary,
      question: cluster.question,
      questionIds: cluster.responseIds,
    }));

    const valid = sanitiseClusters(mapped, responses);
    if (valid.length > 0) return { clusters: valid, engine: "openai" };
    return {
      clusters: mockGroupSurveyResponses(responses),
      engine: "mock",
      error: "AI returned no clusters",
    };
  } catch (error) {
    return {
      clusters: mockGroupSurveyResponses(responses),
      engine: "mock",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const groupQuestions = async (
  questions: RawQuestion[],
): Promise<GroupResult> => {
  if (questions.length === 0) return { clusters: [], engine: "mock" };
  if (!hasOpenAI()) {
    return {
      clusters: mockGroupQuestions(questions),
      engine: "mock",
      error: "OPENAI_API_KEY is not set",
    };
  }

  try {
    const { object } = await generateObject({
      model: openai(MODEL),
      schema: clusterSchema,
      prompt: [
        "You are clustering audience questions for a live Q&A.",
        "Group questions that ask about the same topic together.",
        "Keep distinct topics in separate clusters. Every question id must",
        "appear in exactly one cluster. Use the exact ids provided.",
        "For each cluster, also write a single generalised question that",
        "combines all the questions in the group into one clear question the",
        "presenter can read aloud and answer.",
        "",
        "Questions (JSON):",
        JSON.stringify(questions),
      ].join("\n"),
    });

    const valid = sanitiseClusters(object.clusters, questions);
    if (valid.length > 0) return { clusters: valid, engine: "openai" };
    return {
      clusters: mockGroupQuestions(questions),
      engine: "mock",
      error: "AI returned no clusters",
    };
  } catch (error) {
    return {
      clusters: mockGroupQuestions(questions),
      engine: "mock",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Ensure every question id is accounted for exactly once even if the model
// drops or hallucinates ids.
const sanitiseClusters = (
  clusters: QuestionCluster[],
  questions: RawQuestion[],
): QuestionCluster[] => {
  const known = new Set(questions.map((q) => q.id));
  const seen = new Set<string>();
  const cleaned: QuestionCluster[] = [];

  for (const cluster of clusters) {
    const ids = cluster.questionIds.filter((id) => known.has(id) && !seen.has(id));
    ids.forEach((id) => seen.add(id));
    if (ids.length > 0) {
      const first = questions.find((q) => q.id === ids[0]);
      cleaned.push({
        label: cluster.label?.trim() || "General",
        summary: cluster.summary?.trim() || "",
        question: cluster.question?.trim() || first?.text || "",
        questionIds: ids,
      });
    }
  }

  const leftovers = questions.filter((q) => !seen.has(q.id));
  if (leftovers.length > 0) {
    cleaned.push({
      label: "Other",
      summary: "",
      question: leftovers[0].text,
      questionIds: leftovers.map((q) => q.id),
    });
  }
  return cleaned;
};

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "did", "how", "what", "why",
  "when", "where", "who", "will", "can", "could", "would", "should", "to",
  "of", "in", "on", "for", "and", "or", "with", "about", "you", "your", "we",
  "i", "it", "this", "that", "be", "have", "has", "as", "at", "by", "from",
]);

const tokenize = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );

const overlap = (a: Set<string>, b: Set<string>): number => {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  const denom = Math.min(a.size, b.size) || 1;
  return shared / denom;
};

// Offline fallback: greedy token-overlap clustering. Good enough to make the
// demo visually convincing without any API key or network.
const mockGroupQuestions = (questions: RawQuestion[]): QuestionCluster[] => {
  const tokens = new Map(questions.map((q) => [q.id, tokenize(q.text)] as const));
  const clusters: { ids: string[]; seed: Set<string> }[] = [];
  const THRESHOLD = 0.34;

  for (const q of questions) {
    const t = tokens.get(q.id)!;
    let placed = false;
    for (const cluster of clusters) {
      if (overlap(t, cluster.seed) >= THRESHOLD) {
        cluster.ids.push(q.id);
        for (const w of t) cluster.seed.add(w);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push({ ids: [q.id], seed: new Set(t) });
  }

  return clusters.map((cluster) => {
    const top = [...cluster.seed].slice(0, 3).join(" ");
    // Use the longest question in the cluster as the representative one.
    const representative = cluster.ids
      .map((id) => questions.find((q) => q.id === id)!)
      .sort((a, b) => b.text.length - a.text.length)[0];
    return {
      label: top ? capitalise(top) : "General",
      summary: "",
      question: representative?.text ?? "",
      questionIds: cluster.ids,
    };
  });
};

const capitalise = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

type ThemeRule = { label: string; pattern: RegExp };

const SURVEY_THEME_RULES: ThemeRule[] = [
  { label: "No suggestions", pattern: /\b(nothing|no comment|niks|no suggestion|all great|well done|great event|great night|amazing job|lovely)\b/i },
  { label: "Audio & sound", pattern: /\b(audio|visual|sound|av\b|audible|microphone|speaker|volume)\b/i },
  { label: "More events", pattern: /\b(more event|get together|bring.*friends|guest speaker|sunshine coast)\b/i },
  { label: "Auction & prizes", pattern: /\b(auction|whisky|boerewors|boetewors|drinking game|hamper)\b/i },
  { label: "Advertising", pattern: /\b(advertis|brand|promot|market)\b/i },
  { label: "Art & decor", pattern: /\b(frame|art\b|decor)\b/i },
  { label: "Student feedback", pattern: /\b(student|recipient|donation)\b/i },
];

const matchSurveyTheme = (text: string): string | null => {
  for (const rule of SURVEY_THEME_RULES) {
    if (rule.pattern.test(text)) return rule.label;
  }
  return null;
};

const mockGroupSurveyResponses = (responses: RawQuestion[]): QuestionCluster[] => {
  const byTheme = new Map<string, string[]>();

  for (const response of responses) {
    const theme = matchSurveyTheme(response.text) ?? `__other__:${response.id}`;
    const bucket = byTheme.get(theme) ?? [];
    bucket.push(response.id);
    byTheme.set(theme, bucket);
  }

  const clusters: QuestionCluster[] = [];

  for (const [theme, ids] of byTheme) {
    const items = ids.map((id) => responses.find((r) => r.id === id)!);
    const label =
      theme.startsWith("__other__:") && ids.length === 1
        ? capitalise(items[0].text.slice(0, 40))
        : theme.startsWith("__other__:")
          ? "Other feedback"
          : theme;

    clusters.push({
      label,
      summary: "",
      question: items.sort((a, b) => b.text.length - a.text.length)[0].text,
      questionIds: ids,
    });
  }

  return clusters.sort((a, b) => b.questionIds.length - a.questionIds.length);
};

// --- Schedule parsing ----------------------------------------------------

const scheduleSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      start_time: z.string().nullable().describe("e.g. '6:00 PM' or null"),
      end_time: z.string().nullable(),
      speaker: z.string().nullable(),
      description: z.string().nullable(),
    }),
  ),
});

export const parseSchedule = async (
  raw: string,
): Promise<ParsedScheduleItem[]> => {
  const text = raw.trim();
  if (!text) return [];
  if (!hasOpenAI()) return mockParseSchedule(text);

  try {
    const { object } = await generateObject({
      model: openai(MODEL),
      schema: scheduleSchema,
      prompt: [
        "Extract an event agenda from the text below into ordered items.",
        "Preserve the order they appear. Include start/end times and speaker",
        "when present, otherwise use null. Keep titles concise.",
        "",
        "Text:",
        text,
      ].join("\n"),
    });
    return object.items.length > 0 ? object.items : mockParseSchedule(text);
  } catch {
    return mockParseSchedule(text);
  }
};

// Offline fallback: parse common "TIME - TITLE" line formats.
const mockParseSchedule = (text: string): ParsedScheduleItem[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const timeRe =
    /^(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\s*[-:–|]?\s*(.*)$/i;

  const items: ParsedScheduleItem[] = [];
  for (const line of lines) {
    const m = line.match(timeRe);
    if (m && m[3]) {
      items.push({
        title: m[3].trim(),
        start_time: m[1]?.trim() ?? null,
        end_time: m[2]?.trim() ?? null,
        speaker: null,
        description: null,
      });
      continue;
    }
    // Fallback: "Title - Speaker" or plain title.
    const dash = line.split(/\s+[-–]\s+/);
    items.push({
      title: dash[0].trim(),
      start_time: null,
      end_time: null,
      speaker: dash[1]?.trim() ?? null,
      description: null,
    });
  }
  return items;
};
