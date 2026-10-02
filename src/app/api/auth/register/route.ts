import { NextRequest, NextResponse } from "next/server";
import { db, eq } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, publicUser } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      dailyGoalMl?: number;
    } | null;

    if (!body) return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const confirm = body.confirmPassword ?? "";
    const goal = Number(body.dailyGoalMl);

    if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (name.length > 60) return NextResponse.json({ error: "That name is a bit too long." }, { status: 400 });
    if (!EMAIL_RE.test(email) && email.length < 3)
      return NextResponse.json({ error: "Please enter a valid email or username." }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (password !== confirm) return NextResponse.json({ error: "Passwords don't match." }, { status: 400 });

    const dailyGoalMl = Number.isFinite(goal) && goal >= 500 && goal <= 8000 ? Math.round(goal) : 3000;

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0)
      return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });

    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password), dailyGoalMl })
      .returning();

    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) }, { status: 201 });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "We couldn't create your account right now. Please try again." }, { status: 500 });
  }
}
