"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck2,
  Crown,
  Droplet,
  Flame,
  Gem,
  Lock,
  Medal,
  Sparkles,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import { useSession } from "@/lib/store";
import { computeStreaks, totalsByDay } from "@/lib/hydration";
import { useCountUp } from "@/lib/useCountUp";
import ProgressRing from "../ProgressRing";

interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  icon: typeof Droplet;
  gradient: string;
  check: (m: Metrics) => boolean;
  progress?: (m: Metrics) => { current: number; target: number };
}

interface Metrics {
  entryCount: number;
  totalMl: number;
  longest: number;
  completedDays: number;
}

const BADGES: BadgeDef[] = [
  {
    id: "first-drop",
    title: "First Drop",
    desc: "Log your very first glass of water",
    icon: Droplet,
    gradient: "linear-gradient(135deg,#22d3ee,#0ea5e9)",
    check: (m) => m.entryCount >= 1,
    progress: (m) => ({ current: Math.min(m.entryCount, 1), target: 1 }),
  },
  {
    id: "first-goal",
    title: "First Goal",
    desc: "Complete your daily goal once",
    icon: Medal,
    gradient: "linear-gradient(135deg,#34d399,#0ea5e9)",
    check: (m) => m.completedDays >= 1,
    progress: (m) => ({ current: Math.min(m.completedDays, 1), target: 1 }),
  },
  {
    id: "streak-3",
    title: "3 Day Streak",
    desc: "Hit your goal 3 days in a row",
    icon: Flame,
    gradient: "linear-gradient(135deg,#fbbf24,#f97316)",
    check: (m) => m.longest >= 3,
    progress: (m) => ({ current: Math.min(m.longest, 3), target: 3 }),
  },
  {
    id: "streak-7",
    title: "7 Day Streak",
    desc: "A full week of hydration wins",
    icon: Zap,
    gradient: "linear-gradient(135deg,#fb923c,#ef4444)",
    check: (m) => m.longest >= 7,
    progress: (m) => ({ current: Math.min(m.longest, 7), target: 7 }),
  },
  {
    id: "streak-14",
    title: "Fortnight Flow",
    desc: "14 consecutive goal days",
    icon: Waves,
    gradient: "linear-gradient(135deg,#60a5fa,#6366f1)",
    check: (m) => m.longest >= 14,
    progress: (m) => ({ current: Math.min(m.longest, 14), target: 14 }),
  },
  {
    id: "streak-30",
    title: "30 Day Streak",
    desc: "A month of unbroken hydration",
    icon: Crown,
    gradient: "linear-gradient(135deg,#a78bfa,#d946ef)",
    check: (m) => m.longest >= 30,
    progress: (m) => ({ current: Math.min(m.longest, 30), target: 30 }),
  },
  {
    id: "ocean-50",
    title: "Ocean Drinker",
    desc: "Drink 50 liters in total",
    icon: Gem,
    gradient: "linear-gradient(135deg,#2dd4bf,#0ea5e9)",
    check: (m) => m.totalMl >= 50_000,
    progress: (m) => ({ current: Math.min(Math.round(m.totalMl / 1000), 50), target: 50 }),
  },
  {
    id: "master",
    title: "Hydration Master",
    desc: "Complete 30 total goal days",
    icon: Trophy,
    gradient: "linear-gradient(135deg,#f472b6,#8b5cf6)",
    check: (m) => m.completedDays >= 30,
    progress: (m) => ({ current: Math.min(m.completedDays, 30), target: 30 }),
  },
];

