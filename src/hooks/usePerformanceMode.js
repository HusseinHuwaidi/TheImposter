import { useState, useEffect } from 'react';

export function usePerformanceMode() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // 1. Check if user explicitly prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 2. Hardware heuristics (Logical Cores & RAM)
    // Many smart TVs have 4 or fewer cores and limited RAM
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const isLowHardware = cores <= 4 || memory < 4;

    // 3. User Agent TV Detection
    const ua = navigator.userAgent.toLowerCase();
    const isTV = /smart-tv|smarttv|tizen|webos|roku|crkey|appletv|aftv|android tv|viera|netcast|hisense/.test(ua);

    // If it's a TV, or explicitly requests reduced motion, or has very low hardware specs, enable low performance mode.
    // TVs are almost universally terrible at rendering continuous SVG/Framer motion animations.
    if (prefersReducedMotion || isTV || (isLowHardware && isTV)) {
      setIsLowPerformance(true);
    }
  }, []);

  return isLowPerformance;
}
