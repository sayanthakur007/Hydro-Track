"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets } from "lucide-react";
import { SessionProvider, ToastProvider, useSession } from "@/lib/store";
import { ReminderProvider } from "@/lib/useReminders";
import type { ViewId } from "@/lib/types";
import Background from "./Background";
import AuthScreen from "./AuthScreen";
import AppShell from "./AppShell";
import Dashboard from "./views/Dashboard";
import HistoryView from "./views/History";
import StatsView from "./views/Stats";
import RemindersView from "./views/Reminders";
import AchievementsView from "./views/Achievements";
import ProfileView from "./views/Profile";

const VALID_VIEWS: ViewId[] = ["dashboard", "history", "stats", "reminders", "achievements", "profile"];

function readTheme(): string {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export default function App() {
  return (
    <ToastProvider>
      <SessionProvider>
        <ThemedRoot />
      </SessionProvider>
    </ToastProvider>
  );
}

function ThemedRoot() {
  const { status, user, updateProfile } = useSession();
  const [theme, setTheme] = useState<string>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  // Server preference wins once we know who is signed in.
  useEffect(() => {
    if (!user) return;
    const pref = user.theme === "light" ? "light" : "dark";
    setTheme(pref);
    document.documentElement.dataset.theme = pref;
    try {
      localStorage.setItem("hydro-theme", pref);
    } catch {
      /* ignore */
    }
  }, [user]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("hydro-theme", next);
      } catch {
        /* ignore */
      }
      if (user) updateProfile({ theme: next });
      return next;
    });
  }, [user, updateProfile]);

  return (
    <>
      <Background />
      <AnimatePresence mode="wait">
        {status === "loading" ? (
          <Splash key="splash" />
        ) : status === "guest" || !user ? (
          <AuthScreen key="auth" />
        ) : (
          <AuthedApp key="app" theme={theme} onToggleTheme={toggleTheme} />
        )}
      </AnimatePresence>
    </>
  );
}

function Splash() {
  return (
    <motion.div
      className="flex min-h-dvh flex-col items-center justify-center gap-6"
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="pulse-glow flex h-20 w-20 items-center justify-center rounded-[26px] text-white"
        style={{ background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))" }}
      >
        <Droplets size={38} />
      </motion.div>
      <div>
        <p className="font-display text-center text-2xl font-bold tracking-tight">
          Hydro<span className="text-gradient">Track</span>
        </p>
        <div className="mx-auto mt-4 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--accent-1)" }}
              animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AuthedApp({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  const { user, entries } = useSession();
  const [view, setView] = useState<ViewId>(() => {
    if (typeof window === "undefined") return "dashboard";
    const hash = window.location.hash.replace("#", "") as ViewId;
    return VALID_VIEWS.includes(hash) ? hash : "dashboard";
  });

  const go = useCallback((v: ViewId) => {
    setView(v);
    try {
      history.replaceState(null, "", `#${v}`);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <ReminderProvider user={user} entries={entries}>
        <AppShell view={view} onNavigate={go} theme={theme} onToggleTheme={onToggleTheme}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "dashboard" && <Dashboard onNavigate={go} />}
              {view === "history" && <HistoryView />}
              {view === "stats" && <StatsView />}
              {view === "reminders" && <RemindersView />}
              {view === "achievements" && <AchievementsView />}
              {view === "profile" && <ProfileView onNavigate={go} />}
            </motion.div>
          </AnimatePresence>
        </AppShell>
      </ReminderProvider>
    </motion.div>
  );
}
