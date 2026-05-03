import { useRef, useCallback, useEffect, useState } from 'react';

const PLAYLIST = [
  '/music/unreal_superhero_3.xm',
  '/music/class05.mod',
  '/music/beyond_the_network.xm'
];

export function useKeygenAudio() {
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);
  const bufferCacheRef = useRef({});

  useEffect(() => {
    // Initialize ChiptuneJsPlayer once it's available in window
    if (window.ChiptuneJsPlayer && window.ChiptuneJsConfig && !playerRef.current) {
      const config = new window.ChiptuneJsConfig(-1);
      playerRef.current = new window.ChiptuneJsPlayer(config);
      
      // Setup loop
      playerRef.current.onEnded(() => {
        // Since we want repeat mode, libopenmpt usually loops internally if told to,
        // but if it triggers onEnded, we can just jump to next track or restart.
        // Let's just go to next track.
        nextTrack();
      });

      setIsReady(true);
    }
  }, []);

  const playTrack = useCallback((index) => {
    if (!playerRef.current) return;
    const url = PLAYLIST[index];
    
    // Stop current
    playerRef.current.stop();

    if (bufferCacheRef.current[url]) {
      playerRef.current.play(bufferCacheRef.current[url]);
      setIsBgmPlaying(true);
    } else {
      playerRef.current.load(url, (buffer) => {
        bufferCacheRef.current[url] = buffer;
        playerRef.current.play(buffer);
        setIsBgmPlaying(true);
      });
    }
  }, []);

  const toggleBgm = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isBgmPlaying) {
      playerRef.current.stop();
      setIsBgmPlaying(false);
    } else {
      playTrack(currentTrackIndex);
    }
  }, [isBgmPlaying, currentTrackIndex, playTrack]);

  const nextTrack = useCallback(() => {
    if (!playerRef.current) return;
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
    if (isBgmPlaying) {
      playTrack(nextIndex);
    }
  }, [currentTrackIndex, isBgmPlaying, playTrack]);

  const prevTrack = useCallback(() => {
    if (!playerRef.current) return;
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIndex);
    if (isBgmPlaying) {
      playTrack(prevIndex);
    }
  }, [currentTrackIndex, isBgmPlaying, playTrack]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  return { toggleBgm, nextTrack, prevTrack, isBgmPlaying, isReady };
}
