import { NextRequest, NextResponse } from "next/server";
import { asc, db, eq } from "@/db";
import { users, waterEntries } from "@/db/schema";
import { getSessionUser, publicUser } from "@/lib/auth";

const HISTORY_DAYS = 180;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - HISTORY_DAYS);

  const rows = await db
    .select()
    .from(waterEntries)
    .where(eq(waterEntries.userId, user.id))
    .orderBy(asc(waterEntries.createdAt))
    .limit(8000);

  const entries = rows
    .filter((r: { createdAt: Date | string }) => new Date(r.createdAt) >= since)
    .map((r: { id: string; amountMl: number; createdAt: Date | string }) => ({
      id: r.id,
      amountMl: r.amountMl,
      createdAt: new Date(r.createdAt).toISOString(),
    }));

  return NextResponse.json({ user: publicUser(user), entries });
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const AVATAR_THEMES = new Set(["aqua", "violet", "sunset", "leaf", "rose", "amber"]);

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const patch: Partial<typeof users.$inferInsert> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 60)
      return NextResponse.json({ error: "Please enter a valid name (2–60 characters)." }, { status: 400 });
    patch.name = name;
  }
  if (body.dailyGoalMl !== undefined) {
    const v = Number(body.dailyGoalMl);
    if (!Number.isFinite(v) || v < 500 || v > 8000)
      return NextResponse.json({ error: "Daily goal must be between 500 and 8000 ml." }, { status: 400 });
    patch.dailyGoalMl = Math.round(v);
  }
  if (body.glassSizeMl !== undefined) {
    const v = Number(body.glassSizeMl);
    if (!Number.isFinite(v) || v < 50 || v > 1000)
      return NextResponse.json({ error: "Glass size must be between 50 and 1000 ml." }, { status: 400 });
    patch.glassSizeMl = Math.round(v);
  }
  if (body.reminderIntervalMins !== undefined) {
    const v = Number(body.reminderIntervalMins);
    if (!Number.isFinite(v) || v < 10 || v > 480)
      return NextResponse.json({ error: "Reminder interval must be between 10 minutes and 8 hours." }, { status: 400 });
    patch.reminderIntervalMins = Math.round(v);
  }
  if (body.reminderStart !== undefined) {
    const v = String(body.reminderStart);
    if (!TIME_RE.test(v)) return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
    patch.reminderStart = v;
  }
  if (body.reminderEnd !== undefined) {
    const v = String(body.reminderEnd);
    if (!TIME_RE.test(v)) return NextResponse.json({ error: "Invalid end time." }, { status: 400 });
    patch.reminderEnd = v;
  }
  if (body.notificationsEnabled !== undefined) {
    patch.notificationsEnabled = Boolean(body.notificationsEnabled);
  }
  if (body.theme !== undefined) {
    const v = String(body.theme);
    if (v !== "dark" && v !== "light") return NextResponse.json({ error: "Invalid theme." }, { status: 400 });
    patch.theme = v;
  }
  if (body.avatarTheme !== undefined) {
    const v = String(body.avatarTheme);
    if (!AVATAR_THEMES.has(v)) return NextResponse.json({ error: "Invalid avatar theme." }, { status: 400 });
    patch.avatarTheme = v;
  }

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
  return NextResponse.json({ user: publicUser(updated) });
}
