import { NextResponse } from "next/server";
import { db, eq } from "@/db";
import { users, waterEntries } from "@/db/schema";
import { createSession, hashPassword, publicUser } from "@/lib/auth";

const DEMO_EMAIL = "demo@hydrotrack.app";
const DEMO_GOAL = 2600;
const AMOUNTS = [150, 200, 250, 250, 300, 350, 400, 500];

function mulberry(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function POST() {
  try {
    let [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          name: "Sayan Thakur",
          email: DEMO_EMAIL,
          passwordHash: hashPassword("demo1234"),
          dailyGoalMl: DEMO_GOAL,
          avatarTheme: "aqua",
        })
        .returning();
    }

    // Reset & reseed the demo dataset so charts/streaks always look alive.
    await db.delete(waterEntries).where(eq(waterEntries.userId, user.id));

    const rand = mulberry(Date.now() % 100000);
    const rows: { userId: string; amountMl: number; createdAt: Date }[] = [];
    const now = new Date();

    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);
      day.setHours(7, 30, 0, 0);

      const isToday = dayOffset === 0;
      const targetRatio = isToday ? 0.45 + rand() * 0.2 : rand() < 0.72 ? 1 + rand() * 0.25 : 0.4 + rand() * 0.45;
      let consumed = 0;
      let cursor = day.getTime();
      const endOfDay = new Date(day).setHours(22, 30, 0, 0);
      const nowCap = isToday ? now.getTime() : endOfDay;

      while (consumed < DEMO_GOAL * targetRatio && cursor < nowCap) {
        const amount = AMOUNTS[Math.floor(rand() * AMOUNTS.length)];
        const at = new Date(Math.min(cursor, nowCap - 5 * 60_000));
        if (at.getTime() > now.getTime() && isToday) break;
        rows.push({ userId: user.id, amountMl: amount, createdAt: at });
        consumed += amount;
        cursor += (55 + rand() * 100) * 60_000;
      }
    }

    if (rows.length > 0) await db.insert(waterEntries).values(rows);

    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    console.error("demo error", err);
    return NextResponse.json({ error: "We couldn't open the demo right now. Please try again." }, { status: 500 });
  }
}
