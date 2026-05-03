import { useState, useEffect } from 'react';

export function usePerformanceMode() {
  const [isLowPerformance, setIsLowPerformance] = useState(true); // GUILTY UNTIL PROVEN INNOCENT

  useEffect(() => {
    // 1. Check if user explicitly prefers reduced motion (if so, stay low perf)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 2. Hardware heuristics
    const cores = navigator.hardwareConcurrency || 4;
    const isPowerfulHardware = cores > 4;

    // 3. User Agent High-End Whitelist
    const ua = navigator.userAgent.toLowerCase();
    const isHighEndDevice = /iphone|ipad|macintosh|windows|pixel|sm-|galaxy/.test(ua);
    
    // 4. Ensure it's not a known TV pretending to be something else
    const isTV = /smart-tv|smarttv|tizen|webos|roku|crkey|appletv|aftv|android tv|viera|netcast|hisense/.test(ua);

    // If it's a powerful high-end device, not a TV, and doesn't want reduced motion, enable eye-candy!
    let isLow = true;
    if (isPowerfulHardware && isHighEndDevice && !isTV && !prefersReducedMotion) {
      isLow = false;
    }

    setIsLowPerformance(isLow);

    // Toggle body class for pure CSS optimizations
    if (isLow) {
      document.body.classList.add('low-performance');
    } else {
      document.body.classList.remove('low-performance');
    }
    
  }, []);

  return isLowPerformance;
}
