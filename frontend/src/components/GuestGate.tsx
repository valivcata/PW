import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { EventSummary } from '../api/types';
import { useI18n } from '../i18n/i18n';
import { tokens } from '../theme/theme';
import { EventCard } from './EventCard';
import { fourUpGridSize } from '../lib/grid';

/** Sign in / sign up buttons that bring the visitor back to where they were. */
export function AuthButtons({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const { t } = useI18n();
  const location = useLocation();
  const state = { from: location.pathname + location.search };
  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
      <Button variant="contained" size={size} component={RouterLink} to="/login" state={state}>
        {t('nav.signIn')}
      </Button>
      <Button variant="outlined" size={size} component={RouterLink} to="/register" state={state}>
        {t('nav.signUp')}
      </Button>
    </Stack>
  );
}

/** Height of the blurred teaser row; the prompt overlaps its lower part. */
const TEASER_HEIGHT = 340;
const PROMPT_OVERLAP = 210;

/**
 * Teaser shown after the first few events for signed-out visitors:
 * the next events, blurred and fading into the page, with a sign-in prompt over them.
 */
export function GuestGate({ total, teaser }: { total: number; teaser: EventSummary[] }) {
  const { t } = useI18n();
  const hasTeaser = teaser.length > 0;

  return (
    <Box sx={{ position: 'relative', mt: 1 }}>
      {hasTeaser && (
        <Box
          aria-hidden
          inert
          sx={{
            height: TEASER_HEIGHT,
            overflow: 'hidden',
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'blur(5px)',
            opacity: 0.55,
            // Gradual fade to the page background instead of a hard cut.
            maskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,0.6) 35%, transparent 85%)',
          }}
        >
          <Grid container spacing={2.5}>
            {teaser.map((e) => (
              <Grid key={e.id} size={fourUpGridSize}>
                <EventCard event={e} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      <Stack
        spacing={2}
        sx={{
          position: 'relative',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
          pb: { xs: 6, md: 10 },
          ...(hasTeaser
            ? { mt: `-${PROMPT_OVERLAP}px` }
            : { pt: 5, border: 1, borderColor: 'divider', borderRadius: '24px', bgcolor: tokens.surface }),
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: tokens.accentGradient,
            color: tokens.onAccent,
          }}
        >
          <LockOutlinedIcon />
        </Box>
        <Typography variant="h5">{t('guest.moreTitle')}</Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 420 }}>{t('guest.moreText', { count: total })}</Typography>
        <AuthButtons />
      </Stack>
    </Box>
  );
}
