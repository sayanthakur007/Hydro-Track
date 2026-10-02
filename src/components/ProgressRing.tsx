"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  percent: number; // 0..1 (may exceed)
  size?: number;
  stroke?: number;
  children?: ReactNode;
}

export default function ProgressRing({ percent, size = 260, stroke = 17, children }: Props) {
  const p = Math.max(0, Math.min(1, percent));
  const r = (size - stroke) / 2 - 6;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent-1)" />
            <stop offset="0.55" stopColor="var(--accent-2)" />
            <stop offset="1" stopColor="var(--accent-3)" />
          </linearGradient>
        </defs>
        {/* tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const x1 = center + Math.cos(a) * (r + stroke / 2 + 7);
          const y1 = center + Math.sin(a) * (r + stroke / 2 + 7);
          const x2 = center + Math.cos(a) * (r + stroke / 2 + (i % 9 === 0 ? 13 : 10));
          const y2 = center + Math.sin(a) * (r + stroke / 2 + (i % 9 === 0 ? 13 : 10));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--ink-3)"
              strokeWidth={i % 9 === 0 ? 2 : 1.2}
              opacity={0.35}
            />
          );
        })}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ type: "spring", stiffness: 55, damping: 17 }}
          style={{ filter: "drop-shadow(0 0 10px rgba(56,189,248,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
