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

  // Coded background music! A mysterious, ominous 16-bit arpeggio loop for "The Imposter"
  const toggleBgm = useCallback(() => {
    initAudio();
    
    if (isBgmPlaying) {
      clearInterval(bgmIntervalRef.current);
      setIsBgmPlaying(false);
      return;
    }

    setIsBgmPlaying(true);
    
    // Ominous Phrygian Dominant / Harmonic Minor sequence
    const sequence = [
      130.81, // C3
      138.59, // Db3
      164.81, // E3
      174.61, // F3
      130.81, // C3
      110.00, // A2
      123.47, // B2
      138.59, // Db3
    ];
    let step = 0;

    bgmIntervalRef.current = setInterval(() => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;

      const freq = sequence[step % sequence.length];
      
      // We use two oscillators to create a slightly detuned, eerie "thick" synth sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'triangle';
      osc2.type = 'square';
      
      // Slight detune for that eerie analog chorus effect
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      osc2.frequency.setValueAtTime(freq * 1.01, ctx.currentTime);
      
      // Very soft, ominous volume
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
      
      step++;
    }, 250); // Slower, more ominous pacing
  }, [isBgmPlaying]);

  useEffect(() => {
    return () => {
      if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
    };
  }, []);

  return { playCategoryHover, playCategorySelect, toggleBgm, isBgmPlaying, initAudio };
}
