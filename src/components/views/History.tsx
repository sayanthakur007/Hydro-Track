"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Droplet, History as HistoryIcon, SearchX } from "lucide-react";
import { useSession } from "@/lib/store";
import {
  addDays,
  dayKey,
  entriesForDay,
  formatDateLabel,
  formatMl,
  startOfDay,
} from "@/lib/hydration";
import Timeline from "../Timeline";

type RangeKey = "today" | "yesterday" | "7d" | "30d" | "custom";

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "custom", label: "Custom" },
];

interface DayGroup {
  key: string;
  date: Date;
  total: number;
  goalMet: boolean;
}

export default function HistoryView() {
  const { entries, user, deleteEntry } = useSession();
  const [range, setRange] = useState<RangeKey>("7d");
  const [from, setFrom] = useState(() => dayKey(addDays(new Date(), -6)));
  const [to, setTo] = useState(() => dayKey(new Date()));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const goalMl = user?.dailyGoalMl ?? 3000;

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    let start: Date;
    let end: Date = today;
    if (range === "today") start = today;
    else if (range === "yesterday") {
      start = addDays(today, -1);
      end = start;
    } else if (range === "7d") start = addDays(today, -6);
    else if (range === "30d") start = addDays(today, -29);
    else {
      start = new Date(`${from}T00:00:00`);
      end = new Date(`${to}T00:00:00`);
      if (start > end) [start, end] = [end, start];
    }

    const groups: DayGroup[] = [];
    let cursor = startOfDay(end);
    while (cursor >= start && groups.length < 62) {
      const dayEntries = entriesForDay(entries, cursor);
      if (dayEntries.length > 0) {
        const total = dayEntries.reduce((s, e) => s + e.amountMl, 0);
        groups.push({ key: dayKey(cursor), date: new Date(cursor), total, goalMet: total >= goalMl });
      }
      cursor = addDays(cursor, -1);
    }
    return groups;
  }, [entries, range, from, to, goalMl]);

  const rangeTotal = days.reduce((s, d) => s + d.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-1.5 flex items-center gap-2">
          <HistoryIcon size={14} className="text-[var(--accent-1)]" />
          Your log
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Hydration history</h1>
        <p className="ink-2 mt-1.5">Every glass, day by day. Remove anything logged by mistake.</p>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {RANGES.map((r) => (
          <button key={r.id} className="chip" data-active={range === r.id} onClick={() => setRange(r.id)}>
            {r.label}
          </button>
        ))}
        <AnimatePresence>
          {range === "custom" ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <input type="date" className="input !w-auto !py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
              <span className="ink-3 text-sm">→</span>
              <input type="date" className="input !w-auto !py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {days.length > 0 ? (
        <div
          className="glass-sm flex items-center gap-3 px-5 py-3.5 text-sm font-semibold"
          style={{ color: "var(--ink-2)" }}
        >
          <CalendarDays size={16} className="text-[var(--accent-1)]" />
          <span>
            <strong className="num" style={{ color: "var(--ink)" }}>{formatMl(rangeTotal)}</strong> across{" "}
            <strong className="num" style={{ color: "var(--ink)" }}>{days.length}</strong>{" "}
            {days.length === 1 ? "day" : "days"} ·{" "}
            <strong className="num" style={{ color: "var(--success)" }}>{days.filter((d) => d.goalMet).length}</strong>{" "}
            goal {days.filter((d) => d.goalMet).length === 1 ? "day" : "days"}
          </span>
        </div>
      ) : null}

      {days.length === 0 ? (
        <div className="glass sheen flex flex-col items-center gap-4 p-12 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: "var(--card-strong)" }}
          >
            <SearchX size={26} className="ink-3" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">Nothing logged in this range</p>
            <p className="ink-2 mt-1 text-sm">Try a wider range, or add some water from the dashboard.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((d, di) => {
            const dayEntries = entriesForDay(entries, d.date);
            const isOpen = expanded[d.key] ?? di < 2;
            return (
              <motion.section
                key={d.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(di * 0.06, 0.5) }}
                className="glass sheen overflow-hidden"
              >
                <button
                  className="flex w-full items-center gap-4 p-5 text-left"
                  onClick={() => setExpanded((p) => ({ ...p, [d.key]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  <span
                    className="num flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                    style={{
                      background: d.goalMet
                        ? "linear-gradient(135deg,var(--accent-1),var(--accent-2))"
                        : "var(--card-strong)",
                      color: d.goalMet ? "#fff" : "var(--ink-2)",
                    }}
                  >
                    <Droplet size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold">{formatDateLabel(d.date)}</p>
                    <p className="ink-3 text-xs font-semibold">
                      {dayEntries.length} {dayEntries.length === 1 ? "drink" : "drinks"}
                      {d.goalMet ? " · goal reached" : ""}
                    </p>
                  </div>
                  <span className="num font-display text-lg font-bold" style={{ color: d.goalMet ? "var(--accent-1)" : "var(--ink)" }}>
                    {formatMl(d.total)}
                  </span>
                  {/* progress bar */}
                  <span className="hidden h-2 w-24 overflow-hidden rounded-full sm:block" style={{ background: "var(--track)" }}>
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ background: "linear-gradient(90deg,var(--accent-1),var(--accent-2))" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (d.total / goalMl) * 100)}%` }}
                      transition={{ duration: 0.9, delay: 0.2 + Math.min(di * 0.06, 0.5), ease: [0.22, 1, 0.36, 1] }}
                    />
                  </span>
                  <ChevronDown
                    size={17}
                    className="ink-3 shrink-0 transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(180deg)" : undefined }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--line)" }}>
                        <Timeline entries={dayEntries} onDelete={deleteEntry} compact />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}
