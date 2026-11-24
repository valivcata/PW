import type { ReactNode } from 'react';
import { Alert, Box, Button, Card, Grid, Skeleton, Stack, Typography } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import type { EventSummary } from '../api/types';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n/i18n';
import { defaultGridSize, fourUpGridSize } from '../lib/grid';
import { EventCard } from './EventCard';
import { Reveal } from './Reveal';

/** Placeholder with the same shape and height as EventCard, so nothing jumps when data arrives. */
function EventCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" height={190} animation="wave" />
      <Stack spacing={1.25} sx={{ p: 2 }}>
        <Skeleton width="85%" height={24} />
        <Skeleton width="45%" height={18} />
        <Skeleton width="60%" height={18} />
        <Stack direction="row" sx={{ pt: 0.5, alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton width={70} height={18} />
          <Skeleton variant="circular" width={32} height={32} />
        </Stack>
      </Stack>
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2, color: 'text.secondary' }}>
      <EventBusyIcon sx={{ fontSize: 56, mb: 1, opacity: 0.6 }} />
      <Typography variant="h6" color="text.primary" gutterBottom>
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

export function EventGrid({
  events,
  isLoading,
  error,
  onRetry,
  empty,
  dimmed,
  gridSize = defaultGridSize,
}: {
  events: EventSummary[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty: ReactNode;
  /** Render cards slightly faded (e.g. past events). */
  dimmed?: boolean;
  /** Column sizes per breakpoint. */
  gridSize?: Record<string, number>;
}) {
  const { t } = useI18n();

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )
        }
      >
        {errorMessage(error, t)}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Grid container spacing={2.5}>
        {Array.from({ length: gridSize === fourUpGridSize ? 4 : 8 }, (_, i) => (
          <Grid key={i} size={gridSize}>
            <EventCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!events?.length) return <>{empty}</>;

  return (
    <Grid container spacing={2.5}>
      {events.map((e, i) => (
        <Grid key={e.id} size={gridSize}>
          {/* Stagger cards across a row as they scroll into view. */}
          <Reveal delay={(i % 4) * 80}>
            <EventCard event={e} dimmed={dimmed} />
          </Reveal>
        </Grid>
      ))}
    </Grid>
  );
}
