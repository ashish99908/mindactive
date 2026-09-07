import React, { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../i18n/lang.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import './langswitch.css';

export default function LanguageSwitcher() {
  const { lang, setLang, translating } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="lang-switch" ref={ref}>
      <button
        type="button"
        className="lang-btn"
        aria-label="Change language"
        title="Change language"
        onClick={() => setOpen(!open)}
      >
        🌐 {current.native}{translating ? ' …' : ''} <span className="lang-caret">▾</span>
      </button>
      {open && (
        <div className="lang-menu" role="menu">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              className={'lang-item' + (l.code === lang ? ' active' : '')}
              onClick={() => { setLang(l.code); setOpen(false); }}
            >
              <span>{l.native}</span>
              <span className="lang-code">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
