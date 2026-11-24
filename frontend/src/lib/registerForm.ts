import type { MessageKey } from '../i18n/messages';

export type RegisterField = 'displayName' | 'email' | 'password' | 'confirm';
export type RegisterValues = Record<RegisterField, string>;

/** Client-side checks mirroring RegisterRequestValidator + the Identity minimum length. */
export function validateRegister(v: RegisterValues): Partial<Record<RegisterField, MessageKey>> {
  const errs: Partial<Record<RegisterField, MessageKey>> = {};
  if (!v.displayName.trim()) errs.displayName = 'auth.err.name';
  else if (v.displayName.length > 100) errs.displayName = 'auth.err.nameLong';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errs.email = 'auth.err.email';
  if (v.password.length < 8) errs.password = 'auth.err.password';
  if (v.confirm !== v.password) errs.confirm = 'auth.err.confirm';
  return errs;
}
