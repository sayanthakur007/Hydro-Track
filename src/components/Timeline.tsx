"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Droplet, GlassWater, Trash2 } from "lucide-react";
import type { WaterEntry } from "@/lib/types";
import { formatMl, formatTime } from "@/lib/hydration";

interface Props {
  entries: WaterEntry[];
  onDelete: (id: string) => void;
  onAdd?: () => void;
  compact?: boolean;
}

export default function Timeline({ entries, onDelete, onAdd, compact }: Props) {
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 py-10 text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-3xl"
          style={{
            background: "color-mix(in srgb, var(--accent-1) 12%, transparent)",
            border: "1px dashed var(--line-strong)",
          }}
        >
          <GlassWater size={28} className="text-[var(--accent-1)]" />
        </motion.div>
        <div>
          <p className="font-display text-lg font-bold">Your hydration journey starts here</p>
          <p className="ink-2 mt-1 text-sm">Add your first glass of water to begin tracking.</p>
        </div>
        {onAdd ? (
          <button className="btn-primary" onClick={onAdd}>
            <Droplet size={16} />
            Add water
          </button>
        ) : null}
      </motion.div>
    );
  }

  return (
    <ol className="relative">
      <span
        className="absolute bottom-4 left-[19px] top-4 w-px"
        style={{ background: "linear-gradient(180deg, transparent, var(--line-strong) 12%, var(--line-strong) 88%, transparent)" }}
        aria-hidden
      />
      <AnimatePresence initial={false}>
        {entries.map((e, i) => (
          <motion.li
            key={e.id}
            layout
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28, delay: compact ? 0 : Math.min(i * 0.03, 0.3) }}
            className="group relative flex items-center gap-4 py-2.5"
          >
            <span
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-1) 24%, transparent), color-mix(in srgb, var(--accent-2) 18%, transparent))",
                border: "1px solid var(--line-strong)",
              }}
            >
              <Droplet size={16} className="text-[var(--accent-1)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="num text-[15px] font-bold">{formatMl(e.amountMl)}</p>
              <p className="ink-3 text-xs font-medium">{formatTime(e.createdAt)}</p>
            </div>
            <button
              onClick={() => onDelete(e.id)}
              className="ink-3 rounded-xl p-2 opacity-0 transition-all hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-60"
              aria-label={`Delete ${formatMl(e.amountMl)} entry from ${formatTime(e.createdAt)}`}
            >
              <Trash2 size={16} />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
