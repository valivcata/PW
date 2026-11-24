import { useState } from 'react';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExploreIcon from '@mui/icons-material/Explore';
import { eventsApi } from '../api/endpoints';
import type { EventSummary } from '../api/types';
import { EmptyState, EventGrid } from '../components/EventGrid';
import { splitByTime } from '../lib/eventFilters';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';

interface TabConfig {
  labelKey: MessageKey;
  fetch: () => Promise<EventSummary[]>;
  emptyTitle: MessageKey;
  emptyText: MessageKey;
  action: 'create' | 'discover';
  /** Whether the endpoint can return events that already ended (attending only returns upcoming ones). */
  hasPast: boolean;
}

const tabs: Record<string, TabConfig> = {
  events: {
    labelKey: 'nav.myEvents',
    fetch: eventsApi.mine,
    emptyTitle: 'me.empty.events',
    emptyText: 'me.empty.eventsText',
    action: 'create',
    hasPast: true,
  },
  attending: {
    labelKey: 'nav.attending',
    fetch: eventsApi.attending,
    emptyTitle: 'me.empty.attending',
    emptyText: 'me.empty.attendingText',
    action: 'discover',
    hasPast: false,
  },
  favorites: {
    labelKey: 'nav.favorites',
    fetch: eventsApi.favorites,
    emptyTitle: 'me.empty.favorites',
    emptyText: 'me.empty.favoritesText',
    action: 'discover',
    hasPast: true,
  },
};

type TabKey = keyof typeof tabs;

export function MePage() {
  const { tab } = useParams();
  if (!tab || !(tab in tabs)) return <Navigate to="/me/events" replace />;
  return <MeTabs key={tab} tab={tab as TabKey} />;
}

function MeTabs({ tab }: { tab: TabKey }) {
  const { t } = useI18n();
  const config = tabs[tab];
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [now] = useState(() => Date.now());
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['me', tab],
    queryFn: () => config.fetch(),
  });

  const { upcoming, past } = splitByTime(data ?? [], now);
  const shown = config.hasPast && when === 'past' ? past : upcoming;

  const action =
    config.action === 'create' ? (
      <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
        {t('nav.createEvent')}
      </Button>
    ) : (
      <Button variant="contained" startIcon={<ExploreIcon />} component={RouterLink} to="/">
        {t('me.discover')}
      </Button>
    );

  return (
    <Stack spacing={3}>
      {/* The navbar already switches between My events / Attending / Favorites, so no tabs here. */}
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
          <Typography variant="h4" component="h1">
            {t(config.labelKey)}
          </Typography>
          {data && (
            <Typography sx={{ color: 'text.secondary', fontSize: 15 }}>
              {data.length === 1 ? t('home.count.one') : t('home.count.other', { count: data.length })}
            </Typography>
          )}
        </Stack>
        {config.action === 'create' && (
          <Button variant="outlined" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
            {t('me.newEvent')}
          </Button>
        )}
      </Stack>

      {config.hasPast && (
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={when}
          onChange={(_, v) => v && setWhen(v)}
          sx={{ alignSelf: 'flex-start' }}
        >
          <ToggleButton value="upcoming">
            {t('me.upcoming')}
            {data ? ` (${upcoming.length})` : ''}
          </ToggleButton>
          <ToggleButton value="past">
            {t('me.past')}
            {data ? ` (${past.length})` : ''}
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      <EventGrid
        events={shown}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        dimmed={config.hasPast && when === 'past'}
        empty={
          config.hasPast && when === 'past' ? (
            <EmptyState title={t('me.empty.past')} description={t('me.empty.pastText')} />
          ) : (
            <EmptyState title={t(config.emptyTitle)} description={t(config.emptyText)} action={action} />
          )
        }
      />
    </Stack>
  );
}
