import { useEffect, useState, type ReactElement } from 'react';
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';
import { initials } from '../lib/format';
import { bannerPhoto } from '../lib/images';
import { SUPPORT_EMAIL } from '../lib/config';
import { display, tokens } from '../theme/theme';
import { HelpButton } from './HelpDialog';
import { SmoothScroll } from './SmoothScroll';
import { Reveal } from './Reveal';

const accountLinks: { to: string; labelKey: MessageKey; icon: ReactElement; inTopBar?: boolean }[] = [
  { to: '/me/events', labelKey: 'nav.myEvents', icon: <EventIcon fontSize="small" /> },
  { to: '/me/attending', labelKey: 'nav.attending', icon: <EventAvailableIcon fontSize="small" />, inTopBar: true },
  { to: '/me/favorites', labelKey: 'nav.favorites', icon: <FavoriteIcon fontSize="small" />, inTopBar: true },
  { to: '/profile', labelKey: 'nav.profile', icon: <PersonIcon fontSize="small" /> },
];

function Logo() {
  return (
    <Box
      component={RouterLink}
      to="/"
      sx={{ ...display, fontSize: { xs: 16, md: 18 }, color: 'text.primary', textDecoration: 'none', letterSpacing: '0.06em' }}
    >
      Gatherly
    </Box>
  );
}

