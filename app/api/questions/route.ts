import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getAttendeeId } from "@/lib/session";

const bodySchema = z.object({
  text: z.string().trim().min(3, "Question is too short").max(400),
});

export const POST = async (request: Request) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid question" },
      { status: 400 },
    );
  }

  const attendeeId = await getAttendeeId();
  const supabase = createAdminClient();

  const { error } = await supabase.from("questions").insert({
    text: parsed.data.text,
    attendee_id: attendeeId,
    group_id: null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not submit question." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
};
