import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function ShinyButton({ children, className, onClick, ...props }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-cyan-500 px-8 py-4 font-black text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.8)]",
        className
      )}
      {...props}
    >
      <span className="relative z-10 block tracking-widest uppercase text-center drop-shadow-sm">
        {children}
      </span>
      
      {/* Sweeping Light Effect */}
      <motion.div
        className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg]"
        initial={{ x: '-150%' }}
        animate={{ x: '150%' }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 3,
          ease: 'linear',
          repeatDelay: 1
        }}
      />
    </motion.button>
  );
}
