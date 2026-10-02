"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PublicUser, WaterEntry } from "./types";
import { computeNextReminder, firstName, timeOnDay, totalForDay } from "./hydration";
import { nextReminderMessage } from "./messages";
import { useToast } from "./store";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export interface ReminderState {
  permission: NotifPermission;
  supported: boolean;
  nextAt: Date | null;
  withinHours: boolean;
  requestPermission: () => Promise<NotifPermission>;
  fireTest: () => void;
}

function readLastNotified(userId: string): number {
  try {
    return Number(localStorage.getItem(`hydro-last-notify:${userId}`)) || 0;
  } catch {
    return 0;
  }
}

function writeLastNotified(userId: string, ts: number) {
  try {
    localStorage.setItem(`hydro-last-notify:${userId}`, String(ts));
  } catch {
    /* ignore */
  }
}

export function useReminders(user: PublicUser | null, entries: WaterEntry[]): ReminderState {
  const { push } = useToast();
  const [permission, setPermission] = useState<NotifPermission>("default");
  const [now, setNow] = useState(() => new Date());
  const lastNotifiedRef = useRef<number>(0);

  const supported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    if (!supported) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotifPermission);
  }, [supported]);

  useEffect(() => {
    if (user) lastNotifiedRef.current = readLastNotified(user.id);
  }, [user]);

  // 15-second heartbeat keeps "next reminder" accurate and fires when due.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  const lastDrinkAt = useMemo(() => {
    if (entries.length === 0) return null;
    return new Date(entries[entries.length - 1].createdAt);
  }, [entries]);

  const goalComplete = useMemo(() => {
    if (!user) return false;
    return totalForDay(entries, now) >= user.dailyGoalMl;
  }, [entries, now, user]);

  const withinHours = useMemo(() => {
    if (!user) return false;
    const start = timeOnDay(now, user.reminderStart);
    const end = timeOnDay(now, user.reminderEnd);
    return now >= start && now <= end;
  }, [now, user]);

  const nextAt = useMemo(() => {
    if (!user || !user.notificationsEnabled || permission !== "granted") return null;
    return computeNextReminder({
      now,
      intervalMins: user.reminderIntervalMins,
      activeStart: user.reminderStart,
      activeEnd: user.reminderEnd,
      lastDrinkAt,
      lastNotifiedAt: lastNotifiedRef.current ? new Date(lastNotifiedRef.current) : null,
      goalComplete,
    });
  }, [user, permission, now, lastDrinkAt, goalComplete]);

  const fireReminder = useCallback(
    (body: string) => {
      if (!user) return;
      lastNotifiedRef.current = Date.now();
      writeLastNotified(user.id, lastNotifiedRef.current);

      if (supported && Notification.permission === "granted") {
        try {
          const n = new Notification("HydroTrack · Time to hydrate", {
            body,
            icon: "/icon.svg",
            tag: "hydro-reminder",
            badge: "/icon.svg",
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {
          /* fall back to in-app toast only */
        }
      }
      push({ title: "Time to hydrate", body, icon: "bell", variant: "water" });
      setNow(new Date());
    },
    [user, supported, push],
  );

  // Fire when due.
  useEffect(() => {
    if (!user || !nextAt || !withinHours || permission !== "granted") return;
    if (now.getTime() < nextAt.getTime() - 1000) return;

    const name = firstName(user.name);
    const todayTotal = totalForDay(entries, now);
    const remaining = Math.max(0, user.dailyGoalMl - todayTotal);
    const idleThreshold = user.reminderIntervalMins * 1.5 * 60_000;
    const idleLong = !lastDrinkAt || now.getTime() - lastDrinkAt.getTime() > idleThreshold;

    fireReminder(nextReminderMessage(name, { idleLong, remainingMl: remaining }));
  }, [now, nextAt, withinHours, permission, user, entries, lastDrinkAt, fireReminder]);

  const requestPermission = useCallback(async (): Promise<NotifPermission> => {
    if (!supported) return "unsupported";
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotifPermission);
      return result as NotifPermission;
    } catch {
      return "unsupported";
    }
  }, [supported]);

  const fireTest = useCallback(() => {
    if (!user) return;
    const name = firstName(user.name);
    const remaining = Math.max(0, user.dailyGoalMl - totalForDay(entries, new Date()));
    fireReminder(nextReminderMessage(name, { idleLong: false, remainingMl: remaining }));
  }, [user, entries, fireReminder]);

  return { permission, supported, nextAt, withinHours, requestPermission, fireTest };
}

/* ------------------------------------------------------------------ */
/*  Shared reminder context                                            */
/* ------------------------------------------------------------------ */

const ReminderCtx = createContext<ReminderState | null>(null);

export function ReminderProvider({
  user,
  entries,
  children,
}: {
  user: PublicUser | null;
  entries: WaterEntry[];
  children: ReactNode;
}) {
  const state = useReminders(user, entries);
  return <ReminderCtx.Provider value={state}>{children}</ReminderCtx.Provider>;
}

export function useReminderState(): ReminderState {
  const ctx = useContext(ReminderCtx);
  if (!ctx) throw new Error("useReminderState must be used inside ReminderProvider");
  return ctx;
}
