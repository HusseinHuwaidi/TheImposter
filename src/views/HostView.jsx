import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

import { supabase } from '../lib/supabase';
import AdBanner from '../components/AdBanner';
import { useTranslation } from 'react-i18next';

import { SubjectDatabase, CATEGORY_NAMES } from '../lib/SubjectDatabase';
import mottosData from '../lib/mottos.json';

const LanguageSelector = lazy(() => import('../components/LanguageSelector'));
const CreditsModal = lazy(() => import('../components/CreditsModal'));

import { ShinyButton } from '../components/ui/ShinyButton';
import { AnimatedGridPattern } from '../components/ui/AnimatedGridPattern';
import { TextReveal } from '../components/ui/TextReveal';
import { MagneticButton } from '../components/ui/MagneticButton';
import { MovingPixels } from '../components/ui/MovingPixels';
import { useRetroAudio } from '../hooks/useRetroAudio';
import { usePerformanceMode } from '../hooks/usePerformanceMode';
import { useKeygenAudio } from '../hooks/useKeygenAudio';

export default function HostView() {
  const { i18n, t } = useTranslation();
  const [pin, setPin] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // lobby, role_reveal, questioning, voting, leaderboard
  const [roomChannel, setRoomChannel] = useState(null);
  
  // Game Settings
  const [hardMode, setHardMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('random');
  const [customWords, setCustomWords] = useState('');
  
  // Funny Motto
  const [motto, setMotto] = useState('');

  // Modals
  const [showCredits, setShowCredits] = useState(false);

  // Game Engine States
  const [gameConfig, setGameConfig] = useState({ category: '', subject: null, decoySubject: null, imposterId: null, hardMode: false });
  const [turnState, setTurnState] = useState({ askerIndex: 0, answererIndex: 1 });
  const [votes, setVotes] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState({});

  const isLowPerformance = usePerformanceMode();

  const { playCategoryHover, playCategorySelect, initAudio } = useRetroAudio();
  const { toggleBgm, nextTrack, prevTrack, isBgmPlaying, isReady } = useKeygenAudio();

  // Start audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, [initAudio]);

  useEffect(() => {
    // Pick random motto based on current language
    const lang = i18n.language?.split('-')[0] || 'en';
    const availableMottos = mottosData[lang] || mottosData['en'];
    if (availableMottos && availableMottos.length > 0) {
      setMotto(availableMottos[Math.floor(Math.random() * availableMottos.length)]);
    }

    // Generate a random 6 digit PIN
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(newPin);

    // Initialize Supabase Room with this PIN
    const channel = supabase.channel(`room:${newPin}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activePlayers = [];
        for (const id in state) {
          activePlayers.push(state[id][0]); // Get the first presence instance for each user
        }
        setPlayers(activePlayers);
      })
      .on('broadcast', { event: 'vote' }, (payload) => {
        const { voterId, votedForId } = payload.payload;
        setVotes(prev => ({ ...prev, [voterId]: votedForId }));
      })
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        setChatHistory(prev => [...prev, payload.payload]);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, typing } = payload.payload;
        setIsTyping(prev => ({ ...prev, [userId]: typing }));
      })
      .subscribe();

    setRoomChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [i18n.language]);

  // Handle Disconnections during active game
  useEffect(() => {
    if (gameState === 'lobby' || gameState === 'leaderboard') return;
    
    // Check if Imposter left
    if (gameConfig.imposterId && !players.find(p => p.id === gameConfig.imposterId)) {
      alert("The Imposter has fled the game!");
      broadcastStateChange('leaderboard');
      return;
    }

    // Check minimum players
    if (players.length < 3) {
      alert("Not enough players left to continue!");
      broadcastStateChange('lobby');
      return;
    }
  }, [players, gameState, gameConfig]);

  const broadcastStateChange = async (newState, extraPayload = {}) => {
    setGameState(newState);
    if (roomChannel) {
      await roomChannel.send({
        type: 'broadcast',
        event: 'state_change',
        payload: { gameState: newState, ...extraPayload },
      });
    }
  };

  const startGame = () => {
    if (players.length < 3) {
      alert(t('MIN_PLAYERS_WARNING') || "Need at least 3 players to start!");
      return;
    }

    let categoryKey = selectedCategory;
    let availableSubjects = [];

    if (categoryKey === 'random') {
      const keys = Object.keys(SubjectDatabase);
      categoryKey = keys[Math.floor(Math.random() * keys.length)];
    }

    if (categoryKey === 'custom') {
      const words = customWords.split(',').map(w => w.trim()).filter(w => w);
      if (words.length < 3) {
        alert("Please enter at least 3 custom words separated by commas.");
        return;
      }
      availableSubjects = words.map(w => ({ emoji: '❓', names: { custom: w }, isCustom: true }));
    } else {
      availableSubjects = SubjectDatabase[categoryKey];
    }

    const randomSubjectIndex = Math.floor(Math.random() * availableSubjects.length);
    const chosenSubject = availableSubjects[randomSubjectIndex];

    let decoySubject = null;
    if (hardMode) {
      const remainingSubjects = availableSubjects.filter((_, i) => i !== randomSubjectIndex);
      if (remainingSubjects.length > 0) {
        decoySubject = remainingSubjects[Math.floor(Math.random() * remainingSubjects.length)];
      } else {
        decoySubject = chosenSubject; // fallback if somehow only 1 word
      }
    }
    
    const randomImposterIndex = Math.floor(Math.random() * players.length);
    const imposterId = players[randomImposterIndex].id;

    const newConfig = { 
        category: categoryKey, 
        subject: chosenSubject, 
        decoySubject: decoySubject,
        imposterId: imposterId,
        hardMode: hardMode
    };
    setGameConfig(newConfig);
    
    // Reset turns and votes
    setTurnState({ askerIndex: 0, answererIndex: 1 });
    setVotes({});

    // Broadcast the role reveal phase with the game config
    broadcastStateChange('role_reveal', { gameConfig: newConfig, players });
  };

  const nextTurn = () => {
    let nextAsker = turnState.askerIndex + 1;
    let nextAnswerer = (nextAsker + 1) % players.length;

    if (nextAsker >= players.length) {
      // Everyone has asked a question, move to open floor
      broadcastStateChange('open_floor');
    } else {
      setTurnState({ askerIndex: nextAsker, answererIndex: nextAnswerer });
      broadcastStateChange('questioning', { turnState: { askerIndex: nextAsker, answererIndex: nextAnswerer } });
    }
  };

  const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const joinUrl = `${publicUrl}/play?pin=${pin}`;

  const lang = i18n.language?.split('-')[0] || 'en';

  return (
    <div className="view-host relative min-h-[100dvh] w-full text-white font-sans flex flex-col">
      <AnimatedGridPattern className="text-white/5 opacity-50 z-0" maxOpacity={0.3} isLowPerformance={isLowPerformance} />
      <MovingPixels isLowPerformance={isLowPerformance} />
      
      {/* Top Bar for Language & Credits */}
      <div className="absolute top-4 start-4 z-50 flex items-center gap-4">
        <Suspense fallback={<div className="w-8 h-8 rounded bg-white/10" />}>
          <LanguageSelector />
        </Suspense>
        <button 
          onClick={() => setShowCredits(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20 text-xl"
          title="Credits"
        >
          🏆
        </button>
      </div>

      <Suspense fallback={null}>
        {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
      </Suspense>

      {gameState === 'lobby' && (
        <div className="w-full min-h-[100dvh] p-4 md:p-8 box-border flex flex-col gap-4 md:gap-6 relative z-10 pb-16">
          
          {/* Top Row */}
          <div className="flex flex-col landscape:flex-row md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
            
            {/* Tile 1: Join Game (Left - 25%) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel w-full landscape:w-1/4 md:w-1/4 flex flex-col items-center justify-center text-center p-4 md:p-6 shrink-0"
            >
              
              <div className="bg-white p-3 md:p-4 rounded-2xl mb-4 shadow-lg shrink-0">
                <QRCodeSVG value={joinUrl} size={160} className="w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44" />
              </div>
              
              <h2 className="text-lg md:text-xl">{t('game_pin')}</h2>
              <div className="text-3xl md:text-4xl font-black tracking-widest text-white drop-shadow-md">
                <TextReveal text={pin} className="justify-center" />
              </div>
              
              <ShinyButton 
                onClick={() => window.open(joinUrl, '_blank')}
                className="mt-6 w-full py-3 text-sm"
              >
                {t('Join as Player') || 'Join as Player'}
              </ShinyButton>
            </motion.div>

            {/* Tile 2: Game Setup (Center - 50%) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-panel w-full landscape:w-1/2 md:w-1/2 flex flex-col p-4 md:p-6 relative min-w-0"
            >
              <div className="font-bold mb-6 text-lg md:text-xl shrink-0 text-center text-cyan-400 uppercase tracking-widest">{t('SELECT_CATEGORY') || 'Choose a Category'}</div>
              
              {/* Category Grid - Uniform grid to fill space without void and prevent scrolling */}
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 place-items-center gap-2 md:gap-4 mb-8 pb-4 flex-1 min-h-[150px] w-full items-center justify-center">
                {[
                  { id: 'random', icon: '🎲' },
                  { id: 'food', icon: '🍔' },
                  { id: 'animals', icon: '🐾' },
                  { id: 'countries', icon: '🌍' },
                  { id: 'sports', icon: '⚽' },
                  { id: 'vehicles', icon: '🚗' },
                  { id: 'clothing', icon: '👕' },
                  { id: 'nature', icon: '🌲' },
                  { id: 'movies', icon: '🎬' },
                  { id: 'music', icon: '🎵' },
                  { id: 'custom', icon: '✏️' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    title={CATEGORY_NAMES[cat.id]?.[lang] || cat.id}
                    onMouseEnter={playCategoryHover}
                    onClick={() => {
                      playCategorySelect();
                      setSelectedCategory(cat.id);
                    }}
                    className={`text-4xl md:text-5xl xl:text-6xl transition-all duration-300 hover:scale-110 ${selectedCategory === cat.id ? 'scale-125 drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] opacity-100 z-10 brightness-110' : 'opacity-40 hover:opacity-80 grayscale-[50%]'}`}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>

              {selectedCategory === 'custom' && (
                <div className="mb-6 shrink-0 animate-fade-in w-full max-w-xl mx-auto">
                  <textarea
                    className="w-full bg-black/30 border border-white/20 rounded-xl p-4 text-base text-white placeholder-white/40 focus:outline-none focus:border-pink-500"
                    rows="2"
                    placeholder="Enter comma separated words (e.g. Apple, Banana, Orange)"
                    value={customWords}
                    onChange={(e) => setCustomWords(e.target.value)}
                  ></textarea>
                </div>
              )}

            <ShinyButton
              className="w-full py-3 text-sm mb-4"
              onClick={startGame}
            >
              {t('START_GAME') || t('start_game')}
            </ShinyButton>

            <div className="flex justify-center items-center mt-auto border-t border-white/10 pt-4 shrink-0 w-full">
              <div className="flex items-center gap-3">
                <div className="flex bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button 
                    onClick={prevTrack} 
                    className="flex items-center justify-center w-10 h-10 hover:bg-white/10 transition-all text-sm"
                    title="Previous Track"
                  >
                    ⏮️
                  </button>
                  <button 
                    onClick={toggleBgm} 
                    className={`flex items-center justify-center w-10 h-10 transition-all text-xl ${isBgmPlaying ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10'}`}
                    title="Toggle Keygen Music"
                  >
                    {isBgmPlaying ? '🎵' : '🔇'}
                  </button>
                  <button 
                    onClick={nextTrack} 
                    className="flex items-center justify-center w-10 h-10 hover:bg-white/10 transition-all text-sm"
                    title="Next Track"
                  >
                    ⏭️
                  </button>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors h-10">
                  <div className="font-bold text-sm text-pink-400">{t('HARD_MODE') || 'Hard Mode'}</div>
                  <div className="relative ml-2">
                    <input type="checkbox" className="sr-only" checked={hardMode} onChange={(e) => setHardMode(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${hardMode ? 'bg-pink-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hardMode ? 'translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

            {/* Tile 3: Ad Banner (Right - 25%) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel w-full landscape:w-1/4 md:w-1/4 flex flex-col items-center justify-center p-0 overflow-hidden relative shrink-0"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                <span className="text-5xl mb-3 drop-shadow-md">⭐</span>
                <span className="text-sm tracking-widest uppercase font-bold text-white/50 text-center px-4">Sponsored Space</span>
              </div>
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <AdBanner
                  slotId="7632905010"
                  style={{ width: '100%', height: '100%', minHeight: '300px' }}
                />
              </div>
            </motion.div>
            
          </div>

          {/* Bottom Row: Players List (Flexible Height) */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-panel h-1/4 min-h-[150px] shrink-0 flex flex-col p-4 md:p-6 overflow-hidden"
          >
            <div className="flex-1 flex flex-wrap gap-4 overflow-y-auto items-start content-start custom-scrollbar">
              <AnimatePresence>
                {players.length === 0 && (
                  <div className="w-full text-center text-white/40 italic py-4">{t('WAITING_FOR_PLAYERS') || 'Waiting for players to join...'}</div>
                )}
                {players.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="bg-white/10 p-3 md:p-4 rounded-2xl text-center min-w-[100px] md:min-w-[120px]"
                  >
                    <div className="text-3xl md:text-4xl mb-2">{p.emoji}</div>
                    <div className="text-sm md:text-base font-bold truncate">{p.name}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      )}

      {gameState === 'role_reveal' && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-4xl text-center"
          >
            <h1 style={{ fontSize: '4rem', color: 'var(--primary)' }}>{t('look_at_devices')}</h1>
            <p style={{ fontSize: '2rem', marginTop: '20px', color: 'var(--text-muted)' }}>{t('category')}: {CATEGORY_NAMES[gameConfig.category]?.[lang] || gameConfig.category}</p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-accent"
              style={{ marginTop: '60px' }}
              onClick={nextTurn}
            >
              Start Questioning
            </motion.button>
          </motion.div>
        </div>
      )}

      {gameState === 'questioning' && (
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
          <div className="flex flex-col w-full h-full max-w-6xl gap-4">
            
            {/* Main Prompt */}
            <motion.div
              key={`turn-${turnState.askerIndex}`}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-panel text-center p-6 shrink-0"
            >
              <h1 className="text-2xl md:text-4xl text-white">
                <span className="text-primary font-bold">{players[turnState.askerIndex]?.name} {players[turnState.askerIndex]?.emoji}</span>
                <br className="md:hidden" />
                <span className="mx-2 opacity-70">{t('ask_a_question')} {t('to')}</span>
                <br className="md:hidden" />
                <span className="text-secondary font-bold">{players[turnState.answererIndex]?.name} {players[turnState.answererIndex]?.emoji}</span>
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary mt-4 md:mt-6 px-8 py-3 text-lg md:text-xl"
                onClick={nextTurn}
              >
                Next Turn
              </motion.button>
            </motion.div>

            {/* Optional Chat Box for Remote Play */}
            <div className="glass-panel flex-1 flex flex-col p-4 md:p-6 overflow-hidden min-h-0">
              <h3 className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Remote Chat (Optional)</h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-4">
                {chatHistory.length === 0 && (
                  <div className="m-auto text-white/30 italic text-center">No messages yet. Talk out loud if playing in person!</div>
                )}
                {chatHistory.map((msg, i) => {
                  const sender = players.find(p => p.id === msg.fromId);
                  return (
                    <div key={i} className="bg-white/5 rounded-xl p-3 max-w-[80%] self-start border border-white/10">
                      <div className="text-xs text-white/50 mb-1 font-bold">{sender?.name} {sender?.emoji}</div>
                      <div className="text-white md:text-lg">{msg.text}</div>
                    </div>
                  );
                })}
                {/* Typing Indicators */}
                {Object.entries(isTyping).filter(([_, typing]) => typing).map(([userId]) => {
                  const typist = players.find(p => p.id === userId);
                  if (!typist) return null;
                  return (
                    <div key={`typing-${userId}`} className="text-white/50 italic text-sm animate-pulse">
                      {typist.name} {typist.emoji} is typing...
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {gameState === 'open_floor' && (
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
          <div className="flex flex-col w-full h-full max-w-6xl gap-4">
            
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-panel text-center p-6 shrink-0 border-pink-500/30 border-2"
            >
              <h1 className="text-3xl md:text-5xl text-pink-400 font-black tracking-wider mb-2">OPEN FLOOR</h1>
              <p className="text-white/70 text-lg md:text-xl">Anyone can ask a final question to anyone!</p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-accent mt-4 md:mt-6 px-8 py-3 text-lg md:text-xl"
                onClick={() => broadcastStateChange('voting')}
              >
                Start Voting
              </motion.button>
            </motion.div>

            {/* Optional Chat Box for Remote Play */}
            <div className="glass-panel flex-1 flex flex-col p-4 md:p-6 overflow-hidden min-h-0">
              <h3 className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Remote Chat (Optional)</h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-4">
                {chatHistory.length === 0 && (
                  <div className="m-auto text-white/30 italic text-center">No messages yet. Talk out loud if playing in person!</div>
                )}
                {chatHistory.map((msg, i) => {
                  const sender = players.find(p => p.id === msg.fromId);
                  return (
                    <div key={i} className="bg-white/5 rounded-xl p-3 max-w-[80%] self-start border border-white/10">
                      <div className="text-xs text-white/50 mb-1 font-bold">{sender?.name} {sender?.emoji}</div>
                      <div className="text-white md:text-lg">{msg.text}</div>
                    </div>
                  );
                })}
                {/* Typing Indicators */}
                {Object.entries(isTyping).filter(([_, typing]) => typing).map(([userId]) => {
                  const typist = players.find(p => p.id === userId);
                  if (!typist) return null;
                  return (
                    <div key={`typing-${userId}`} className="text-white/50 italic text-sm animate-pulse">
                      {typist.name} {typist.emoji} is typing...
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {gameState === 'voting' && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-4xl text-center"
          >
            <h1 style={{ fontSize: '4rem', color: 'var(--primary)' }}>{t('who_is_imposter')}</h1>
            <p style={{ fontSize: '2rem', marginTop: '20px', color: 'var(--text-muted)' }}>{t('vote_on_devices')}</p>
            
            <h3 style={{ marginTop: '40px' }}>Votes Cast: {Object.keys(votes).length} / {players.length}</h3>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-accent"
              style={{ marginTop: '60px' }}
              onClick={() => broadcastStateChange('leaderboard')}
            >
              Reveal Imposter
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Leaderboard State + Interstitial Ad */}
      {gameState === 'leaderboard' && (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '40px', gap: '40px', boxSizing: 'border-box' }}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel"
            style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
          >
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '40px' }}>{t('leaderboard')}</h1>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '24px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>{t('imposter_was')}</h2>
              <div style={{ fontSize: '5rem', margin: '20px 0' }}>
                {players.find(p => p.id === gameConfig.imposterId)?.emoji}
              </div>
              <h3 style={{ fontSize: '2rem' }}>{players.find(p => p.id === gameConfig.imposterId)?.name}</h3>
            </div>

            <ShinyButton
              className="mt-5 px-10 py-4 text-xl"
              onClick={() => broadcastStateChange('lobby')}
            >
              {t('next_game')}
            </ShinyButton>
          </motion.div>

          {/* Interstitial Ad Space */}
          <div className="glass-panel relative flex flex-col items-center justify-center overflow-hidden" style={{ width: '300px', padding: 0 }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
              <span className="text-4xl mb-2">⭐</span>
              <span className="text-xs tracking-widest uppercase font-bold text-white/50">Sponsored Space</span>
            </div>
            <div className="relative z-10 w-full h-full">
              <AdBanner
                slotId="7632905010"
                style={{ width: '300px', height: '600px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
