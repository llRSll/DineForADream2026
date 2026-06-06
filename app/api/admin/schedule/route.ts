import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";
import { parseSchedule } from "@/lib/ai";

const bodySchema = z.object({
  raw: z.string().trim().min(1, "Paste or upload a schedule first").max(20000),
});

export const POST = async (request: Request) => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const items = await parseSchedule(parsed.data.raw);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Could not extract any agenda items." },
      { status: 422 },
    );
  }

  const supabase = createAdminClient();
  await supabase.from("schedule_items").delete().not("id", "is", null);

  const rows = items.map((item, index) => ({ ...item, position: index }));
  const { error } = await supabase.from("schedule_items").insert(rows);
  if (error) {
    return NextResponse.json({ error: "Could not save agenda" }, { status: 500 });
  }

  return NextResponse.json({ items: rows.length });
};
