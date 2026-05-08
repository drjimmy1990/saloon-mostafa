"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimateInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

export function AnimateInView({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: AnimateInViewProps) {
  const initial = {
    opacity: 0,
    ...(direction === "up" && { y: 30 }),
    ...(direction === "left" && { x: -30 }),
    ...(direction === "right" && { x: 30 }),
  };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
