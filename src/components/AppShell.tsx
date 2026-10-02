"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Droplets,
  History,
  LayoutDashboard,
  LogOut,
  Trophy,
  UserRound,
  Flame,
} from "lucide-react";
import type { ViewId } from "@/lib/types";
import { useSession } from "@/lib/store";
import { computeStreaks } from "@/lib/hydration";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";

interface Props {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  theme: string;
  onToggleTheme: () => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "history", label: "History", icon: History },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "profile", label: "Profile", icon: UserRound },
];

const MOBILE_ITEMS = NAV_ITEMS.filter((i) => i.id !== "achievements");

export default function AppShell({ view, onNavigate, theme, onToggleTheme, children }: Props) {
  const { user, entries, logout } = useSession();
  const streak = computeStreaks(entries, user?.dailyGoalMl ?? 3000);

  return (
    <div className="min-h-dvh">
      {/* ================= Desktop sidebar ================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col p-5 lg:flex">
        <div className="glass sheen flex h-full flex-col p-5">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-3 rounded-2xl px-2 py-1 text-left transition-transform hover:scale-[1.02]"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{
                background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))",
                boxShadow: "0 10px 24px -8px rgba(37,140,248,0.8)",
              }}
            >
              <Droplets size={22} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              Hydro<span className="text-gradient">Track</span>
            </span>
          </button>

          <nav className="mt-8 flex flex-1 flex-col gap-1.5" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-all"
                  style={{ color: active ? "var(--ink)" : "var(--ink-2)" }}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: "var(--card-strong)",
                        border: "1px solid var(--line-strong)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 24px -12px rgba(37,140,248,0.6)",
                      }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  {active ? (
                    <motion.span
                      layoutId="nav-bar"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full"
                      style={{ background: "linear-gradient(180deg,var(--accent-1),var(--accent-2))" }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <item.icon
                    size={19}
                    className="relative z-10 transition-transform group-hover:scale-110"
                    style={{ color: active ? "var(--accent-1)" : undefined }}
                  />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* streak chip */}
          {streak.current > 0 ? (
            <div
              className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: "color-mix(in srgb, var(--warning) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
              }}
            >
              <Flame size={20} className="text-[var(--warning)]" />
              <div>
                <p className="num text-sm font-bold">{streak.current} day streak</p>
                <p className="ink-3 text-xs">Keep the flame alive</p>
              </div>
            </div>
          ) : null}

          <div className="mb-3 flex items-center justify-between px-1">
            <span className="label">Theme</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>

          {/* user card */}
          <div
            className="flex items-center gap-3 rounded-2xl p-3"
            style={{ background: "var(--card-flat)", border: "1px solid var(--line)" }}
          >
            <Avatar name={user?.name ?? "?"} theme={user?.avatarTheme} size={42} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user?.name}</p>
              <p className="ink-3 truncate text-xs">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="ink-3 rounded-xl p-2 transition-colors hover:text-[var(--danger)]"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= Mobile top bar ================= */}
      <header className="sticky top-0 z-40 px-4 pt-4 lg:hidden">
        <div className="glass-sm sheen flex items-center justify-between px-4 py-3">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2.5"
            aria-label="Go to dashboard"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))" }}
            >
              <Droplets size={18} />
            </span>
            <span className="font-display text-lg font-bold">
              Hydro<span className="text-gradient">Track</span>
            </span>
          </button>
          <div className="flex items-center gap-2.5">
            {streak.current > 0 ? (
              <span
                className="num flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{
                  background: "color-mix(in srgb, var(--warning) 14%, transparent)",
                  color: "var(--warning)",
                }}
              >
                <Flame size={13} />
                {streak.current}
              </span>
            ) : null}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>

      {/* ================= Content ================= */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:pb-14 lg:pl-[21rem] lg:pr-8 lg:pt-8 lg:max-w-none xl:max-w-[88rem]">
        {children}
      </main>

      {/* ================= Mobile bottom nav ================= */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden" aria-label="Primary mobile">
        <div className="glass mx-auto flex max-w-md items-center justify-between px-2 py-2" style={{ borderRadius: 22 }}>
          {MOBILE_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-colors"
                style={{ color: active ? "var(--ink)" : "var(--ink-3)" }}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-pill"
                    className="absolute inset-x-1 inset-y-0 rounded-2xl"
                    style={{
                      background: "var(--card-strong)",
                      border: "1px solid var(--line-strong)",
                    }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <item.icon
                  size={20}
                  className="relative z-10"
                  style={active ? { color: "var(--accent-1)" } : undefined}
                />
                <span className="relative z-10 text-[10px] font-bold tracking-wide">
                  {item.id === "dashboard" ? "Home" : item.id === "stats" ? "Stats" : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
