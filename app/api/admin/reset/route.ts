import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";

const bodySchema = z.object({
  scope: z.enum(["questions", "votes", "all"]),
});

export const POST = async (request: Request) => {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { scope } = parsed.data;

  if (scope === "questions" || scope === "all") {
    await supabase.from("questions").delete().not("id", "is", null);
    await supabase.from("question_groups").delete().not("id", "is", null);
  }
  if (scope === "votes" || scope === "all") {
    await supabase.from("votes").delete().not("id", "is", null);
  }

  return NextResponse.json({ ok: true });
};