const navLinkSx = {
  color: 'text.secondary',
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  position: 'relative',
  py: 0.5,
  transition: 'color .15s',
  '&:hover': { color: 'text.primary' },
  '&.active': { color: 'text.primary' },
  '&.active::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -4,
    height: 2,
    borderRadius: '2px',
    background: tokens.accentGradient,
  },
} as const;

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isHome = location.pathname === '/';
  // On the home page the bar floats transparently over the hero until you scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const solidBar = !isHome || scrolled;

  const handleLogout = () => {
    setMenuAnchor(null);
    setDrawerOpen(false);
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SmoothScroll />
      <AppBar
        position="sticky"
        sx={{
          bgcolor: solidBar ? 'rgba(27, 28, 41, 0.82)' : 'transparent',
          backdropFilter: solidBar ? 'blur(12px)' : 'none',
          borderBottom: 1,
          borderColor: solidBar ? 'divider' : 'transparent',
          transition: 'background-color .3s, border-color .3s, backdrop-filter .3s',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: 60, md: 72 } }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label={t('nav.openMenu')}>
                <MenuIcon />
              </IconButton>
            )}
            <Logo />

            {!isMobile && (
              // The logo is the way home; the centre links are only the signed-in user's pages.
              <Stack direction="row" spacing={4} sx={{ mx: 'auto' }}>
                {isAuthenticated && (
                  <>
                    <Box component={NavLink} to="/me/attending" sx={navLinkSx}>
                      {t('nav.attending')}
                    </Box>
                    <Box component={NavLink} to="/me/favorites" sx={navLinkSx}>
                      {t('nav.favorites')}
                    </Box>
                    <Box component={NavLink} to="/me/events" sx={navLinkSx}>
                      {t('nav.myEvents')}
                    </Box>
                  </>
                )}
              </Stack>
            )}
            {isMobile && <Box sx={{ flexGrow: 1 }} />}

            <Tooltip title={t('nav.language')}>
              <Button
                onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')}
                aria-label={t('nav.language')}
                sx={{ minWidth: 0, px: 1.25, color: 'text.secondary', fontWeight: 600, fontSize: 13 }}
              >
                {lang === 'ro' ? 'EN' : 'RO'}
              </Button>
            </Tooltip>
            <HelpButton />

            {isAuthenticated && user ? (
              <>
                {!isMobile && (
                  <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/events/new" sx={{ ml: 1 }}>
                    {t('nav.createEvent')}
                  </Button>
                )}
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label={t('nav.accountMenu')}>
                  <Avatar
                    src={user.avatarUrl ?? undefined}
                    sx={{ width: 36, height: 36, background: tokens.accentGradient, color: tokens.onAccent, fontSize: 14, fontWeight: 600 }}
                  >
                    {initials(user.displayName)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={!!menuAnchor}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">{user.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  {/* Attending/Favorites/My events live in the top bar (desktop) and the drawer (mobile). */}
                  <MenuItem component={RouterLink} to="/profile" onClick={() => setMenuAnchor(null)}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    {t('nav.profile')}
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    {t('nav.signOut')}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                sx={{
                  ml: { xs: 0.5, sm: 1 },
                  bgcolor: 'common.white',
                  color: tokens.onAccent,
                  px: { xs: 1.75, sm: 2.5 },
                  fontSize: { xs: 13, sm: 14 },
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#e9e7ee' },
                }}
              >
                {t('nav.signIn')}
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280 }} role="navigation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2.5 }}>
            <Logo />
          </Box>
          <Divider />
          <List>
            {isAuthenticated ? (
              <>
                <ListItemButton component={NavLink} to="/events/new">
                  <ListItemIcon>
                    <AddIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.createEvent')} />
                </ListItemButton>
                {accountLinks.map((l) => (
                  <ListItemButton key={l.to} component={NavLink} to={l.to}>
                    <ListItemIcon>{l.icon}</ListItemIcon>
                    <ListItemText primary={t(l.labelKey)} />
                  </ListItemButton>
                ))}
                <Divider sx={{ my: 1 }} />
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.signOut')} />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={NavLink} to="/login">
                  <ListItemIcon>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.signIn')} />
                </ListItemButton>
                <ListItemButton component={NavLink} to="/register">
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.signUp')} />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      {/* The photo banner belongs to the landing page only; other pages get the plain footer. */}
      <Footer showCta={isHome} />
    </Box>
  );
}

function Footer({ showCta }: { showCta: boolean }) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [year] = useState(() => new Date().getFullYear());

  const footLink = { color: 'text.secondary', fontSize: 14, textDecoration: 'none', '&:hover': { color: 'text.primary' } };

  return (
    <Box component="footer" sx={{ mt: 4 }}>
      {showCta && (
        // Full-width photo banner (no card), content aligned to the page container.
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: 320, md: 380 },
            display: 'flex',
            alignItems: 'center',
            mb: 6,
            backgroundImage: `linear-gradient(90deg, rgba(27,28,41,0.25) 0%, rgba(27,28,41,0.9) 62%), linear-gradient(180deg, ${tokens.bg} 0%, rgba(27,28,41,0.6) 20%, rgba(27,28,41,0) 45%, rgba(27,28,41,0) 75%, ${tokens.bg} 100%), url(${bannerPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          <Reveal y={40}>
            <Stack spacing={2} sx={{ maxWidth: 440, py: 6, alignItems: { xs: 'flex-start', md: 'center' }, textAlign: { md: 'center' } }}>
              <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 } }}>
                {t('footer.ctaTitle')}
              </Typography>
              <Typography color="text.secondary">{t('footer.ctaText')}</Typography>
              <Button
                variant="contained"
                component={RouterLink}
                to={isAuthenticated ? '/events/new' : '/register'}
                endIcon={<NorthEastIcon />}
              >
                {t('nav.createEvent')}
              </Button>
            </Stack>
          </Reveal>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ pb: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Logo />
            <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 320, fontSize: 14 }}>
              {t('app.tagline')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.primary', fontSize: 11 }}>
              {t('footer.explore')}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Link component={RouterLink} to="/?free=1" state={{ scrollTo: 'events' }} sx={footLink}>
                {t('home.freeOnly')}
              </Link>
              <Link component={RouterLink} to="/events/new" sx={footLink}>
                {t('nav.createEvent')}
              </Link>
            </Stack>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.primary', fontSize: 11 }}>
              {t('footer.account')}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {isAuthenticated ? (
                <>
                  <Link component={RouterLink} to="/me/events" sx={footLink}>
                    {t('nav.myEvents')}
                  </Link>
                  <Link component={RouterLink} to="/me/attending" sx={footLink}>
                    {t('nav.attending')}
                  </Link>
                  <Link component={RouterLink} to="/profile" sx={footLink}>
                    {t('nav.profile')}
                  </Link>
                </>
              ) : (
                <>
                  <Link component={RouterLink} to="/login" sx={footLink}>
                    {t('nav.signIn')}
                  </Link>
                  <Link component={RouterLink} to="/register" sx={footLink}>
                    {t('nav.signUp')}
                  </Link>
                </>
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.primary', fontSize: 11 }}>
              {t('footer.contact')}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Timișoara, România</Typography>
              <Link href={`mailto:${SUPPORT_EMAIL}`} sx={footLink}>
                {SUPPORT_EMAIL}
              </Link>
            </Stack>
          </Grid>
        </Grid>
        <Divider />
        <Typography sx={{ py: 3, color: 'text.secondary', fontSize: 13, textAlign: { xs: 'left', md: 'right' } }}>
          {t('footer.rights', { year })}
        </Typography>
      </Container>
    </Box>
  );
}
