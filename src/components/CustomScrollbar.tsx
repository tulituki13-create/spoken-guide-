import React, { RefObject } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

interface CustomScrollbarProps {
  containerRef?: RefObject<HTMLElement>;
}

export function CustomScrollbar({ containerRef }: CustomScrollbarProps) {
  const { scrollYProgress } = useScroll(containerRef ? { container: containerRef } : undefined);
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/80 via-blue-500/80 to-sky-400/80 origin-top z-[9999] rounded-l-full pointer-events-none hidden md:block"
      style={{ scaleY }}
    />
  );
}
