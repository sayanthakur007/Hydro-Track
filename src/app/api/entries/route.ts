import { NextRequest, NextResponse } from "next/server";
import { and, db, desc, eq, gte, lte } from "@/db";
import { waterEntries } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(Number(url.searchParams.get("days")) || 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select()
    .from(waterEntries)
    .where(and(eq(waterEntries.userId, user.id), gte(waterEntries.createdAt, since), lte(waterEntries.createdAt, new Date())))
    .orderBy(desc(waterEntries.createdAt))
    .limit(5000);

  return NextResponse.json({
    entries: rows.map((r: { id: string; amountMl: number; createdAt: Date | string }) => ({
      id: r.id,
      amountMl: r.amountMl,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { amountMl?: number } | null;
  const amount = Number(body?.amountMl);

  if (!Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "Please enter an amount greater than zero." }, { status: 400 });
  if (amount > 2500)
    return NextResponse.json({ error: "That seems like a lot for one drink — please keep it under 2.5 L." }, { status: 400 });

  const [entry] = await db
    .insert(waterEntries)
    .values({ userId: user.id, amountMl: Math.round(amount) })
    .returning();

  return NextResponse.json(
    { entry: { id: entry.id, amountMl: entry.amountMl, createdAt: entry.createdAt.toISOString() } },
    { status: 201 },
  );
}
