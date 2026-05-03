import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AdBanner from '../components/AdBanner';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import { ShinyButton } from '../components/ui/ShinyButton';
import { AnimatedGridPattern } from '../components/ui/AnimatedGridPattern';
import { TextReveal } from '../components/ui/TextReveal';
import { MagneticButton } from '../components/ui/MagneticButton';

const EMOJIS = ['😎', '🤠', '👽', '👻', '🤖', '💩', '🦄', '🦖'];
const AVATARS = ['boy', 'girl', 'bear', 'cat']; // We can map these to images later

export default function ClientView() {
  const { i18n, t } = useTranslation();
  const [pin, setPin] = useState(new URLSearchParams(window.location.search).get('pin') || '');
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [phase, setPhase] = useState('join'); // join, profile, waiting, role_reveal, questioning, voting
  const [roomChannel, setRoomChannel] = useState(null);
  
  const [myId, setMyId] = useState('');
  const [gameConfig, setGameConfig] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    return () => {
      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [roomChannel]);

  const handleJoin = () => {
    if (pin.length === 6) setPhase('profile');
  };

  const handleReady = async () => {
    if (name && selectedEmoji) {
      setPhase('waiting');
      const uniqueId = Math.random().toString(36).substr(2, 9);
      setMyId(uniqueId);

      const channel = supabase.channel(`room:${pin}`);

      channel.on('broadcast', { event: 'state_change' }, (payload) => {
        const { gameState, gameConfig, players } = payload.payload;
        if (gameConfig) setGameConfig(gameConfig);
        if (players) setPlayers(players);
        
        if (gameState === 'role_reveal') setPhase('role_reveal');
        if (gameState === 'questioning') setPhase('questioning');
        if (gameState === 'voting') setPhase('voting');
        if (gameState === 'leaderboard') setPhase('waiting');
        if (gameState === 'lobby') {
          setPhase('waiting');
          setGameConfig(null);
        }
      });

      channel.on('presence', { event: 'sync' }, () => {
        // Presence sync handler
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: uniqueId,
            name: name,
            emoji: selectedEmoji
          });
        }
      });

      setRoomChannel(channel);
    }
  };

  const lang = i18n.language?.split('-')[0] || 'en';

  const getSubjectDisplay = (subjectObj) => {
    if (!subjectObj) return '';
    if (subjectObj.isCustom) return `${subjectObj.emoji} ${subjectObj.names.custom}`;
    return `${subjectObj.emoji} ${subjectObj.names[lang] || subjectObj.names['en']}`;
  };

  const isImposter = gameConfig?.imposterId === myId;
  const showDecoy = isImposter && gameConfig?.hardMode;
  
  // What to show on the reveal screen
  const subjectToDisplay = showDecoy ? gameConfig?.decoySubject : gameConfig?.subject;
  const isImposterAware = isImposter && !gameConfig?.hardMode;

  return (
    <div className="view-client relative overflow-hidden h-full w-full">
      <AnimatedGridPattern className="text-pink-500/10 z-0" maxOpacity={0.2} />
      
      <div className="absolute top-4 start-4 z-50">
        <LanguageSelector />
      </div>

      <AnimatePresence mode="wait">
        {/* Join Phase */}
        {phase === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-center mb-10 text-primary">
              <TextReveal text={t('play_now') || 'Play Now!'} className="justify-center" />
            </h1>
            <input
              type="number"
              className="input-premium mb-6 z-10"
              placeholder={t('game_pin') || 'Game PIN'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <ShinyButton
              className="w-full text-xl z-10"
              onClick={handleJoin}
            >
              {t('enter') || 'Enter'}
            </ShinyButton>
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <Link to="/host" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem', transition: 'opacity 0.2s' }}>
                Want to host a game? <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Click here</span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Profile Phase */}
        {phase === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{t('who_are_you') || 'Who are you?'}</h2>
            <input
              type="text"
              className="input-premium"
              placeholder={t('nickname') || 'Nickname'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="emoji-grid">
              {EMOJIS.map(emoji => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            <ShinyButton
              className="w-full text-xl z-10"
              onClick={handleReady}
              disabled={!name || !selectedEmoji}
              style={{ opacity: (!name || !selectedEmoji) ? 0.5 : 1 }}
            >
              {t('im_ready') || "I'm Ready!"}
            </ShinyButton>
          </motion.div>
        )}

        {/* Waiting Phase */}
        {phase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ fontSize: '6rem', marginBottom: '20px' }}
            >
              {selectedEmoji}
            </motion.div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', textAlign: 'center' }}>{t('youre_in') || "You're in!"}</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>{t('look_at_tv')}</p>
          </motion.div>
        )}

        {phase === 'role_reveal' && (
          <motion.div
            key="role_reveal"
            initial={{ scale: 0.1, opacity: 0, rotate: -10 }}
            animate={
              isImposterAware 
                ? { scale: 1, opacity: 1, rotate: [-5, 5, -5, 5, 0], x: [-10, 10, -10, 10, 0] } // Screen shake for imposter
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="flex-1 flex flex-col justify-center items-center text-center p-6 z-10"
          >
            {isImposterAware ? (
              <>
                <h1 style={{ fontSize: '2.5rem', color: '#FF4B4B', marginBottom: '20px', whiteSpace: 'pre-line' }}>{t('YOU_ARE_IMPOSTER') || t('you_are_imposter')}</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{t('IMPOSTER_DESCRIPTION') || t('shhh')}</p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>{t('YOU_KNOW_SUBJECT') || t('secret_word')}</h2>
                <h1 style={{ fontSize: '3rem', color: 'var(--success)', marginTop: '20px', marginBottom: '20px' }}>{getSubjectDisplay(subjectToDisplay)}</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{t('REMEMBER_SUBJECT') || 'Remember it! Don\'t say it out loud.'}</p>
              </>
            )}
          </motion.div>
        )}

        {phase === 'questioning' && (
          <motion.div
            key="questioning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
          >
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>{t('look_at_tv')}</h2>
          </motion.div>
        )}

        {phase === 'voting' && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2rem', color: 'var(--accent)' }}>{t('select_imposter') || 'Select the Imposter!'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              {players.filter(p => p.id !== myId || gameConfig?.hardMode).map((p, i) => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: ['#FF4B4B', '#4B96FF', '#4BFF96', '#FFD14B', '#9D4BFF', '#FF8C4B'][i % 6],
                    border: 'none',
                    borderRadius: '24px',
                    color: ['#4BFF96', '#FFD14B'].includes(['#FF4B4B', '#4B96FF', '#4BFF96', '#FFD14B', '#9D4BFF', '#FF8C4B'][i % 6]) ? 'black' : 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                  onClick={() => {
                    if (roomChannel) {
                      roomChannel.send({
                        type: 'broadcast',
                        event: 'vote',
                        payload: { voterId: myId, votedForId: p.id }
                      });
                    }
                    setPhase('waiting');
                  }}
                >
                  <span style={{ fontSize: '3rem', marginBottom: '10px' }}>{p.emoji}</span>
                  {p.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Ad Banner at the bottom */}
      <div className="ad-banner relative flex items-center justify-center overflow-hidden" style={{ width: '100%', height: '60px' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <span className="text-xs tracking-widest uppercase font-bold text-white/50">Sponsored Space</span>
        </div>
        <div className="relative z-10 w-full h-full">
          <AdBanner
            slotId="2412367923"
            style={{ width: '100%', height: '60px' }}
          />
        </div>
      </div>
    </div>
  );
}
