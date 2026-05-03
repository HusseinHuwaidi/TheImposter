import { useRef, useCallback, useEffect, useState } from 'react';

export function useRetroAudio() {
  const audioCtxRef = useRef(null);
  const bgmIntervalRef = useRef(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playBlip = useCallback((frequency = 440, type = 'square', duration = 0.1, volume = 0.1) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  // Play when hovering over a category
  const playCategoryHover = useCallback(() => {
    initAudio();
    playBlip(523.25, 'square', 0.05, 0.05); // C5
  }, [playBlip]);

  // Play when clicking a category
  const playCategorySelect = useCallback(() => {
    initAudio();
    playBlip(440, 'square', 0.1, 0.08); // A4
    setTimeout(() => playBlip(554.37, 'square', 0.1, 0.08), 100); // C#5
    setTimeout(() => playBlip(659.25, 'square', 0.2, 0.08), 200); // E5
  }, [playBlip]);

  // Coded background music! A simple 16-bit arpeggio loop
  const toggleBgm = useCallback(() => {
    initAudio();
    
    if (isBgmPlaying) {
      clearInterval(bgmIntervalRef.current);
      setIsBgmPlaying(false);
      return;
    }

    setIsBgmPlaying(true);
    
    // Fun retro 16-bit arpeggiator sequence (A minor / C major feel)
    const sequence = [
      220.00, // A3
      329.63, // E4
      261.63, // C4
      392.00, // G4
      220.00, // A3
      329.63, // E4
      293.66, // D4
      349.23, // F4
    ];
    let step = 0;

    bgmIntervalRef.current = setInterval(() => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const freq = sequence[step % sequence.length];
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Alternate between square and triangle for that SEGA Genesis FM synth feel
      osc.type = step % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      
      step++;
    }, 180); // Speed of the arpeggiator
  }, [isBgmPlaying]);

  useEffect(() => {
    return () => {
      if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
    };
  }, []);

  return { playCategoryHover, playCategorySelect, toggleBgm, isBgmPlaying, initAudio };
}
