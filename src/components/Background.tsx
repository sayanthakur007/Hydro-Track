"use client";

import { useMemo } from "react";

interface AmbientBubble {
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export default function Background() {
  const bubbles = useMemo<AmbientBubble[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: (i * 83) % 100,
        size: 8 + ((i * 37) % 26),
        duration: 16 + ((i * 13) % 14),
        delay: -((i * 7) % 22),
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="ambient-bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      {/* fine noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
