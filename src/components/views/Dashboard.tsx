"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Clock,
  Droplet,
  Flame,
  GlassWater,
  PartyPopper,
  Quote,
  Target,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useSession, useToast } from "@/lib/store";
import { useReminderState } from "@/lib/useReminders";
import {
  computeStreaks,
  entriesForDay,
  firstName,
  formatLiters,
  formatMl,
  greetingFor,
  totalForDay,
} from "@/lib/hydration";
import { goalCompleteMessage, motivationalMessage } from "@/lib/messages";
import { useCountUp } from "@/lib/useCountUp";
import type { ViewId } from "@/lib/types";
import ProgressRing from "../ProgressRing";
import WaterGlass from "../WaterGlass";
import QuickAdd from "../QuickAdd";
import Timeline from "../Timeline";

const CONFETTI_COLORS = ["#22d3ee", "#3b82f6", "#818cf8", "#34d399", "#fbbf24", "#f472b6"];

export default function Dashboard({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { user, entries, addWater, deleteEntry, lastAddedAt } = useSession();
  const reminders = useReminderState();
  const { push } = useToast();
  const [celebrating, setCelebrating] = useState(false);
  const celebratedRef = useRef(false);

  const name = firstName(user?.name ?? "friend");
  const today = new Date();
  const todayTotal = totalForDay(entries, today);
  const goalMl = user?.dailyGoalMl ?? 3000;
  const percent = goalMl > 0 ? todayTotal / goalMl : 0;
  const remaining = Math.max(0, goalMl - todayTotal);
  const todayEntries = useMemo(() => entriesForDay(entries, today), [entries, today]);
  const avgDrink = todayEntries.length ? Math.round(todayTotal / todayEntries.length) : 0;
  const streak = computeStreaks(entries, goalMl);

  const animatedPercent = useCountUp(Math.min(percent, 1) * 100, 850);
  const animatedTotal = useCountUp(todayTotal, 850);

  // Rotate motivational message with progress changes.
  const motivation = useMemo(
    () => (percent >= 1 ? goalCompleteMessage(name) : motivationalMessage(name, percent * 100)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, Math.round(percent * 100)],
  );

  // One-time celebration per day when the goal is crossed.
  useEffect(() => {
    if (!user) return;
    const key = `hydro-celebrated:${user.id}:${today.toDateString()}`;
    try {
      celebratedRef.current = localStorage.getItem(key) === "1";
    } catch {
      /* ignore */
    }
  }, [user, today]);

  useEffect(() => {
    if (!user || percent < 1 || celebratedRef.current) return;
    celebratedRef.current = true;
    setCelebrating(true);
    const key = `hydro-celebrated:${user.id}:${today.toDateString()}`;
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    push({
      title: `Amazing, ${name}!`,
      body: "You reached your hydration goal today.",
      icon: "sparkles",
      variant: "success",
    });
    const t = setTimeout(() => setCelebrating(false), 3200);
    return () => clearTimeout(t);
  }, [percent, user, name, push, today]);

  const handleAdd = async (amount: number) => {
    const ok = await addWater(amount);
    if (!ok) {
      push({ title: "Couldn't add water", body: "Please try again in a moment.", icon: "info", variant: "error" });
      return;
    }
    const newTotal = todayTotal + amount;
    const newPercent = Math.min(100, Math.round((newTotal / goalMl) * 100));
    push({
      title: `${formatMl(amount)} added`,
      body:
        newTotal >= goalMl
          ? goalCompleteMessage(name)
          : `Nice! You're ${newPercent}% hydrated.`,
      icon: "droplet",
      variant: "water",
    });
  };

  const stats = [
    {
      icon: GlassWater,
      label: "Glasses",
      value: String(todayEntries.length),
      sub: `of ~${Math.max(1, Math.round(goalMl / (user?.glassSizeMl ?? 250)))} glasses`,
    },
    {
      icon: Target,
      label: "Remaining",
      value: formatMl(remaining),
      sub: remaining === 0 ? "goal crushed" : "to go today",
    },
    {
      icon: TrendingUp,
      label: "Avg per drink",
      value: avgDrink ? formatMl(avgDrink) : "—",
      sub: "per serving",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${streak.current} ${streak.current === 1 ? "day" : "days"}`,
      sub: `best ${streak.longest} days`,
    },
  ];

  const confetti = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: (i * 23) % 100,
        delay: (i % 12) * 0.07,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + ((i * 5) % 8),
        round: i % 3 === 0,
      })),
    [],
  );

  return (
    <div className="space-y-6">
      {/* ---------- greeting ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label mb-1.5 flex items-center gap-2">
            <Waves size={14} className="text-[var(--accent-1)]" />
            {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {greetingFor(today)}, <span className="text-gradient">{name}</span>
          </h1>
          <p className="ink-2 mt-1.5">Let&apos;s keep you hydrated today.</p>
        </div>
      </div>

      {/* ---------- hero card ---------- */}
      <section className="glass sheen relative overflow-hidden p-6 sm:p-8" aria-label="Today's hydration">
        {/* confetti burst */}
        <AnimatePresence>
          {celebrating ? (
            <motion.div key="confetti" className="pointer-events-none absolute inset-0 z-20" exit={{ opacity: 0 }}>
              {confetti.map((c, i) => (
                <span
                  key={i}
                  className="confetti-bit absolute top-0"
                  style={{
                    left: `${c.left}%`,
                    width: c.size,
                    height: c.size * (c.round ? 1 : 1.8),
                    background: c.color,
                    borderRadius: c.round ? "50%" : 2,
                    animationDelay: `${c.delay}s`,
                  }}
                />
              ))}
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(120deg,var(--accent-1),var(--accent-2))",
                  boxShadow: "0 14px 40px -10px rgba(37,140,248,0.8)",
                }}
              >
                <PartyPopper size={16} />
                Goal complete — amazing work!
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
          {/* ring */}
          <div className="mx-auto">
            <ProgressRing percent={percent} size={250}>
              <span className="label">Today</span>
              <span className="font-display num mt-1 text-[52px] font-bold leading-none tracking-tight">
                {Math.round(animatedPercent)}
                <span className="text-gradient text-[30px]">%</span>
              </span>
              <span className="ink-2 mt-2 text-sm font-medium">hydrated</span>
              <span className="num mt-1 text-xs font-bold" style={{ color: "var(--accent-1)" }}>
                {formatLiters(animatedTotal)} / {formatLiters(goalMl)} L
              </span>
            </ProgressRing>
          </div>

          {/* middle: message + quick add */}
          <div className="min-w-0 space-y-6">
            <div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={motivation}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="font-display text-xl font-bold leading-snug sm:text-2xl"
                >
                  <Quote size={16} className="mr-2 inline text-[var(--accent-1)]" />
                  {motivation}
                </motion.p>
              </AnimatePresence>
              <p className="ink-2 mt-2 text-sm leading-relaxed">
                You&apos;ve had <strong className="num">{formatMl(todayTotal)}</strong> so far
                {remaining > 0 ? (
                  <>
                    {" "}— just <strong className="num">{formatMl(remaining)}</strong> left to hit your{" "}
                    {formatMl(goalMl)} goal.
                  </>
                ) : (
                  <> — goal complete. Your body thanks you.</>
                )}
              </p>
            </div>

            <div>
              <p className="label mb-3">Quick add</p>
              <QuickAdd glassSizeMl={user?.glassSizeMl ?? 250} onAdd={handleAdd} />
            </div>
          </div>

          {/* glass */}
          <div className="mx-auto hidden md:block">
            <WaterGlass percent={percent} goalMl={goalMl} lastAddedAt={lastAddedAt} size={190} />
          </div>
        </div>

        {/* mobile glass */}
        <div className="mt-8 md:hidden">
          <WaterGlass percent={percent} goalMl={goalMl} lastAddedAt={lastAddedAt} size={180} />
        </div>
      </section>

      {/* ---------- stat cards ---------- */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="glass-sm glass-hover p-4 sm:p-5"
          >
            <span
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
            >
              <s.icon size={18} />
            </span>
            <p className="num font-display text-xl font-bold sm:text-2xl">{s.value}</p>
            <p className="ink-3 mt-0.5 text-xs font-semibold">
              {s.label} · {s.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ---------- next reminder + timeline ---------- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass sheen p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2.5 text-lg font-bold">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
              >
                <BellRing size={16} />
              </span>
              Next reminder
            </h2>
            <button
              onClick={() => onNavigate("reminders")}
              className="text-xs font-bold text-[var(--accent-1)] transition-opacity hover:opacity-75"
            >
              Manage
            </button>
          </div>

          <div className="mt-5">
            {reminders.permission === "granted" && user?.notificationsEnabled ? (
              reminders.nextAt ? (
                <div className="flex items-center gap-4">
                  <div
                    className="num font-display text-4xl font-bold tracking-tight"
                    style={{ color: "var(--accent-1)" }}
                  >
                    {reminders.nextAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div className="ink-2 text-sm leading-snug">
                    {reminders.nextAt.toDateString() !== today.toDateString() ? "tomorrow" : "today"}
                    <br />
                    {!reminders.withinHours ? "outside active hours — paused" : `every ${user.reminderIntervalMins} min, smart-paused after drinks`}
                  </div>
                </div>
              ) : (
                <p className="ink-2 text-sm leading-relaxed">
                  {percent >= 1
                    ? "Goal complete — reminders rest until tomorrow. Enjoy the glow."
                    : "Reminders are paused for now."}
                </p>
              )
            ) : (
              <div>
                <p className="ink-2 text-sm leading-relaxed">
                  Enable notifications and we&apos;ll nudge you by name throughout the day.
                </p>
                <button className="btn-ghost mt-4 w-full !py-2.5 text-sm" onClick={() => onNavigate("reminders")}>
                  <BellRing size={15} className="text-[var(--accent-1)]" />
                  Set up reminders
                </button>
              </div>
            )}
          </div>

          <div
            className="mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-semibold"
            style={{ background: "var(--track)", color: "var(--ink-2)" }}
          >
            <Clock size={14} className="shrink-0 text-[var(--accent-1)]" />
            Active hours {user?.reminderStart} – {user?.reminderEnd} · interval {user?.reminderIntervalMins} min
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass sheen p-6"
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2.5 text-lg font-bold">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
              >
                <Droplet size={16} />
              </span>
              Today&apos;s timeline
            </h2>
            <span className="chip pointer-events-none !cursor-default num">{todayEntries.length} entries</span>
          </div>
          <div className="max-h-[340px] overflow-y-auto pr-1">
            <Timeline entries={todayEntries} onDelete={deleteEntry} onAdd={() => handleAdd(user?.glassSizeMl ?? 250)} compact />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
