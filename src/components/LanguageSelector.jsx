import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', name: 'English', rtl: false },
  { code: 'ar', flag: '🇸🇦', name: 'العربية', rtl: true },
  { code: 'ja', flag: '🇯🇵', name: '日本語', rtl: false },
  { code: 'zh', flag: '🇨🇳', name: '中文', rtl: false },
  { code: 'ko', flag: '🇰🇷', name: '한국어', rtl: false },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', rtl: false },
  { code: 'fr', flag: '🇫🇷', name: 'Français', rtl: false },
  { code: 'pt', flag: '🇧🇷', name: 'Português', rtl: false },
  { code: 'es', flag: '🇪🇸', name: 'Español', rtl: false }
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language?.split('-')[0]) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 text-2xl hover:scale-110 shadow-lg shadow-black/20 relative z-40"
        title={t('LANGUAGE_SELECT')}
      >
        {currentLang.flag}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-2xl bg-slate-800/90 rounded-3xl border border-white/20 p-8 shadow-2xl relative overflow-hidden"
              >
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                
                <h2 className="text-3xl font-black text-white text-center mb-8 tracking-wide drop-shadow-md relative z-10">{t('LANGUAGE_SELECT') || 'Select Language'}</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all ${lang.code === currentLang.code ? 'bg-cyan-500 text-slate-900 scale-105 shadow-lg shadow-cyan-500/30' : 'bg-white/5 hover:bg-white/15 text-white hover:scale-105'}`}
                    >
                      <span className="text-4xl drop-shadow-sm">{lang.flag}</span>
                      <span className="text-lg font-bold">{lang.name}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="mt-8 w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-all active:scale-95 relative z-10"
                >
                  {t('BACK') || 'Close'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
