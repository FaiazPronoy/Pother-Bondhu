import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../i18n/en';
import bn from '../i18n/bn';

const dicts = { en, bn };

// areas are stored in English, so a post from "Mirpur" is the same place in both languages
const AREA_BN = {
  Badda: 'বাড্ডা', Banani: 'বনানী', Bashundhara: 'বসুন্ধরা', Dhanmondi: 'ধানমন্ডি',
  Gulshan: 'গুলশান', Mirpur: 'মিরপুর', Moghbazar: 'মগবাজার', Mohammadpur: 'মোহাম্মদপুর',
  'Puran Dhaka': 'পুরান ঢাকা', Uttara: 'উত্তরা', Dhaka: 'ঢাকা',
};

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('lang') === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lookup(dicts[lang], 'common.pageTitle');
    try { localStorage.setItem('lang', lang); } catch { /* private mode */ }
  }, [lang]);

  const num = useCallback((n) => Number(n || 0).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN'), [lang]);

  // t('desk.from', { name }) ; a numeric `n` also picks the `_one` form when there is one
  const t = useCallback((key, vars) => {
    let text;
    if (vars && vars.n === 1) text = lookup(dicts[lang], key + '_one');
    if (text == null) text = lookup(dicts[lang], key);
    if (text == null) text = lookup(en, key);
    if (text == null) return key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (_, k) => {
      const v = vars[k];
      return typeof v === 'number' ? num(v) : v ?? '';
    });
  }, [lang, num]);

  const area = useCallback((name) => (lang === 'bn' && AREA_BN[name]) || name, [lang]);

  const ago = useCallback((date) => {
    const s = Math.max(1, Math.floor((Date.now() - new Date(date)) / 1000));
    const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (s < 60) return t('time.now');
    if (m < 60) return t('time.min', { n: m });
    if (h < 24) return t('time.hr', { n: h });
    if (d < 30) return t('time.day', { n: d });
    return new Date(date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [t, lang]);

  // the API answers in English; show its message in Bangla when we know it,
  // or our own fallback when we don't
  const apiError = useCallback((err, fallbackKey) => {
    const said = err?.response?.data?.message || err?.response?.data?.error;
    if (lang === 'en') return said || t(fallbackKey);
    return (said && bn.server[said]) || t(fallbackKey);
  }, [lang, t]);

  const value = useMemo(() => ({
    lang, setLang, toggle: () => setLang((l) => (l === 'en' ? 'bn' : 'en')), t, num, area, ago, apiError,
  }), [lang, t, num, area, ago, apiError]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
