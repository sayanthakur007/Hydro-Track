"use client";

import { useEffect, useRef, useState } from "react";

/** Smoothly animates a number towards `target`. */
export function useCountUp(target: number, duration = 750): number {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = currentRef.current;
    if (from === target) return;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      currentRef.current = v;
      setValue(v);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
