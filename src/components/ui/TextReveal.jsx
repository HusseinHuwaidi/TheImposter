import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function TextReveal({ text, className }) {
  // Split text into characters
  const characters = text.split('');

  return (
    <div className={cn("flex overflow-hidden", className)}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 200,
            delay: index * 0.05,
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
}
