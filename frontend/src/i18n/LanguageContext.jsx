import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSavedLang, saveLangPref, initTranslation, loadCache, onChange,
  register, lookup, isBusy, hasVars,
} from './lang.js';
import { startDomTranslation, stopDomTranslation } from './domTranslate.js';

const LangContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (s) => s,
  translating: false,
});

export const interpolate = (str, vars) =>
  (!vars ? str : str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)));

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(getSavedLang);
  const [, force] = useState(0);

  useEffect(() => {
    initTranslation(lang);
    loadCache(lang); // warm module cache
    document.documentElement.lang = lang;
    // Translate rendered text outside t() (game internals) via DOM observer.
    if (lang === 'en') stopDomTranslation();
    else startDomTranslation();
    return onChange(() => force((n) => n + 1));
  }, [lang]);

  const setLang = useCallback((next) => {
    saveLangPref(next);
    setLangState(next);
  }, []);

  // t(englishString, {vars}) — translates at runtime, cached in localStorage.
  const t = useCallback((str, vars) => {
    if (!str) return str;
    if (lang === 'en') return interpolate(str, vars);
    const out = lookup(str);
    if (out === undefined) {
      register([str]); // queued → cached → UI re-renders with translation
      return interpolate(str, vars);
    }
    if (out === '') return interpolate(str, vars); // earlier failure — keep English
    return interpolate(out, vars);
  }, [lang]);

  const value = { lang, setLang, t, translating: isBusy(), hasVars };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);
