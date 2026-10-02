import { NextRequest, NextResponse } from "next/server";
import { db, eq } from "@/db";
import { users } from "@/db/schema";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      email?: string;
      password?: string;
    } | null;

    const email = (body?.email ?? "").trim().toLowerCase();
    const password = body?.password ?? "";

    if (!email || !password)
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash))
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "We couldn't sign you in right now. Please try again." }, { status: 500 });
  }
}
