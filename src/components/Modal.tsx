"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, icon: Icon, children }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default"
            style={{
              background: "rgba(3,10,28,0.55)",
              WebkitBackdropFilter: "blur(10px)",
              backdropFilter: "blur(10px)",
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass sheen relative z-10 w-full max-w-md p-6"
            initial={{ opacity: 0, y: 42, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {Icon ? (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "var(--card-strong)", color: "var(--accent-1)" }}
                  >
                    <Icon size={17} />
                  </span>
                ) : null}
                <h3 className="font-display text-lg font-bold">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="ink-3 hover:text-[var(--ink)] rounded-full p-2 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
