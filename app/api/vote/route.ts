import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getAttendeeId } from "@/lib/session";

const bodySchema = z.object({
  pollId: z.string().uuid(),
  optionIndex: z.number().int().min(0),
});

export const POST = async (request: Request) => {
  const attendeeId = await getAttendeeId();
  if (!attendeeId) {
    return NextResponse.json({ error: "Please sign up first." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const { pollId, optionIndex } = parsed.data;
  const supabase = createAdminClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll || !poll.is_open) {
    return NextResponse.json({ error: "This poll is closed." }, { status: 409 });
  }
  if (optionIndex >= poll.options.length) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  // One vote per attendee per poll: update on conflict.
  const { error } = await supabase
    .from("votes")
    .upsert(
      { poll_id: pollId, attendee_id: attendeeId, option_index: optionIndex },
      { onConflict: "poll_id,attendee_id" },
    );

  if (error) {
    return NextResponse.json({ error: "Could not record vote." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
};
