"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  BarChart3,
  CalendarCheck2,
  Crown,
  Droplet,
  Flame,
  GlassWater,
  Sigma,
  Target,
} from "lucide-react";
import { useSession } from "@/lib/store";
import { computeStreaks, entriesForDay, formatMl, lastNDays, totalForDay } from "@/lib/hydration";

const WeeklyBarChart = dynamic(() => import("../Charts").then((m) => m.WeeklyBarChart), {
  ssr: false,
  loading: () => <div className="skeleton h-[280px]" />,
});
const MonthlyAreaChart = dynamic(() => import("../Charts").then((m) => m.MonthlyAreaChart), {
  ssr: false,
  loading: () => <div className="skeleton h-[260px]" />,
});

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "var(--accent-1)",
  delay = 0,
}: {
  icon: typeof Droplet;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-sm glass-hover p-4 sm:p-5"
    >
      <span
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}
      >
        <Icon size={18} />
      </span>
      <p className="num font-display text-xl font-bold sm:text-2xl">{value}</p>
      <p className="ink-3 mt-0.5 text-xs font-semibold">
        {label}
        {sub ? ` · ${sub}` : ""}
      </p>
    </motion.div>
  );
}

export default function StatsView() {
  const { entries, user } = useSession();
  const goalMl = user?.dailyGoalMl ?? 3000;
  const glassMl = user?.glassSizeMl ?? 250;

  const today = new Date();
  const todayTotal = totalForDay(entries, today);
  const todayEntries = entriesForDay(entries, today);
  const todayPct = goalMl ? Math.round((todayTotal / goalMl) * 100) : 0;
  const avgDrink = todayEntries.length ? Math.round(todayTotal / todayEntries.length) : 0;

  const week = useMemo(() => lastNDays(entries, 7, goalMl), [entries, goalMl]);
  const month = useMemo(() => lastNDays(entries, 30, goalMl), [entries, goalMl]);
  const streak = useMemo(() => computeStreaks(entries, goalMl), [entries, goalMl]);

  const weekTotal = week.reduce((s, d) => s + d.totalMl, 0);
  const weekAvg = Math.round(weekTotal / 7);
  const weekMet = week.filter((d) => d.goalMet).length;
  const best = week.reduce((a, d) => (d.totalMl > a.totalMl ? d : a), week[0]);
  const completion = Math.round((weekMet / 7) * 100);

  const monthTotal = month.reduce((s, d) => s + d.totalMl, 0);
  const monthAvg = Math.round(monthTotal / 30);
  const monthMet = month.filter((d) => d.goalMet).length;

  const weeklyChart = week.map((d) => ({
    label: d.label,
    dateLabel: d.key,
    liters: Math.round(d.totalMl / 100) / 10,
    goalLiters: goalMl / 1000,
    goalMet: d.goalMet,
  }));

  const monthlyChart = month.map((d) => ({
    label: d.date.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    liters: Math.round(d.totalMl / 100) / 10,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-1.5 flex items-center gap-2">
          <BarChart3 size={14} className="text-[var(--accent-1)]" />
          Insights
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Statistics</h1>
        <p className="ink-2 mt-1.5">Your hydration patterns at a glance — today, this week, this month.</p>
      </div>

      {/* ---------------- today ---------------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatTile icon={Droplet} label="Drank today" value={formatMl(todayTotal)} delay={0} />
        <StatTile icon={Target} label="Daily goal" value={formatMl(goalMl)} delay={0.05} />
        <StatTile
          icon={Activity}
          label="Complete"
          value={`${todayPct}%`}
          tone={todayPct >= 100 ? "var(--success)" : "var(--accent-1)"}
          delay={0.1}
        />
        <StatTile icon={GlassWater} label="Glasses" value={String(todayEntries.length)} sub={`~${glassMl} ml each`} delay={0.15} />
        <StatTile icon={Sigma} label="Avg serving" value={avgDrink ? formatMl(avgDrink) : "—"} delay={0.2} />
      </div>

      {/* ---------------- weekly ---------------- */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass sheen p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">This week</h2>
            <span className="chip pointer-events-none num !cursor-default">
              avg {formatMl(weekAvg)} / day
            </span>
          </div>
          <WeeklyBarChart data={weeklyChart} />
          <div className="ink-3 mt-3 flex items-center justify-end gap-2 text-xs font-semibold">
            <span className="inline-block h-0 w-6 border-t-2 border-dashed" style={{ borderColor: "var(--accent-1)", opacity: 0.7 }} />
            daily goal {formatMl(goalMl)}
          </div>
        </motion.section>

        <div className="flex flex-col gap-4">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass sheen relative overflow-hidden p-6"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
              style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--warning) 26%, transparent), transparent 70%)" }}
            />
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 12px 28px -8px rgba(239,104,20,0.7)" }}
              >
                <Flame size={26} />
              </span>
              <div>
                <p className="num font-display text-3xl font-bold leading-none">
                  {streak.current} <span className="text-gradient text-lg">day streak</span>
                </p>
                <p className="ink-3 mt-1.5 text-xs font-semibold">
                  longest {streak.longest} days · {streak.completedDays} goal days total
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-1.5">
              {week.map((d) => (
                <div key={d.key} className="flex-1">
                  <motion.div
                    initial={{ scaleY: 0.3, opacity: 0.4 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="h-2.5 rounded-full"
                    style={{ background: d.goalMet ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "var(--track)" }}
                    title={`${d.label}: ${formatMl(d.totalMl)}`}
                  />
                </div>
              ))}
            </div>
            <p className="ink-3 mt-2 text-[11px] font-semibold">last 7 days</p>
          </motion.section>

          <div className="grid grid-cols-2 gap-4">
            <StatTile icon={Crown} label="Best day" value={best ? formatMl(best.totalMl) : "—"} sub={best?.label} tone="var(--warning)" delay={0.25} />
            <StatTile icon={CalendarCheck2} label="Goal rate" value={`${completion}%`} sub={`${weekMet}/7 days`} tone="var(--success)" delay={0.3} />
          </div>
        </div>
      </div>

      {/* ---------------- monthly ---------------- */}
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass sheen p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Last 30 days</h2>
          <span className="chip pointer-events-none num !cursor-default">{formatMl(monthTotal)} total</span>
        </div>
        <MonthlyAreaChart data={monthlyChart} />
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile icon={Sigma} label="Total consumed" value={formatMl(monthTotal)} delay={0.3} />
          <StatTile icon={Activity} label="Daily average" value={formatMl(monthAvg)} delay={0.35} />
          <StatTile icon={CalendarCheck2} label="Goal days" value={`${monthMet}`} sub="of 30" tone="var(--success)" delay={0.4} />
          <StatTile icon={Award} label="Longest streak" value={`${streak.longest} days`} tone="var(--warning)" delay={0.45} />
        </div>
      </motion.section>
    </div>
  );
}
