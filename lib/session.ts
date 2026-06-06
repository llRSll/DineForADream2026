import "server-only";

import { cookies } from "next/headers";

const ATTENDEE_COOKIE = "attendee_id";
const ADMIN_COOKIE = "admin_ok";

// One year, in seconds.
const MAX_AGE = 60 * 60 * 24 * 365;

export const getAttendeeId = async (): Promise<string | null> => {
  const store = await cookies();
  return store.get(ATTENDEE_COOKIE)?.value ?? null;
};

export const setAttendeeId = async (attendeeId: string): Promise<void> => {
  const store = await cookies();
  store.set(ATTENDEE_COOKIE, attendeeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
};

export const isAdmin = async (): Promise<boolean> => {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "1";
};

export const setAdmin = async (ok: boolean): Promise<void> => {
  const store = await cookies();
  if (!ok) {
    store.delete(ADMIN_COOKIE);
    return;
  }
  store.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
};
