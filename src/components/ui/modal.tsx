"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { modalMotion } from "@/lib/motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-6"
          initial={modalMotion.overlay.initial}
          animate={modalMotion.overlay.animate}
          exit={modalMotion.overlay.exit}
          transition={modalMotion.overlay.transition}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className={cn(
              "surface-elevated w-full rounded-t-[22px] p-4 sm:max-w-xl sm:rounded-[20px]",
              className,
            )}
            initial={modalMotion.panel.initial}
            animate={modalMotion.panel.animate}
            exit={modalMotion.panel.exit}
            transition={modalMotion.panel.transition}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
              <button className="focus-ring rounded-xl border border-border/70 bg-panel/60 p-2 text-muted transition hover:bg-panel-2" onClick={onClose}>
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
