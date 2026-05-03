import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CreditsModal({ onClose }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl border border-white/20 p-6 shadow-2xl relative overflow-hidden">
        
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <h2 className="text-3xl font-black text-white text-center mb-6 tracking-wide drop-shadow-md">CREDITS</h2>

        <div className="flex flex-col gap-6">
                
          {/* Music Credits */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl group-hover:scale-110 transition-transform">🎵</div>
              <div>
                <h3 className="text-xl font-bold text-white">Music & Audio</h3>
                <p className="text-sm text-white/50">Retro Tracker Music</p>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed pl-16">
              Authentic 16-bit module tracks provided by <a href="https://keygenmusic.tk" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4">keygenmusic.tk</a>
            </p>
          </div>

          {/* Developers */}
          <div className="space-y-4 text-center z-10 relative">
            <p className="text-white text-2xl font-bold">Hussein Huwaidi</p>
            <p className="text-white text-2xl font-bold">Ali Huwaidi</p>
            <p className="text-white text-2xl font-bold">Ameer Huwaidi</p>
            <p className="text-white text-2xl font-bold">Sakeenah Al-Saihati</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-all active:scale-95"
        >
          {t('BACK')}
        </button>
      </div>
    </div>
  );
}
