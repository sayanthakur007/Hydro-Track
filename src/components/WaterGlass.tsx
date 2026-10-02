"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatMl } from "@/lib/hydration";

interface Props {
  percent: number; // 0..1+ (clamped internally)
  goalMl: number;
  lastAddedAt: number;
  size?: number;
}

const WAVE_D =
  "M -96 0 q 24 -7 48 0 t 48 0 t 48 0 t 48 0 t 48 0 t 48 0 L 240 300 L -96 300 Z";

export default function WaterGlass({ percent, goalMl, lastAddedAt, size = 240 }: Props) {
  const p = Math.max(0, Math.min(1, percent));

  // water surface travels between these two y positions (svg units)
  const TOP = 42;
  const BOTTOM = 272;
  const y = TOP + (1 - p) * (BOTTOM - TOP);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        cx: 66 + ((i * 37) % 96),
        cy: 30 + ((i * 53) % 200),
        r: 3 + ((i * 7) % 6),
        duration: 4.5 + ((i * 3) % 5),
        delay: -((i * 11) % 9),
      })),
    [],
  );

  const ticks = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative mx-auto select-none" style={{ width: size }}>
      <svg viewBox="0 0 220 300" width="100%" role="img" aria-label={`Glass ${Math.round(p * 100)}% full`}>
        <defs>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--water-top)" />
            <stop offset="0.55" stopColor="#2f9bf0" />
            <stop offset="1" stopColor="var(--water-bottom)" />
          </linearGradient>
          <linearGradient id="glassEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(210,240,255,0.75)" />
            <stop offset="0.5" stopColor="rgba(160,210,255,0.25)" />
            <stop offset="1" stopColor="rgba(210,240,255,0.55)" />
          </linearGradient>
          <clipPath id="glassInner">
            <path d="M 61 34 L 159 34 L 151 260 Q 149.5 272 137 272 L 83 272 Q 70.5 272 69 260 Z" />
          </clipPath>
          <clipPath id="belowSurface">
            <rect x="-140" y="6" width="520" height="320" />
          </clipPath>
        </defs>

        {/* ground shadow */}
        <ellipse cx="110" cy="288" rx="72" ry="9" fill="rgba(10,40,90,0.35)" />

        {/* glass interior ambient tint */}
        <path
          d="M 61 34 L 159 34 L 151 260 Q 149.5 272 137 272 L 83 272 Q 70.5 272 69 260 Z"
          fill="var(--track)"
          opacity={0.5}
        />

        {/* ---- animated water ---- */}
        <g clipPath="url(#glassInner)">
          <motion.g
            initial={false}
            animate={{ y }}
            transition={{ type: "spring", stiffness: 42, damping: 15, mass: 1.1 }}
          >
            {/* back wave */}
            <path d={WAVE_D} fill="url(#waterGrad)" opacity={0.45} className="wave-fast" transform="translate(0,7)" />
            {/* bubbles (masked below the surface) */}
            <g clipPath="url(#belowSurface)" style={{ opacity: p > 0.06 ? 1 : 0, transition: "opacity 600ms" }}>
              {bubbles.map((b, i) => (
                <circle
                  key={i}
                  className="gbubble"
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  style={{
                    animationDuration: `${b.duration}s`,
                    animationDelay: `${b.delay}s`,
                  }}
                />
              ))}
            </g>
            {/* front wave */}
            <path d={WAVE_D} fill="url(#waterGrad)" className="wave-slow" transform="translate(-34,0)" />
            {/* ripple on add */}
            {lastAddedAt > 0 && p > 0.02 ? (
              <ellipse
                key={lastAddedAt}
                className="ripple-ring"
                cx="110"
                cy="2"
                rx="62"
                ry="8"
                fill="none"
                stroke="rgba(230,250,255,0.85)"
                strokeWidth="2.5"
                style={{ transformOrigin: "110px 2px" }}
              />
            ) : null}
          </motion.g>

          {/* inner left highlight */}
          <rect x="72" y="52" width="7" height="196" rx="3.5" fill="rgba(255,255,255,0.25)" />
        </g>

        {/* measurement ticks */}
        {ticks.map((t) => {
          const ty = TOP + (1 - t) * (BOTTOM - TOP);
          const done = p >= t - 0.001;
          return (
            <g key={t}>
              <line
                x1="168"
                y1={ty}
                x2="184"
                y2={ty}
                stroke={done ? "var(--accent-1)" : "var(--ink-3)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={done ? 1 : 0.5}
              />
              <text
                x="191"
                y={ty + 3.5}
                fontSize="10"
                fill={done ? "var(--accent-1)" : "var(--ink-3)"}
                fontFamily="var(--font-body)"
                fontWeight="600"
                opacity={done ? 1 : 0.6}
              >
                {Math.round((goalMl * t) / 100) / 10}L
              </text>
            </g>
          );
        })}

        {/* glass outline */}
        <path
          d="M 55 26 L 165 26 L 156 262 Q 154 279 138 279 L 82 279 Q 66 279 64 262 Z"
          fill="none"
          stroke="url(#glassEdge)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* rim */}
        <line x1="52" y1="26" x2="168" y2="26" stroke="url(#glassEdge)" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <p className="ink-3 mt-1 text-center text-xs font-semibold tracking-wide">
        {formatMl(Math.round(p * goalMl))} of {formatMl(goalMl)}
      </p>
    </div>
  );
}
