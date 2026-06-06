import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";

const optionsSchema = z.array(z.string().trim().min(1).max(120)).min(2).max(6);

const createSchema = z.object({
  action: z.literal("create"),
  question: z.string().trim().min(1).max(300),
  options: optionsSchema,
});

const updateSchema = z.object({
  action: z.literal("update"),
  pollId: z.string().uuid(),
  question: z.string().trim().min(1).max(300),
  options: optionsSchema,
});

const deleteSchema = z.object({
  action: z.literal("delete"),
  pollId: z.string().uuid(),
});

const goLiveSchema = z.object({
  action: z.literal("golive"),
  pollId: z.string().uuid(),
});

const closeSchema = z.object({
  action: z.literal("close"),
});

const bodySchema = z.union([
  createSchema,
  updateSchema,
  deleteSchema,
  goLiveSchema,
  closeSchema,
]);

export const POST = async (request: Request) => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const body = parsed.data;

  if (body.action === "create") {
    const { data, error } = await supabase
      .from("polls")
      .insert({ question: body.question, options: body.options, is_open: false })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Could not save poll" }, { status: 500 });
    }
    return NextResponse.json({ poll: data });
  }

  if (body.action === "update") {
    const { error } = await supabase
      .from("polls")
      .update({ question: body.question, options: body.options })
      .eq("id", body.pollId);
    if (error) {
      return NextResponse.json({ error: "Could not update poll" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    await supabase.from("votes").delete().eq("poll_id", body.pollId);
    await supabase.from("polls").delete().eq("id", body.pollId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "close") {
    await supabase.from("polls").update({ is_open: false }).eq("is_open", true);
    return NextResponse.json({ ok: true });
  }

  // golive: close any other open poll, then open this one (one live at a time).
  await supabase.from("polls").update({ is_open: false }).neq("id", body.pollId);
  const { error } = await supabase
    .from("polls")
    .update({ is_open: true })
    .eq("id", body.pollId);
  if (error) {
    return NextResponse.json({ error: "Could not start poll" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
};
