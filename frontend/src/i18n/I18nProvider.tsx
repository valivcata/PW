import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, translate, type I18nValue } from './i18n';
import { LANGUAGES, LOCALES, type Language } from './messages';

const STORAGE_KEY = 'gatherly.lang';

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as string[]).includes(stored)) return stored as Language;
  } catch {
    // storage unavailable
  }
  // English by default; Romanian is one click away in the top bar.
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, 'app.title');
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      locale: LOCALES[lang],
      setLang: (next) => {
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // ignore
        }
        setLangState(next);
      },
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
