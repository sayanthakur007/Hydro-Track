"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PublicUser, ToastItem, WaterEntry } from "./types";

export interface AuthPayload {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  dailyGoalMl?: number;
}

interface SessionCtxValue {
  status: "loading" | "authed" | "guest";
  user: PublicUser | null;
  entries: WaterEntry[];
  lastAddedAt: number;
  busy: boolean;
  authenticate: (
    mode: "login" | "register" | "demo",
    payload?: AuthPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  addWater: (amountMl: number) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
  updateProfile: (patch: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const SessionCtx = createContext<SessionCtxValue | null>(null);

export function useSession(): SessionCtxValue {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionCtxValue["status"]>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const lastFetchRef = useRef(0);

  const bootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) {
        setStatus("guest");
        setUser(null);
        setEntries([]);
        return;
      }
      if (!res.ok) throw new Error("bootstrap failed");
      const data = (await res.json()) as { user: PublicUser; entries: WaterEntry[] };
      setUser(data.user);
      setEntries(data.entries);
      setStatus("authed");
      lastFetchRef.current = Date.now();
    } catch {
      // Network trouble — keep whatever we had, but stop blocking the UI.
      setStatus((s) => (s === "loading" ? "guest" : s));
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Refetch when tab becomes visible again and data is stale.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetchRef.current > 60_000) {
        bootstrap();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [bootstrap]);

  // Daily reset: refresh at the next local midnight.
  useEffect(() => {
    if (status !== "authed") return;
    const next = new Date();
    next.setHours(24, 0, 5, 0);
    const t = setTimeout(() => bootstrap(), next.getTime() - Date.now());
    return () => clearTimeout(t);
  }, [status, bootstrap, lastAddedAt]);

  const authenticate = useCallback(
    async (mode: "login" | "register" | "demo", payload?: AuthPayload) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/auth/${mode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload ? JSON.stringify(payload) : undefined,
        });
        if (!res.ok) {
          return { ok: false, error: await readError(res, "Something went wrong. Please try again.") };
        }
        await bootstrap();
        return { ok: true };
      } catch {
        return { ok: false, error: "Network hiccup — please check your connection and retry." };
      } finally {
        setBusy(false);
      }
    },
    [bootstrap],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setEntries([]);
      setStatus("guest");
    }
  }, []);

  const addWater = useCallback(async (amountMl: number) => {
    const temp: WaterEntry = {
      id: `tmp-${Date.now()}`,
      amountMl,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, temp]);
    setLastAddedAt(Date.now());
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't add water right now."));
      const data = (await res.json()) as { entry: WaterEntry };
      setEntries((prev) => prev.map((e) => (e.id === temp.id ? data.entry : e)));
      return true;
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== temp.id));
      return false;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    let removed: WaterEntry | undefined;
    setEntries((prev) => {
      removed = prev.find((e) => e.id === id);
      return prev.filter((e) => e.id !== id);
    });
    if (id.startsWith("tmp-")) return;
    try {
      const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      if (removed) {
        const back = removed;
        setEntries((prev) => [...prev, back].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)));
      }
    }
  }, []);

  const updateProfile = useCallback(async (patch: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return { ok: false, error: await readError(res, "Couldn't save your settings.") };
      const data = (await res.json()) as { user: PublicUser };
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network hiccup — changes weren't saved." };
    }
  }, []);

  const value = useMemo<SessionCtxValue>(
    () => ({
      status,
      user,
      entries,
      lastAddedAt,
      busy,
      authenticate,
      logout,
      addWater,
      deleteEntry,
      updateProfile,
      refresh: bootstrap,
    }),
    [status, user, entries, lastAddedAt, busy, authenticate, logout, addWater, deleteEntry, updateProfile, bootstrap],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Toasts                                                             */
/* ------------------------------------------------------------------ */

interface ToastCtxValue {
  push: (t: Omit<ToastItem, "id">) => void;
}

const ToastCtx = createContext<ToastCtxValue | null>(null);

export function useToast(): ToastCtxValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, Droplet, Flame, Info, Sparkles, X } from "lucide-react";

const TOAST_ICONS = {
  droplet: Droplet,
  check: CheckCircle2,
  bell: Bell,
  flame: Flame,
  sparkles: Sparkles,
  info: Info,
} as const;

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[(t.icon as keyof typeof TOAST_ICONS) ?? "droplet"] ?? Droplet;
          const accent =
            t.variant === "error"
              ? "var(--danger)"
              : t.variant === "success"
                ? "var(--success)"
                : "var(--accent-1)";
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass-sm sheen pointer-events-auto flex w-full max-w-sm items-start gap-3 px-4 py-3"
              role="status"
            >
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
              >
                <Icon size={16} strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.body ? <p className="ink-2 mt-0.5 text-[13px] leading-snug">{t.body}</p> : null}
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="ink-3 hover:text-[var(--ink)] mt-0.5 shrink-0 rounded-full p-1 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
