import { createContext, useContext } from 'react';
import { messages, LOCALES, type Language, type MessageKey } from './messages';

export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

export function translate(lang: Language, key: MessageKey, vars?: Vars): string {
  const template: string = messages[lang][key] ?? messages.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export interface I18nValue {
  lang: Language;
  /** BCP-47 locale for Intl formatting (dates, prices). */
  locale: string;
  setLang: (lang: Language) => void;
  t: Translate;
}

export const I18nContext = createContext<I18nValue>({
  lang: 'en',
  locale: LOCALES.en,
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
});

export const useI18n = () => useContext(I18nContext);
