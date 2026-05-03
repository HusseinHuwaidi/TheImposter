import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  isLowPerformance = false,
  ...props
}) {
  const id = useId();

  if (isLowPerformance) return null;

  // Generate random coordinates for pulsing squares
  const getPos = () => [
    Math.floor((Math.random() * 1000) / width),
    Math.floor((Math.random() * 1000) / height),
  ];

  const squares = Array.from({ length: numSquares }, (_, i) => ({
    id: i,
    pos: getPos(),
  }));

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-white/5 stroke-white/10",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      
      {!isLowPerformance && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(({ pos: [x, y], id }, index) => (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, maxOpacity, 0] }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.1,
                repeatDelay: Math.random() * 2,
              }}
              strokeWidth="0"
              key={`${x}-${y}-${id}`}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
              fill="currentColor"
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
