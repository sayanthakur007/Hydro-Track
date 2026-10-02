"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  CalendarDays,
  Check,
  Droplet,
  GlassWater,
  LogOut,
  Moon,
  Save,
  Settings2,
  Sigma,
  Target,
  UserRound,
} from "lucide-react";
import { useSession, useToast } from "@/lib/store";
import { firstName, formatMl, totalsByDay } from "@/lib/hydration";
import type { ViewId } from "@/lib/types";
import Avatar, { AVATAR_THEMES } from "../Avatar";
import ThemeToggle from "../ThemeToggle";

const GLASS_SIZES = [150, 200, 250, 300, 350, 500];

export default function ProfileView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { user, entries, updateProfile, logout } = useSession();
  const { push } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [goal, setGoal] = useState(user?.dailyGoalMl ?? 3000);
  const [editingName, setEditingName] = useState(false);

  if (!user) return null;

  const lifetimeMl = (() => {
    let t = 0;
    totalsByDay(entries).forEach((v) => (t += v));
    return t;
  })();

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const patch = async (p: Record<string, unknown>, okMsg = "Saved") => {
    const res = await updateProfile(p);
    if (res.ok) push({ title: okMsg, icon: "check", variant: "success" });
    else push({ title: "Couldn't save", body: res.error, icon: "info", variant: "error" });
  };

  const saveName = async () => {
    if (name.trim().length < 2) {
      push({ title: "Name is too short", icon: "info", variant: "error" });
      setName(user.name);
      setEditingName(false);
      return;
    }
    if (name.trim() !== user.name) await patch({ name: name.trim() }, `We'll call you ${firstName(name.trim())}`);
    setEditingName(false);
  };

  const goalDirty = goal !== user.dailyGoalMl;

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-1.5 flex items-center gap-2">
          <UserRound size={14} className="text-[var(--accent-1)]" />
          Your account
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Profile & settings</h1>
      </div>

      {/* ---------- identity card ---------- */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass sheen p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative self-start">
            <Avatar name={user.name} theme={user.avatarTheme} size={92} />
            <span
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "var(--success)", border: "3px solid var(--bg-0)" }}
            >
              <Check size={13} className="text-white" strokeWidth={3} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="input !w-auto flex-1 min-w-[180px]"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  aria-label="Full name"
                />
                <button className="btn-primary !px-4 !py-2.5 text-sm" onClick={saveName}>
                  <Save size={14} />
                  Save
                </button>
                <button className="btn-ghost !px-4 !py-2.5 text-sm" onClick={() => { setName(user.name); setEditingName(false); }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="group rounded-xl px-1 text-left"
                onClick={() => setEditingName(true)}
                title="Click to edit name"
              >
                <h2 className="font-display text-2xl font-bold tracking-tight group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-8">
                  {user.name}
                </h2>
                <p className="ink-3 mt-0.5 text-xs font-semibold">click name to edit</p>
              </button>
            )}
            <p className="ink-2 mt-1.5 text-sm font-medium">{user.email}</p>
            <div className="ink-3 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} /> member since {memberSince}
              </span>
              <span className="flex items-center gap-1.5 num">
                <Sigma size={13} /> {(lifetimeMl / 1000).toFixed(1)} L logged
              </span>
              <span className="flex items-center gap-1.5 num">
                <Droplet size={13} /> {entries.length} glasses total
              </span>
            </div>
          </div>
        </div>

        {/* avatar theme picker */}
        <div className="mt-7 pt-6" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="label mb-3">Avatar color</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(AVATAR_THEMES).map(([id, gradient]) => (
              <button
                key={id}
                onClick={() => patch({ avatarTheme: id }, "Avatar updated")}
                className="relative h-10 w-10 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{ background: gradient }}
                aria-label={`Set avatar color ${id}`}
              >
                {user.avatarTheme === id ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full text-white"
                    style={{ boxShadow: "0 0 0 3px var(--bg-0), 0 0 0 5px var(--accent-1)" }}>
                    <Check size={16} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- hydration preferences ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass sheen space-y-7 p-6 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}>
              <Settings2 size={18} />
            </span>
            <h2 className="font-display text-lg font-bold">Hydration preferences</h2>
          </div>

          {/* daily goal */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label flex items-center gap-2">
                <Target size={13} className="text-[var(--accent-1)]" />
                Daily water goal
              </p>
              <span className="num font-display text-lg font-bold text-gradient">{formatMl(goal)}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={6000}
              step={100}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="range"
              aria-label="Daily water goal"
            />
            <div className="ink-3 mt-1.5 flex justify-between text-xs font-semibold">
              <span>1.0 L</span>
              <span>6.0 L</span>
            </div>
            {goalDirty ? (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="btn-primary mt-4 w-full !py-2.5 text-sm"
                onClick={() => patch({ dailyGoalMl: goal }, "Daily goal updated")}
              >
                <Save size={15} />
                Save new goal
              </motion.button>
            ) : null}
          </div>

          {/* glass size */}
          <div>
            <p className="label mb-3 flex items-center gap-2">
              <GlassWater size={13} className="text-[var(--accent-1)]" />
              Preferred glass size
            </p>
            <div className="flex flex-wrap gap-2">
              {GLASS_SIZES.map((s) => (
                <button
                  key={s}
                  className="chip num"
                  data-active={user.glassSizeMl === s}
                  onClick={() => patch({ glassSizeMl: s }, "Glass size updated")}
                >
                  {s} ml
                </button>
              ))}
            </div>
            <p className="ink-3 mt-2.5 text-xs font-medium">
              Your quick-add &ldquo;Your glass&rdquo; button uses this size.
            </p>
          </div>
        </motion.section>

        {/* ---------- app settings ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="flex flex-col gap-6"
        >
          <div className="glass sheen divide-y divide-[var(--line)] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--card-strong)", color: "var(--accent-3)" }}>
                  <Moon size={18} />
                </span>
                <div>
                  <p className="font-bold">Appearance</p>
                  <p className="ink-3 text-xs font-semibold">synced to your account</p>
                </div>
              </div>
              <ThemeToggle
                theme={user.theme}
                onToggle={() => document.querySelector<HTMLButtonElement>("[data-app-theme-toggle]")?.click()}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}>
                  <BellRing size={18} />
                </span>
                <div>
                  <p className="font-bold">Reminder schedule</p>
                  <p className="ink-3 num text-xs font-semibold">
                    every {user.reminderIntervalMins} min · {user.reminderStart}–{user.reminderEnd}
                  </p>
                </div>
              </div>
              <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => onNavigate("reminders")}>
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--card-strong)", color: "var(--danger)" }}>
                  <LogOut size={18} />
                </span>
                <div>
                  <p className="font-bold">Sign out</p>
                  <p className="ink-3 text-xs font-semibold">your data stays safely stored</p>
                </div>
              </div>
              <button
                className="btn-ghost !px-4 !py-2 text-sm"
                style={{ color: "var(--danger)" }}
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
