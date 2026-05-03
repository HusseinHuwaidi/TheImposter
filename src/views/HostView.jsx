import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

import { supabase } from '../lib/supabase';

export default function HostView() {
  const [pin, setPin] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // lobby, game, leaderboard
  const [roomChannel, setRoomChannel] = useState(null);

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
      .subscribe();

    setRoomChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const broadcastStateChange = async (newState) => {
    setGameState(newState);
    if (roomChannel) {
      await roomChannel.send({
        type: 'broadcast',
        event: 'state_change',
        payload: { gameState: newState },
      });
    }
  };

  const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const joinUrl = `${publicUrl}/play?pin=${pin}`;

  return (
    <div className="view-host">
      {gameState === 'lobby' && (
        <div style={{ display: 'flex', width: '100%', padding: '40px' }}>
          
          {/* Left Side: QR Code & Pin */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: 'var(--accent)' }}>Join the Game!</h1>
              <div style={{ background: 'white', padding: '20px', borderRadius: '24px', display: 'inline-block' }}>
                <QRCodeSVG value={joinUrl} size={256} />
              </div>
              <h2 style={{ fontSize: '2rem', marginTop: '30px' }}>Go to <span style={{ color: 'var(--primary)' }}>{window.location.host}</span></h2>
              <h2 style={{ fontSize: '2rem' }}>Game PIN: <span style={{ fontSize: '4rem', fontWeight: '900', letterSpacing: '4px' }}>{pin}</span></h2>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
              style={{ marginTop: '40px', fontSize: '1.5rem', padding: '20px 60px' }}
              onClick={() => broadcastStateChange('game')}
            >
              Start Game
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

      {/* Game State Placeholder */}
      {gameState === 'game' && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel"
          style={{ margin: 'auto', textAlign: 'center', maxWidth: '800px', width: '100%' }}
        >
          <h1 style={{ fontSize: '4rem', color: 'var(--primary)' }}>Who is the Imposter?</h1>
          <p style={{ fontSize: '2rem', marginTop: '20px', color: 'var(--text-muted)' }}>Look at your devices!</p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-accent"
            style={{ marginTop: '60px' }}
            onClick={() => broadcastStateChange('leaderboard')}
          >
            End Round
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
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '40px' }}>Leaderboard</h1>
            {/* Mock Leaderboard */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '2.5rem', marginRight: '20px' }}>🥇</div>
              <div style={{ fontSize: '2rem', flex: 1, textAlign: 'left' }}>Ali 😎</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>3 Correct</div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
              style={{ marginTop: '40px' }}
              onClick={() => broadcastStateChange('lobby')}
            >
              Next Game
            </motion.button>

          </motion.div>
          
          {/* Ad Placeholder Space */}
          <div style={{ width: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ color: 'var(--text-muted)' }}>Advertisement</span>
            <div style={{ marginTop: '20px', width: '250px', height: '250px', border: '2px dashed rgba(255,255,255,0.2)' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
