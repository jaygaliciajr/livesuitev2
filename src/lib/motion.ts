import { Transition, Variants } from "framer-motion";

export const springSoft: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.8,
};

export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: "easeOut" } as Transition,
};

export const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
};

export const drawerMotion = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.16, ease: "easeOut" } as Transition,
  },
  panel: {
    initial: { x: -24, opacity: 0.96 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -18, opacity: 0.96 },
    transition: springSoft,
  },
};

export const modalMotion = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.16, ease: "easeOut" } as Transition,
  },
  panel: {
    initial: { y: 20, opacity: 0.96, scale: 0.985 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: 14, opacity: 0.94, scale: 0.99 },
    transition: springSoft,
  },
};

export const tapFeedback = {
  whileTap: { scale: 0.985 },
};
