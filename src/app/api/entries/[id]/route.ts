import { NextRequest, NextResponse } from "next/server";
import { and, db, eq } from "@/db";
import { waterEntries } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const deleted = await db
    .delete(waterEntries)
    .where(and(eq(waterEntries.id, id), eq(waterEntries.userId, user.id)))
    .returning({ id: waterEntries.id });

  if (deleted.length === 0) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
