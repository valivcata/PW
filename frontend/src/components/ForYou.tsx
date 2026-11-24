import { useQuery } from '@tanstack/react-query';
import { Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { eventsApi } from '../api/endpoints';
import { useI18n } from '../i18n/i18n';
import { categoryMeta } from '../lib/categories';
import { fourUpGridSize } from '../lib/grid';
import { tokens } from '../theme/theme';
import { EventGrid } from './EventGrid';

/** "For you" row on the home page: upcoming events in the categories the user engages with most. */
export function ForYou() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ['me', 'recommended'],
    queryFn: () => eventsApi.recommended(4),
  });

  // Hide quietly while loading, on error, or when there's nothing new to suggest.
  if (!data || data.items.length === 0) return null;

  const because = data.basedOn.map((c) => t(categoryMeta(c).labelKey)).join(', ');

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ color: tokens.pink }} />
          <Typography variant="h2" sx={{ fontSize: { xs: 22, md: 28 } }}>
            {t('forYou.title')}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {because ? t('forYou.because', { categories: because }) : t('forYou.popular')}
        </Typography>
      </Stack>
      <EventGrid events={data.items} gridSize={fourUpGridSize} isLoading={false} empty={null} />
    </Stack>
  );
}
