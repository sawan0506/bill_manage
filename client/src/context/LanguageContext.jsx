import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en.js';
import { hi } from '../translations/hi.js';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'hi'; // Default to Hindi for hardware shops, can toggle anytime
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const dictionary = lang === 'hi' ? hi : en;

  const t = (key) => {
    return dictionary[key] || en[key] || key;
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