export default function AchievementsView() {
  const { entries, user } = useSession();
  const goalMl = user?.dailyGoalMl ?? 3000;

  const metrics = useMemo<Metrics>(() => {
    const streaks = computeStreaks(entries, goalMl);
    const totals = totalsByDay(entries);
    let totalMl = 0;
    totals.forEach((v) => (totalMl += v));
    return {
      entryCount: entries.length,
      totalMl,
      longest: streaks.longest,
      completedDays: streaks.completedDays,
    };
  }, [entries, goalMl]);

  const current = computeStreaks(entries, goalMl).current;
  const unlocked = BADGES.filter((b) => b.check(metrics));
  const animatedCurrent = useCountUp(current, 900);

  // Track which badges are "new" since last visit.
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const storedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const key = `hydro-badges:${user.id}`;
    try {
      const prev = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
      const fresh = unlocked.map((b) => b.id).filter((id) => !prev.has(id));
      if (storedRef.current === null) setNewIds(new Set(fresh));
      storedRef.current = key;
      // Save after the animation has had time to play.
      const t = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(unlocked.map((b) => b.id)));
        setNewIds(new Set());
      }, 4500);
      return () => clearTimeout(t);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, unlocked.length]);

  // Progress towards the next locked badge (the closest one).
  const nextBadge = BADGES.filter((b) => !b.check(metrics))
    .map((b) => ({ badge: b, p: b.progress!(metrics) }))
    .sort((a, b) => b.p.current / b.p.target - a.p.current / a.p.target)[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-1.5 flex items-center gap-2">
          <Trophy size={14} className="text-[var(--accent-1)]" />
          Gamified goals
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Achievements</h1>
        <p className="ink-2 mt-1.5">Badges, streaks and milestones from your hydration journey.</p>
      </div>

      {/* ---------- streak hero ---------- */}
      <section className="glass sheen relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, #f97316 24%, transparent), transparent 70%)" }}
        />
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-4">
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="flex h-16 w-16 items-center justify-center rounded-3xl text-white"
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#ef4444)",
                  boxShadow: "0 18px 40px -10px rgba(239,104,20,0.75)",
                }}
              >
                <Flame size={30} />
              </motion.span>
              <div>
                <p className="num font-display text-4xl font-bold leading-none sm:text-5xl">
                  {Math.round(animatedCurrent)}
                  <span className="text-gradient ml-2 text-xl sm:text-2xl">day streak</span>
                </p>
                <p className="ink-3 mt-2 text-sm font-semibold">
                  longest {metrics.longest} days · {metrics.completedDays} goal days completed
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="chip pointer-events-none !cursor-default">
                <CalendarCheck2 size={14} className="text-[var(--success)]" />
                {metrics.completedDays} goals crushed
              </span>
              <span className="chip pointer-events-none !cursor-default num">
                {(metrics.totalMl / 1000).toFixed(1)} L lifetime
              </span>
              <span className="chip pointer-events-none !cursor-default">
                <Sparkles size={14} className="text-[var(--accent-1)]" />
                {unlocked.length} / {BADGES.length} badges
              </span>
            </div>
          </div>

          {nextBadge ? (
            <div className="mx-auto flex flex-col items-center gap-3">
              <ProgressRing
                size={150}
                stroke={12}
                percent={nextBadge.p.target ? nextBadge.p.current / nextBadge.p.target : 0}
              >
                <nextBadge.badge.icon size={26} className="text-[var(--accent-1)]" />
                <span className="num mt-1 text-sm font-bold">
                  {nextBadge.p.current}/{nextBadge.p.target}
                </span>
              </ProgressRing>
              <p className="ink-3 max-w-[170px] text-center text-xs font-semibold leading-snug">
                Next up — <span style={{ color: "var(--ink)" }}>{nextBadge.badge.title}</span>
              </p>
            </div>
          ) : (
            <div className="mx-auto flex flex-col items-center gap-2 text-center">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-3xl text-white"
                style={{ background: "linear-gradient(135deg,#f472b6,#8b5cf6)" }}
              >
                <Crown size={30} />
              </span>
              <p className="font-display text-sm font-bold">All badges unlocked!</p>
              <p className="ink-3 text-xs">Absolute hydration legend status.</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- badge grid ---------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {BADGES.map((badge, i) => {
          const isUnlocked = badge.check(metrics);
          const isNew = newIds.has(badge.id);
          const prog = badge.progress?.(metrics);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
              className={`glass-sm glass-hover relative overflow-hidden p-5 ${isUnlocked ? "" : "opacity-80"}`}
              style={isNew ? { boxShadow: "0 0 0 2px var(--accent-1), 0 16px 44px -12px rgba(56,189,248,0.6)" } : undefined}
            >
              {isNew ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.4 }}
                  className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                  style={{ background: "linear-gradient(120deg,var(--accent-1),var(--accent-2))" }}
                >
                  New
                </motion.span>
              ) : null}

              <motion.div
                animate={isUnlocked && (isNew || i < 2) ? { rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.06 }}
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{
                  background: isUnlocked ? badge.gradient : "var(--card-strong)",
                  color: isUnlocked ? "#fff" : "var(--ink-3)",
                  boxShadow: isUnlocked ? "0 14px 32px -10px rgba(56,140,248,0.65)" : "none",
                }}
              >
                <badge.icon size={26} />
                {!isUnlocked ? (
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "var(--bg-1)", border: "1px solid var(--line-strong)" }}>
                    <Lock size={11} className="ink-3" />
                  </span>
                ) : null}
              </motion.div>

              <p className="font-display mt-4 font-bold leading-tight">{badge.title}</p>
              <p className="ink-3 mt-1 text-xs font-medium leading-snug">{badge.desc}</p>

              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--track)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isUnlocked ? badge.gradient : "var(--accent-2)" }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${isUnlocked ? 100 : prog ? Math.round((prog.current / prog.target) * 100) : 0}%`,
                    }}
                    transition={{ duration: 0.9, delay: 0.35 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <p className="ink-3 num mt-1.5 text-[11px] font-bold">
                  {isUnlocked ? "Unlocked" : prog ? `${prog.current} / ${prog.target}` : ""}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
