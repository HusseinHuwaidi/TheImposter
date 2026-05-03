import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

import { supabase } from '../lib/supabase';
import AdBanner from '../components/AdBanner';
import { useTranslation } from 'react-i18next';

import { SubjectDatabase, CATEGORY_NAMES } from '../lib/SubjectDatabase';
import mottosData from '../lib/mottos.json';
import LanguageSelector from '../components/LanguageSelector';
import CreditsModal from '../components/CreditsModal';

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
      .subscribe();

    setRoomChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [i18n.language]);

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
      // Everyone has asked a question, move to voting
      broadcastStateChange('voting');
    } else {
      setTurnState({ askerIndex: nextAsker, answererIndex: nextAnswerer });
      broadcastStateChange('questioning', { turnState: { askerIndex: nextAsker, answererIndex: nextAnswerer } });
    }
  };

  const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const joinUrl = `${publicUrl}/play?pin=${pin}`;

  const lang = i18n.language?.split('-')[0] || 'en';

  return (
    <div className="view-host relative h-full w-full overflow-hidden text-white font-sans">
      {/* Top Bar for Language & Credits */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <LanguageSelector />
        <button 
          onClick={() => setShowCredits(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20 text-xl"
          title="Credits"
        >
          🏆
        </button>
      </div>

      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}

      {gameState === 'lobby' && (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '2vw', boxSizing: 'border-box' }}>
          {/* Left Side: Setup & Settings */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingRight: '20px' }}
          >
            <div className="glass-panel" style={{ textAlign: 'center', flex: '0 0 auto', padding: 'min(20px, 2vh)' }}>
              <h1 style={{ fontSize: 'min(2.5rem, 4vh)', margin: 0, color: 'var(--accent)' }}>{t('join_the_game')}</h1>
              {motto && <p className="text-pink-400 italic font-medium mt-1 mb-3 text-sm md:text-base">"{motto}"</p>}
              
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '30px' }}>
                <div style={{ background: 'white', padding: '10px', borderRadius: '16px', flexShrink: 0 }}>
                  <QRCodeSVG value={joinUrl} size={140} style={{ width: 'min(140px, 15vh)', height: 'min(140px, 15vh)' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: 'min(1.5rem, 2vh)', margin: 0 }}>{t('go_to')} <span style={{ color: 'var(--primary)' }}>{window.location.host}</span></h2>
                  <h2 style={{ fontSize: 'min(1.5rem, 2vh)', margin: '10px 0 0 0' }}>{t('game_pin')}</h2>
                  <div style={{ fontSize: 'min(3rem, 5vh)', fontWeight: '900', letterSpacing: '4px', lineHeight: 1 }}>{pin}</div>
                </div>
              </div>
            </div>

            {/* Game Settings */}
            <div className="glass-panel mt-4 flex-1 flex flex-col overflow-y-auto" style={{ padding: '20px' }}>
              <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">{t('SETUP_TITLE') || 'Game Setup'}</h2>
              
              {/* Hard Mode Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group mb-6 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={hardMode} onChange={(e) => setHardMode(e.target.checked)} />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${hardMode ? 'bg-pink-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${hardMode ? 'translate-x-6' : ''}`}></div>
                </div>
                <div>
                  <div className="font-bold text-lg">{t('HARD_MODE') || 'Hard Mode'}</div>
                  <div className="text-xs text-slate-300">{t('HARD_MODE_HINT') || 'Imposter sees a fake subject — nobody knows who they are!'}</div>
                </div>
              </label>

              {/* Category Selector */}
              <div className="font-bold mb-2">{t('SELECT_CATEGORY') || 'Choose a Category'}</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
                <button
                  onClick={() => setSelectedCategory('random')}
                  className={`p-2 rounded-lg text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors ${selectedCategory === 'random' ? 'bg-cyan-500 text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <span className="text-2xl">🎲</span>
                  <span className="truncate w-full text-center">Random</span>
                </button>
                {Object.keys(SubjectDatabase).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-2 rounded-lg text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors ${selectedCategory === cat ? 'bg-cyan-500 text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    <span className="text-2xl">{SubjectDatabase[cat][0]?.emoji || '📂'}</span>
                    <span className="truncate w-full text-center">{CATEGORY_NAMES[cat]?.[lang] || cat}</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedCategory('custom')}
                  className={`p-2 rounded-lg text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors ${selectedCategory === 'custom' ? 'bg-pink-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <span className="text-2xl">✏️</span>
                  <span className="truncate w-full text-center">{CATEGORY_NAMES['custom']?.[lang] || 'Custom'}</span>
                </button>
              </div>

              {selectedCategory === 'custom' && (
                <div className="mb-4 animate-fade-in">
                  <textarea
                    className="w-full bg-black/30 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-pink-500"
                    rows="3"
                    placeholder="Enter comma separated words (e.g. Apple, Banana, Orange)"
                    value={customWords}
                    onChange={(e) => setCustomWords(e.target.value)}
                  ></textarea>
                </div>
              )}

              <div className="mt-auto pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary w-full py-4 text-xl font-black tracking-widest"
                  onClick={startGame}
                >
                  {t('START_GAME') || t('start_game')}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Players List */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '20px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                {t('PLAYERS_LABEL')?.replace('{count}', players.length.toString()) || `Players (${players.length})`}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', overflowY: 'auto' }}>
                <AnimatePresence>
                  {players.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '15px',
                        borderRadius: '16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '3rem' }}>{p.emoji}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '10px' }}>{p.name}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {gameState === 'role_reveal' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel"
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
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
      )}

      {gameState === 'questioning' && (
        <motion.div
          key={`turn-${turnState.askerIndex}`}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="glass-panel"
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <h1 style={{ fontSize: '3rem', color: 'var(--text)' }}>
            <span style={{ color: 'var(--primary)', fontSize: '4rem' }}>{players[turnState.askerIndex]?.name} {players[turnState.askerIndex]?.emoji}</span>
            <br />
            {t('ask_a_question')} {t('to')}
            <br />
            <span style={{ color: 'var(--secondary)', fontSize: '4rem' }}>{players[turnState.answererIndex]?.name} {players[turnState.answererIndex]?.emoji}</span>
          </h1>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            style={{ marginTop: '60px' }}
            onClick={nextTurn}
          >
            Next Turn
          </motion.button>
        </motion.div>
      )}

      {gameState === 'voting' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel"
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
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
      )}

      {/* Leaderboard State + Interstitial Ad */}
      {gameState === 'leaderboard' && (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '40px', gap: '40px', boxSizing: 'border-box' }}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel"
            style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '40px' }}>{t('leaderboard')}</h1>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '24px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>{t('imposter_was')}</h2>
              <div style={{ fontSize: '5rem', margin: '20px 0' }}>
                {players.find(p => p.id === gameConfig.imposterId)?.emoji}
              </div>
              <h3 style={{ fontSize: '2rem' }}>{players.find(p => p.id === gameConfig.imposterId)?.name}</h3>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
              style={{ marginTop: '20px', padding: '15px 40px', fontSize: '1.5rem', alignSelf: 'center' }}
              onClick={() => broadcastStateChange('lobby')}
            >
              {t('next_game')}
            </motion.button>
          </motion.div>

          {/* Interstitial Ad Space */}
          <div style={{ width: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden' }}>
            <AdBanner
              slotId="7632905010"
              style={{ width: '300px', height: '600px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
