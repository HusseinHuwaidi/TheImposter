import React from 'react';
import { motion } from 'framer-motion';

export function MovingPixels() {
  // Generate a random array of tiny retro pixels
  const pixels = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: 15 + Math.random() * 25,
    size: Math.random() > 0.7 ? 4 : 2, // 2px or 4px square blocks
    delay: -(Math.random() * 25), // Start at random times
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {pixels.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-white/20"
          style={{ width: p.size, height: p.size, left: p.left }}
          animate={{
            y: ["-5vh", "105vh"],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            y: {
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            },
            rotate: {
              duration: p.duration / 2,
              repeat: Infinity,
              ease: "linear",
            }
          }}
        />
      ))}
    </div>
  );
}
