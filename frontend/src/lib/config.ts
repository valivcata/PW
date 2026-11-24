/** How many events a signed-out visitor can browse on the home page before being asked to sign in. */
export const GUEST_EVENT_LIMIT = 4;

/** Contact address shown in the Help dialog and footer. Override with VITE_SUPPORT_EMAIL. */
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'support@gatherly.dev';
