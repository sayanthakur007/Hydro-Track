"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClockCheck,
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Send,
  ShieldAlert,
  Sparkles,
  Timer,
} from "lucide-react";
import { useSession, useToast } from "@/lib/store";
import { useReminderState } from "@/lib/useReminders";
import { firstName } from "@/lib/hydration";
import { sampleReminderMessages } from "@/lib/messages";

const INTERVAL_OPTIONS = [30, 60, 90, 120, 180];

export default function RemindersView() {
  const { user, updateProfile } = useSession();
  const reminders = useReminderState();
  const { push } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [customInterval, setCustomInterval] = useState(user?.reminderIntervalMins ?? 60);

  if (!user) return null;
  const name = firstName(user.name);
  const isCustomInterval = !INTERVAL_OPTIONS.includes(user.reminderIntervalMins);

  const patch = async (p: Record<string, unknown>, okMsg?: string) => {
    const res = await updateProfile(p);
    if (!res.ok) push({ title: "Couldn't save", body: res.error, icon: "info", variant: "error" });
    else if (okMsg) push({ title: okMsg, icon: "check", variant: "success" });
  };

  const allowNotifications = async () => {
    const result = await reminders.requestPermission();
    if (result === "granted") {
      if (!user.notificationsEnabled) await patch({ notificationsEnabled: true });
      push({
        title: "You're all set!",
        body: `We'll remind ${name} to drink water throughout the day.`,
        icon: "bell",
        variant: "success",
      });
      setTimeout(() => reminders.fireTest(), 1200);
    } else if (result === "denied") {
      push({
        title: "Notifications blocked",
        body: "You can enable them anytime from your browser's site settings.",
        icon: "info",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-1.5 flex items-center gap-2">
          <BellRing size={14} className="text-[var(--accent-1)]" />
          Stay on track
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Hydration reminders</h1>
        <p className="ink-2 mt-1.5">
          Gentle, personalized nudges for {name} — only inside your active hours, and never right after you&apos;ve
          just had a drink.
        </p>
      </div>

      {/* ---------- permission card ---------- */}
      <AnimatePresence initial={false}>
        {reminders.permission === "default" && !dismissed ? (
          <motion.section
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, height: 0, marginBottom: -24, overflow: "hidden" }}
            className="glass sheen relative overflow-hidden p-6 sm:p-8"
          >
            <div
              className="pointer-events-none absolute -left-12 -top-12 h-52 w-52 rounded-full"
              style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent-1) 22%, transparent), transparent 70%)" }}
            />
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <motion.span
                animate={{ rotate: [0, -12, 12, -6, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4 }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-white"
                style={{
                  background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))",
                  boxShadow: "0 16px 36px -10px rgba(37,140,248,0.8)",
                }}
              >
                <Bell size={30} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-bold">Stay hydrated, {name}</h2>
                <p className="ink-2 mt-1.5 text-sm leading-relaxed">
                  Allow notifications so we can remind you to drink water throughout the day — addressed to you by
                  name, timed to your schedule.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="btn-primary" onClick={allowNotifications}>
                    <Bell size={16} />
                    Allow notifications
                  </button>
                  <button className="btn-ghost" onClick={() => setDismissed(true)}>
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {reminders.permission === "denied" ? (
        <div
          className="glass-sm flex items-start gap-3 p-5 text-sm font-medium"
          style={{ borderColor: "color-mix(in srgb, var(--warning) 35%, transparent)" }}
        >
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <p className="ink-2 leading-relaxed">
            Browser notifications are currently blocked for this site. To receive reminders, enable them in your
            browser&apos;s site settings, then come back — in-app reminders will keep showing either way.
          </p>
        </div>
      ) : null}

      {reminders.permission === "unsupported" ? (
        <div className="glass-sm flex items-start gap-3 p-5 text-sm font-medium" style={{ borderColor: "color-mix(in srgb, var(--warning) 35%, transparent)" }}>
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <p className="ink-2 leading-relaxed">
            This browser doesn&apos;t support system notifications — no worries, you&apos;ll still get gentle
            in-app reminders while HydroTrack is open.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* ---------- schedule settings ---------- */}
        <section className="glass sheen space-y-7 p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
              >
                {user.notificationsEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
              </span>
              <div>
                <p className="font-bold">Reminders {user.notificationsEnabled ? "enabled" : "paused"}</p>
                <p className="ink-3 text-xs font-semibold">master switch for hydration nudges</p>
              </div>
            </div>
            <button
              className="switch"
              data-on={user.notificationsEnabled}
              role="switch"
              aria-checked={user.notificationsEnabled}
              aria-label="Toggle reminders"
              onClick={async () => {
                const next = !user.notificationsEnabled;
                if (next && reminders.permission === "default") {
                  await allowNotifications();
                  return;
                }
                patch({ notificationsEnabled: next });
              }}
            />
          </div>

          {/* interval */}
          <div>
            <p className="label mb-3 flex items-center gap-2">
              <Timer size={13} className="text-[var(--accent-1)]" />
              Remind every
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERVAL_OPTIONS.map((m) => (
                <button
                  key={m}
                  className="chip"
                  data-active={user.reminderIntervalMins === m}
                  onClick={() => {
                    setCustomInterval(m);
                    patch({ reminderIntervalMins: m });
                  }}
                >
                  {m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} ${m === 60 ? "hour" : "hours"}` : `${Math.floor(m / 60)}.5 hours`}
                </button>
              ))}
              <button
                className="chip"
                data-active={isCustomInterval}
                onClick={() => patch({ reminderIntervalMins: customInterval })}
              >
                Custom
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isCustomInterval ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min={10}
                      max={480}
                      className="input num !w-32"
                      value={customInterval}
                      onChange={(e) => setCustomInterval(Number(e.target.value))}
                      aria-label="Custom interval in minutes"
                    />
                    <span className="ink-2 text-sm font-semibold">minutes</span>
                    <button
                      className="btn-ghost !py-2 text-sm"
                      onClick={() => {
                        const v = Math.max(10, Math.min(480, Math.round(customInterval || 60)));
                        setCustomInterval(v);
                        patch({ reminderIntervalMins: v }, "Interval updated");
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* active hours */}
          <div>
            <p className="label mb-3 flex items-center gap-2">
              <Clock3 size={13} className="text-[var(--accent-1)]" />
              Active hours
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="ink-3 mb-1 block text-xs font-semibold">Start</span>
                <input
                  type="time"
                  className="input num !w-auto"
                  value={user.reminderStart}
                  onChange={(e) => e.target.value && patch({ reminderStart: e.target.value })}
                  aria-label="Reminder start time"
                />
              </div>
              <span className="ink-3 mt-5">→</span>
              <div>
                <span className="ink-3 mb-1 block text-xs font-semibold">End</span>
                <input
                  type="time"
                  className="input num !w-auto"
                  value={user.reminderEnd}
                  onChange={(e) => e.target.value && patch({ reminderEnd: e.target.value })}
                  aria-label="Reminder end time"
                />
              </div>
              <p className="ink-3 mt-5 text-xs font-medium leading-snug">
                No reminders
                <br />
                outside this window
              </p>
            </div>
          </div>
        </section>

        {/* ---------- status + preview ---------- */}
        <div className="flex flex-col gap-6">
          <section className="glass sheen p-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
              >
                <AlarmClockCheck size={18} />
              </span>
              <h2 className="font-display text-lg font-bold">Next reminder</h2>
            </div>
            <div className="mt-5">
              {reminders.nextAt && user.notificationsEnabled ? (
                <>
                  <p className="num font-display text-4xl font-bold tracking-tight" style={{ color: "var(--accent-1)" }}>
                    {reminders.nextAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="ink-2 mt-2 text-sm leading-relaxed">
                    {reminders.nextAt.toDateString() !== new Date().toDateString() ? "Tomorrow. " : ""}
                    Smart-paused for ~45 min after each drink, and stopped once your goal is complete.
                  </p>
                </>
              ) : (
                <p className="ink-2 text-sm leading-relaxed">
                  {user.notificationsEnabled
                    ? reminders.permission === "granted"
                      ? "No reminder scheduled — you may have completed today's goal. Cheers!"
                      : "Allow browser notifications above to schedule reminders."
                    : "Reminders are paused. Flip the switch to resume."}
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button className="btn-ghost !py-2.5 text-sm" onClick={() => reminders.fireTest()}>
                <Send size={14} className="text-[var(--accent-1)]" />
                Send test reminder
              </button>
              {reminders.permission === "granted" ? (
                <span className="chip pointer-events-none !cursor-default" style={{ color: "var(--success)" }}>
                  <CheckCircle2 size={14} />
                  notifications on
                </span>
              ) : null}
            </div>
          </section>

          <section className="glass sheen p-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
              >
                <MessageSquareText size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">Made for {name}</h2>
                <p className="ink-3 text-xs font-semibold">rotating message styles you'll receive</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {sampleReminderMessages(name).map((m, i) => (
                <motion.div
                  key={m}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="glass-inset flex items-start gap-3 px-4 py-3 text-sm font-medium leading-snug"
                  style={{ color: "var(--ink-2)" }}
                >
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--accent-1)]" />
                  {m}
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
