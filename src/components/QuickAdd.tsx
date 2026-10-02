"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Droplet, Plus, GlassWater } from "lucide-react";
import Modal from "./Modal";

interface Props {
  glassSizeMl: number;
  onAdd: (amount: number) => void;
}

const PRESETS = [100, 200, 250, 300, 500];

export default function QuickAdd({ glassSizeMl, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(350);

  const presets = Array.from(new Set([...PRESETS, glassSizeMl])).sort((a, b) => a - b).slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        {presets.map((amount, i) => {
          const isGlass = amount === glassSizeMl;
          return (
            <motion.button
              key={amount}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onAdd(amount)}
              className={`group relative flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
                isGlass ? "pulse-glow" : ""
              }`}
              style={{
                background: isGlass
                  ? "linear-gradient(120deg, var(--accent-1), var(--accent-2))"
                  : "var(--card-flat)",
                borderColor: isGlass ? "transparent" : "var(--line)",
                color: isGlass ? "#fff" : "var(--ink)",
              }}
              aria-label={`Add ${amount} ml of water`}
            >
              {isGlass ? <GlassWater size={16} /> : <Droplet size={15} className="text-[var(--accent-1)]" />}
              <span className="num">+{amount}</span>
              {isGlass ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-2)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                  Your glass
                </span>
              ) : null}
            </motion.button>
          );
        })}

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm font-bold"
          style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
        >
          <Plus size={15} />
          Custom
        </motion.button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Custom amount" icon={Droplet}>
        <div className="flex flex-col items-center gap-6 pt-2">
          <div className="text-center">
            <span className="font-display num text-5xl font-bold text-gradient">{custom}</span>
            <span className="ink-2 ml-1 text-xl font-semibold">ml</span>
          </div>
          <input
            type="range"
            min={50}
            max={1000}
            step={25}
            value={custom}
            onChange={(e) => setCustom(Number(e.target.value))}
            className="range"
            aria-label="Water amount in milliliters"
          />
          <div className="ink-3 flex w-full justify-between text-xs font-semibold">
            <span>50 ml</span>
            <span>1000 ml</span>
          </div>
          <div className="flex w-full items-center gap-3">
            <input
              type="number"
              min={50}
              max={2500}
              className="input num"
              value={custom}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setCustom(Math.max(0, Math.min(2500, Math.round(v))));
              }}
              aria-label="Custom amount"
            />
            <button
              className="btn-primary whitespace-nowrap"
              onClick={() => {
                if (custom >= 10) {
                  onAdd(custom);
                  setOpen(false);
                }
              }}
            >
              <Droplet size={16} />
              Add water
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
