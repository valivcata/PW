import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import { I18nContext, translate } from '../i18n/i18n';
import { LOCALES, type Language } from '../i18n/messages';
import { AuthProvider } from '../auth/AuthProvider';
import { NotifyProvider } from '../notify/NotifyProvider';

/** Renders `ui` with every app provider. Extra `routes` let tests assert on navigation. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', lang = 'en', routes }: { route?: string; lang?: Language; routes?: Record<string, ReactNode> } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const i18n = { lang, locale: LOCALES[lang], setLang: () => {}, t: (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(lang, k, v) };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <I18nContext.Provider value={i18n}>
          <ThemeProvider theme={createTheme()}>
            <NotifyProvider>
              <AuthProvider>
                <Routes>
                  <Route path={route.split('?')[0]} element={ui} />
                  {Object.entries(routes ?? {}).map(([path, el]) => (
                    <Route key={path} path={path} element={el} />
                  ))}
                </Routes>
              </AuthProvider>
            </NotifyProvider>
          </ThemeProvider>
        </I18nContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Minimal fetch Response stand-in. */
export function jsonResponse(body: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
