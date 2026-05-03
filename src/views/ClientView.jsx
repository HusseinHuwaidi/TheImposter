import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AdBanner from '../components/AdBanner';

const EMOJIS = ['😎', '🤠', '👽', '👻', '🤖', '💩', '🦄', '🦖'];
const AVATARS = ['boy', 'girl', 'bear', 'cat']; // We can map these to images later

export default function ClientView() {
  const [pin, setPin] = useState(new URLSearchParams(window.location.search).get('pin') || '');
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [phase, setPhase] = useState('join'); // join, profile, waiting, game
  const [roomChannel, setRoomChannel] = useState(null);

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
      
      const channel = supabase.channel(`room:${pin}`);
      
      channel.on('broadcast', { event: 'state_change' }, (payload) => {
        const { gameState } = payload.payload;
        if (gameState === 'game') setPhase('game');
        if (gameState === 'leaderboard') setPhase('waiting');
        if (gameState === 'lobby') setPhase('waiting');
      });

      channel.on('presence', { event: 'sync' }, () => {
        // Presence sync handler
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: Math.random().toString(36).substr(2, 9), // simple unique ID
            name: name,
            emoji: selectedEmoji
          });
        }
      });

      setRoomChannel(channel);
    }
  };

  return (
    <div className="view-client">
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
            <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '40px', color: 'var(--primary)' }}>Play Now!</h1>
            <input 
              type="number" 
              className="input-premium" 
              placeholder="Game PIN" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ marginBottom: '20px' }}
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
              onClick={handleJoin}
            >
              Enter
            </motion.button>
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
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Who are you?</h2>
            <input 
              type="text" 
              className="input-premium" 
              placeholder="Nickname" 
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

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-accent"
              onClick={handleReady}
              disabled={!name || !selectedEmoji}
              style={{ opacity: (!name || !selectedEmoji) ? 0.5 : 1 }}
            >
              I'm Ready!
            </motion.button>
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
            <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', textAlign: 'center' }}>You're in!</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Look at the TV...</p>
            
            {/* Dev skip button */}
            <button style={{marginTop: '50px', background: 'transparent', border: 'none', color: 'white'}} onClick={() => setPhase('game')}>[Dev: Start Game]</button>
          </motion.div>
        )}

        {/* Game Phase (Controller) */}
        {phase === 'game' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Select the Imposter!</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              {/* Mock controller buttons */}
              {['Red', 'Blue', 'Green', 'Yellow'].map((color, i) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: ['#FF4B4B', '#4B96FF', '#4BFF96', '#FFD14B'][i],
                    border: 'none',
                    borderRadius: '24px',
                    color: i === 3 ? 'black' : 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.2)'
                  }}
                  onClick={() => setPhase('waiting')}
                >
                  {color}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Ad Banner at the bottom */}
      <div className="ad-banner" style={{ overflow: 'hidden' }}>
        <AdBanner 
          slotId="YOUR_BANNER_SLOT_ID" 
          style={{ width: '100%', height: '60px' }} 
        />
      </div>
    </div>
  );
}
