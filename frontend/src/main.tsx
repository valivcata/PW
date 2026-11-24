import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/michroma/400.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import './index.css';
import App from './App';
import { ApiError } from './api/client';
import { AuthProvider } from './auth/AuthProvider';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme/theme';
import { NotifyProvider } from './notify/NotifyProvider';
import { I18nProvider } from './i18n/I18nProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (404, 401, validation); retry network/server errors once.
      retry: (count, err) => count < 1 && !(err instanceof ApiError && err.status >= 400 && err.status < 500),
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotifyProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </NotifyProvider>
        </ThemeProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
