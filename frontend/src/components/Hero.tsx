import { Box, Button, Container, Stack, Typography } from '@mui/material';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useI18n } from '../i18n/i18n';
import { heroPhoto, heroThumb } from '../lib/images';
import { display, fullBleed, tokens } from '../theme/theme';
import { DuotonePhoto } from './DuotonePhoto';

/** App bar height (see Layout) and the main area's top padding the hero slides under. */
const PULL_UP = { xs: -(60 + 24), md: -(72 + 40) };

/**
 * Full-width landing hero that starts behind the translucent app bar:
 * oversized wide headline on the left, purple-toned B&W photo with scanlines on the right.
 */
export function Hero({ onExplore }: { onExplore: () => void }) {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        ...fullBleed,
        position: 'relative',
        overflow: 'hidden',
        mt: { xs: `${PULL_UP.xs}px`, md: `${PULL_UP.md}px` },
        bgcolor: tokens.bg,
        minHeight: { xs: 640, md: 'min(100vh, 860px)' },
        display: 'flex',
      }}
    >
      {/* Photo layer, faded into the page on the left and bottom. */}
      <DuotonePhoto
        src={heroPhoto}
        position="center 30%"
        sx={{
          left: 'auto',
          width: { xs: '100%', md: '62%' },
          maskImage: {
            xs: 'linear-gradient(180deg, #000 10%, transparent 95%)',
            md: 'linear-gradient(90deg, transparent 0%, #000 38%), linear-gradient(0deg, transparent 0%, #000 22%)',
          },
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
          opacity: { xs: 0.4, md: 1 },
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', display: 'flex' }}>
        <Stack
          sx={{
            flexGrow: 1,
            // Clear the app bar the hero sits under, then lay out headline + intro.
            pt: { xs: '120px', md: '170px' },
            pb: { xs: 5, md: 8 },
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <Typography
            component="h1"
            sx={{
              ...display,
              fontSize: { xs: 30, sm: 46, md: 64, lg: 78 },
              lineHeight: 1.06,
              letterSpacing: '-0.01em',
              maxWidth: 820,
            }}
          >
            <Box component="span" sx={{ display: 'block', pl: { xs: 0, sm: '20%', md: '24%' } }}>
              {t('home.heroLine1')}
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {t('home.heroLine2')}
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {t('home.heroLine3')}
            </Box>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 5 }} sx={{ alignItems: { sm: 'center' } }}>
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
              <Box
                component="img"
                src={heroThumb}
                alt=""
                sx={{ width: 170, height: 124, objectFit: 'cover', borderRadius: '14px' }}
              />
              {/* Second, cropped frame like a film strip. */}
              <Box
                component="img"
                src={heroThumb}
                alt=""
                sx={{ width: 36, height: 124, objectFit: 'cover', objectPosition: 'right', borderRadius: '10px', opacity: 0.6 }}
              />
            </Stack>
            <Stack spacing={2.5} sx={{ alignItems: 'flex-start' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 15, maxWidth: 340, lineHeight: 1.7 }}>
                {t('home.heroIntro')}
              </Typography>
              <Button variant="contained" size="large" onClick={onExplore} endIcon={<NorthEastIcon />}>
                {t('home.heroCta')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
