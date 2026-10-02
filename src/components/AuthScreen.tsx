"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Droplets,
  Flame,
  BarChart3,
  BellRing,
  Sparkles,
  LogIn,
  UserPlus,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import WaterGlass from "./WaterGlass";
import { useSession } from "@/lib/store";
import { formatMl } from "@/lib/hydration";

type Mode = "login" | "register";

const SUGGESTED_GOAL = 2500;

export default function AuthScreen() {
  const { authenticate, busy } = useSession();
  const [mode, setMode] = useState<Mode>("register");
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [goal, setGoal] = useState(3000);
  const [goalTouched, setGoalTouched] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    const result =
      mode === "register"
        ? await authenticate("register", {
            name,
            email,
            password,
            confirmPassword: confirm,
            dailyGoalMl: goalTouched ? goal : SUGGESTED_GOAL,
          })
        : await authenticate("login", { email, password });
    if (!result.ok) setError(result.error ?? "Something went wrong. Please try again.");
  };

  const features = [
    { icon: Droplets, text: "One-tap logging with a living, animated glass" },
    { icon: BellRing, text: "Smart reminders that greet you by name" },
    { icon: BarChart3, text: "Weekly & monthly insights into your habit" },
    { icon: Flame, text: "Streaks and badges that keep you coming back" },
  ];

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* -------- brand panel -------- */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{
                  background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))",
                  boxShadow: "0 12px 30px -8px rgba(37,140,248,0.7)",
                }}
              >
                <Droplets size={24} />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight">
                Hydro<span className="text-gradient">Track</span>
              </span>
            </div>

            <h1 className="font-display mt-8 text-5xl font-bold leading-[1.06] tracking-tight">
              Every drop counts.
              <br />
              <span className="text-gradient">Make yours count daily.</span>
            </h1>
            <p className="ink-2 mt-5 max-w-md text-lg leading-relaxed">
              A personal hydration companion with smart reminders, streaks and beautiful insights —
              built around you and your goals.
            </p>

            <ul className="mt-9 space-y-4">
              {features.map((f, i) => (
                <motion.li
                  key={f.text}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.1 }}
                  className="flex items-center gap-3.5"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
                  >
                    <f.icon size={18} />
                  </span>
                  <span className="ink-2 font-medium">{f.text}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="pointer-events-none absolute -z-10"
            />
          </motion.div>

          {/* -------- floating glass (desktop decoration) -------- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute right-[6%] top-[8%] hidden opacity-80 xl:block"
          >
            <div className="float-y">
              <WaterGlass percent={0.64} goalMl={3000} lastAddedAt={0} size={170} />
            </div>
          </motion.div>

          {/* -------- auth card -------- */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass sheen mx-auto w-full max-w-md p-7 sm:p-9">
              <div className="mb-7 flex items-center gap-3 lg:hidden">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                  style={{ background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))" }}
                >
                  <Droplets size={22} />
                </span>
                <span className="font-display text-xl font-bold">
                  Hydro<span className="text-gradient">Track</span>
                </span>
              </div>

              {/* mode switch */}
              <div className="glass-inset relative mb-7 grid grid-cols-2 gap-1 p-1">
                {(["login", "register"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className="relative z-10 rounded-xl py-2.5 text-sm font-bold transition-colors"
                    style={{ color: mode === m ? "#fff" : "var(--ink-2)" }}
                  >
                    {mode === m ? (
                      <motion.span
                        layoutId="auth-pill"
                        className="absolute inset-0 -z-10 rounded-xl"
                        style={{
                          background: "linear-gradient(120deg,var(--accent-1),var(--accent-2))",
                          boxShadow: "0 8px 22px -8px rgba(37,140,248,0.8)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    ) : null}
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4" noValidate>
                <AnimatePresence mode="popLayout" initial={false}>
                  {mode === "register" ? (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <label className="label mb-1.5 block" htmlFor="auth-name">
                        Full name
                      </label>
                      <input
                        id="auth-name"
                        className="input"
                        placeholder="Sayan Thakur"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div>
                  <label className="label mb-1.5 block" htmlFor="auth-email">
                    Email or username
                  </label>
                  <input
                    id="auth-email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="label mb-1.5 block" htmlFor="auth-pass">
                    Password
                  </label>
                  <input
                    id="auth-pass"
                    type="password"
                    className="input"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    required
                  />
                </div>

                <AnimatePresence mode="popLayout" initial={false}>
                  {mode === "register" ? (
                    <motion.div
                      key="register-extra"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="label mb-1.5 block" htmlFor="auth-confirm">
                          Confirm password
                        </label>
                        <input
                          id="auth-confirm"
                          type="password"
                          className="input"
                          placeholder="Repeat your password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          autoComplete="new-password"
                          required
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="label" htmlFor="auth-goal">
                            Daily water goal
                          </label>
                          <span className="num text-sm font-bold text-gradient">{formatMl(goal)}</span>
                        </div>
                        <input
                          id="auth-goal"
                          type="range"
                          min={1000}
                          max={6000}
                          step={100}
                          value={goal}
                          onChange={(e) => {
                            setGoal(Number(e.target.value));
                            setGoalTouched(true);
                          }}
                          className="range"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGoal(SUGGESTED_GOAL);
                            setGoalTouched(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-1)] transition-opacity hover:opacity-80"
                        >
                          <Sparkles size={12} />
                          Use suggested goal — {formatMl(SUGGESTED_GOAL)} for the average adult
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {error ? (
                    <motion.p
                      key={error}
                      initial={{ opacity: 0, y: -6, x: 0 }}
                      animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 3, 0] }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                      style={{
                        background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                        color: "var(--danger)",
                        border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                      }}
                      role="alert"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      {error}
                    </motion.p>
                  ) : null}
                </AnimatePresence>

                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? (
                    <LoaderCircle size={17} className="spin-slow" />
                  ) : mode === "login" ? (
                    <LogIn size={17} />
                  ) : (
                    <UserPlus size={17} />
                  )}
                  {mode === "login" ? "Sign in" : "Create my account"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                <span className="ink-3 text-xs font-semibold uppercase tracking-widest">or</span>
                <span className="h-px flex-1" style={{ background: "var(--line)" }} />
              </div>

              <button
                onClick={() => authenticate("demo")}
                disabled={busy}
                className="btn-ghost w-full"
                type="button"
              >
                <Sparkles size={16} className="text-[var(--accent-1)]" />
                Explore with a demo account
              </button>
              <p className="ink-3 mt-4 text-center text-xs leading-relaxed">
                Your data stays yours — every account gets its own private hydration history.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
