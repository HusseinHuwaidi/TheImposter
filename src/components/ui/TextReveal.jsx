import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function TextReveal({ text, className }) {
  // Detect RTL/Arabic text. Splitting RTL by character breaks cursive text shaping!
  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
  
  // If RTL, split by word to preserve joining. If LTR, split by character.
  const fragments = isRtl ? text.split(' ') : text.split('');

  return (
    <div className={cn("flex flex-wrap overflow-hidden gap-x-1", className)} dir={isRtl ? "rtl" : "ltr"}>
      {fragments.map((fragment, index) => (
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 200,
            delay: index * (isRtl ? 0.1 : 0.05), // slightly longer delay for words
          }}
          className="inline-block"
        >
          {fragment === ' ' ? '\u00A0' : fragment}
        </motion.span>
      ))}
    </div>
  );
}
