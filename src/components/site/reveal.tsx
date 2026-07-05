"use client";

import { motion, MotionConfig } from "motion/react";

/**
 * Scroll reveal: opacity 0→1 + translateY 14px→0, once, ease-out expo.
 * reducedMotion="user" lets Motion drop the transform for users with
 * prefers-reduced-motion (opacity still fades in, no movement) without
 * branching in React — branching would cause a hydration mismatch that
 * leaves the SSR inline `opacity:0` in place.
 * The root layout ships a <noscript> override for no-JS visitors.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        data-reveal
        className={className}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-64px" }}
        transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
