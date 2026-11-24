import { describe, expect, it } from 'vitest';
import { en, ro, type MessageKey } from './messages';
import { translate } from './i18n';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('messages', () => {
  it('Romanian has exactly the English keys', () => {
    expect(Object.keys(ro).sort()).toEqual(Object.keys(en).sort());
  });

  it('every translation is non-empty and uses the same placeholders', () => {
    for (const key of Object.keys(en) as MessageKey[]) {
      expect(ro[key].trim(), key).not.toBe('');
      expect(placeholders(ro[key]), key).toEqual(placeholders(en[key]));
    }
  });
});

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'home.count.other', { count: 7 })).toBe('7 events');
    expect(translate('ro', 'home.count.other', { count: 7 })).toBe('7 evenimente');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'home.within', { km: 5 })).toBe('Within 5 km of {place}');
  });
});
