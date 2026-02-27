import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, Language, Translations } from './translations';

interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('mk');

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'mk' ? 'en' : 'mk'));
  }, []);

  return (
    <I18nContext.Provider value={{ language, t: translations[language], setLanguage, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
