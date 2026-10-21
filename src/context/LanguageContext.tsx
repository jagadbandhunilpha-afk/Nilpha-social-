import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { bn } from '../translations/bn';
import { en } from '../translations/en';

type TranslationKey = keyof typeof bn;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial language MUST be Bengali as specified in Product Vision
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('nilpha_lang');
      return stored === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nilpha_lang', language);
    } catch {
      // Ignore storage errors in restricted contexts
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const t = (key: TranslationKey): string => {
    const dict = language === 'bn' ? bn : en;
    return dict[key] || bn[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
