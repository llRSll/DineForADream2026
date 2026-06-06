import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { setAttendeeId } from "@/lib/session";

const bodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(200),
  table: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
});

export const POST = async (request: Request) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, table, company } = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("attendees")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing) {
    await setAttendeeId(existing.id);
    return NextResponse.json({ attendee: existing });
  }

  const { data, error } = await supabase
    .from("attendees")
    .insert({
      name,
      email: email.toLowerCase(),
      table_name: table || null,
      company: company || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not sign you up. Please try again." },
      { status: 500 },
    );
  }

  await setAttendeeId(data.id);
  return NextResponse.json({ attendee: data });
};
