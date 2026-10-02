"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface Props {
  theme: string;
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  const dark = theme !== "light";
  return (
    <button
      onClick={onToggle}
      data-app-theme-toggle="true"
      className="glass-sm relative flex h-10 w-[72px] items-center rounded-full px-1.5 transition-transform hover:scale-[1.04] active:scale-95"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ borderRadius: 999 }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-white"
        style={{
          marginLeft: dark ? "auto" : 0,
          background: dark
            ? "linear-gradient(135deg,#3b82f6,#818cf8)"
            : "linear-gradient(135deg,#f59e0b,#f97316)",
          boxShadow: dark
            ? "0 4px 14px rgba(99,102,241,0.6)"
            : "0 4px 14px rgba(245,158,11,0.6)",
        }}
      >
        {dark ? <Moon size={14} /> : <Sun size={14} />}
      </motion.span>
      <span className="ink-3 pointer-events-none absolute inset-0 flex items-center justify-between px-2.5">
        {dark ? <Sun size={13} /> : null}
        {!dark ? <Moon size={13} /> : <span />}
      </span>
    </button>
  );
}
