import { useRef, useCallback, useEffect, useState } from 'react';

const PLAYLIST = [
  '/music/unreal_superhero.mp3',
  '/music/spineless.mp3'
];

export function useKeygenAudio() {
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef(null);

  // Initialize the native HTML5 Audio element on mount
  useEffect(() => {
    const audio = new Audio(PLAYLIST[0]);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playTrack = useCallback((index) => {
    if (!audioRef.current) return;
    
    // Update src and play
    audioRef.current.src = PLAYLIST[index];
    audioRef.current.play().then(() => {
      setIsBgmPlaying(true);
    }).catch(err => {
      console.warn("Audio playback prevented:", err);
      setIsBgmPlaying(false);
    });
  }, []);

  const toggleBgm = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isBgmPlaying) {
      audioRef.current.pause();
      setIsBgmPlaying(false);
    } else {
      playTrack(currentTrackIndex);
    }
  }, [isBgmPlaying, currentTrackIndex, playTrack]);

  const nextTrack = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
    if (isBgmPlaying) {
      playTrack(nextIndex);
    } else {
      audioRef.current.src = PLAYLIST[nextIndex];
    }
  }, [currentTrackIndex, isBgmPlaying, playTrack]);

  const prevTrack = useCallback(() => {
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIndex);
    if (isBgmPlaying) {
      playTrack(prevIndex);
    } else {
      audioRef.current.src = PLAYLIST[prevIndex];
    }
  }, [currentTrackIndex, isBgmPlaying, playTrack]);

  // isReady is always true since HTML5 Audio is built-in
  return { toggleBgm, nextTrack, prevTrack, isBgmPlaying, isReady: true };
}
