import type { ReactNode } from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { display, tokens } from '../theme/theme';

/** Page title block used by form-style pages: small accent overline, wide display title, muted intro. */
export function PageHeader({
  overline,
  title,
  subtitle,
  action,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 2, pb: { xs: 3, md: 4 } }}
    >
      <Box>
        {overline && (
          <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.pink, mb: 1.5 }}>
            {overline}
          </Typography>
        )}
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 44 } }}>
          {title}
        </Typography>
        {subtitle && <Typography sx={{ color: 'text.secondary', mt: 1.5, maxWidth: 560 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}

/**
 * Editorial form section: a numbered label column on the left, fields on the right,
 * separated from the previous section by a hairline.
 */
export function FormSection({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Grid container spacing={{ xs: 2, md: 5 }} sx={{ borderTop: 1, borderColor: 'divider', py: { xs: 3.5, md: 5 } }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack direction={{ xs: 'row', md: 'column' }} spacing={{ xs: 1.5, md: 1 }} sx={{ alignItems: { xs: 'baseline', md: 'flex-start' } }}>
          <Box sx={{ ...display, fontSize: { xs: 14, md: 30 }, background: tokens.accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {String(index).padStart(2, '0')}
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontSize: { xs: 15, md: 17 } }}>
            {title}
          </Typography>
        </Stack>
        {description && (
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1, display: { xs: 'none', md: 'block' } }}>{description}</Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>{children}</Grid>
    </Grid>
  );
}
