import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, setAdmin } from "@/lib/session";

export const GET = async () => {
  return NextResponse.json({ admin: await isAdmin() });
};

const bodySchema = z.object({ password: z.string() });

export const POST = async (request: Request) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD ?? "changeme";
  if (parsed.data.password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  await setAdmin(true);
  return NextResponse.json({ ok: true });
};

export const DELETE = async () => {
  await setAdmin(false);
  return NextResponse.json({ ok: true });
};
