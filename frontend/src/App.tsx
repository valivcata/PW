import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Layout } from './components/Layout';
import { RequireAuth } from './auth/RequireAuth';
import { EventsPage } from './pages/EventsPage';

// Route-level code splitting: the home page loads eagerly, the rest (incl. Leaflet) on demand.
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const EventFormPage = lazy(() => import('./pages/EventFormPage').then((m) => ({ default: m.EventFormPage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const MePage = lazy(() => import('./pages/MePage').then((m) => ({ default: m.MePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function Page({ children, auth }: { children: ReactNode; auth?: boolean }) {
  const content = (
    <Suspense
      fallback={
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      }
    >
      {children}
    </Suspense>
  );
  return auth ? <RequireAuth>{content}</RequireAuth> : content;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EventsPage />} />
        <Route path="events/new" element={<Page auth><EventFormPage /></Page>} />
        <Route path="events/:id" element={<Page><EventDetailPage /></Page>} />
        <Route path="events/:id/edit" element={<Page auth><EventFormPage /></Page>} />
        <Route path="login" element={<Page><LoginPage /></Page>} />
        <Route path="register" element={<Page><RegisterPage /></Page>} />
        <Route path="me/:tab?" element={<Page auth><MePage /></Page>} />
        <Route path="profile" element={<Page auth><ProfilePage /></Page>} />
        <Route path="*" element={<Page><NotFoundPage /></Page>} />
      </Route>
    </Routes>
  );
}
