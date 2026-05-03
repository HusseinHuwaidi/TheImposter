import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

import { supabase } from '../lib/supabase';
import AdBanner from '../components/AdBanner';
import { useTranslation } from 'react-i18next';

const CATEGORIES = {
  "Animals": ["Elephant", "Lion", "Giraffe", "Penguin", "Shark"],
  "Locations": ["Hospital", "School", "Beach", "Space Station", "Supermarket"],
  "Food": ["Pizza", "Sushi", "Hamburger", "Ice Cream", "Salad"],
  "Jobs": ["Doctor", "Teacher", "Police Officer", "Astronaut", "Chef"]
};

export default function HostView() {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // lobby, role_reveal, questioning, voting, leaderboard
  const [roomChannel, setRoomChannel] = useState(null);
  
  // Game Engine States
  const [gameConfig, setGameConfig] = useState({ category: '', word: '', imposterId: null });
  const [turnState, setTurnState] = useState({ askerIndex: 0, answererIndex: 1 });
  const [votes, setVotes] = useState({});

  useEffect(() => {
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
  }, []);

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
      alert("Need at least 3 players to start!");
      return;
    }

    const categoriesList = Object.keys(CATEGORIES);
    const randomCategory = categoriesList[Math.floor(Math.random() * categoriesList.length)];
    const wordsList = CATEGORIES[randomCategory];
    const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];
    
    const randomImposterIndex = Math.floor(Math.random() * players.length);
    const imposterId = players[randomImposterIndex].id;

    const newConfig = { category: randomCategory, word: randomWord, imposterId };
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

  return (
    <div className="view-host">
      {gameState === 'lobby' && (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '2vw', boxSizing: 'border-box' }}>

          {/* Left Side: QR Code & Pin */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="glass-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1 style={{ fontSize: 'min(3rem, 4vh)', marginBottom: 'min(20px, 2vh)', color: 'var(--accent)' }}>{t('join_the_game')}</h1>
              <div style={{ background: 'white', padding: '15px', borderRadius: '24px', display: 'inline-block' }}>
                <QRCodeSVG value={joinUrl} size={180} style={{ width: 'min(256px, 25vh)', height: 'min(256px, 25vh)' }} />
              </div>
              <h2 style={{ fontSize: 'min(2rem, 3vh)', marginTop: 'min(30px, 3vh)' }}>{t('go_to')} <span style={{ color: 'var(--primary)' }}>{window.location.host}</span></h2>
              <h2 style={{ fontSize: 'min(2rem, 3vh)' }}>{t('game_pin')}: <span style={{ fontSize: 'min(4rem, 6vh)', fontWeight: '900', letterSpacing: '4px' }}>{pin}</span></h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
              style={{ marginTop: 'min(40px, 4vh)', fontSize: 'min(1.5rem, 3vh)', padding: '15px 40px' }}
              onClick={startGame}
            >
              {t('start_game')}
            </motion.button>
          </motion.div>

          {/* Right Side: Players List */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                Waiting for players... ({players.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px', overflowY: 'auto' }}>
                <AnimatePresence>
                  {players.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '20px',
                        borderRadius: '16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '3rem' }}>{p.emoji}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '10px' }}>{p.name}</div>
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
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%' }}
        >
          <h1 style={{ fontSize: '4rem', color: 'var(--primary)' }}>{t('look_at_devices')}</h1>
          <p style={{ fontSize: '2rem', marginTop: '20px', color: 'var(--text-muted)' }}>{t('category')}: {gameConfig.category}</p>
          
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
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%' }}
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
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%' }}
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
        <div style={{ display: 'flex', width: '100%', padding: '40px', gap: '40px' }}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel"
            style={{ flex: 1, textAlign: 'center' }}
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
              style={{ marginTop: '20px', padding: '15px 40px', fontSize: '1.5rem' }}
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
