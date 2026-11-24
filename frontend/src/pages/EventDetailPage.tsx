import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import SellIcon from '@mui/icons-material/Sell';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import { eventsApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { RsvpStatus, type EventDetail } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';
import { categoryMeta } from '../lib/categories';
import { formatPrice, formatRange, initials } from '../lib/format';
import { DateBlock, EventImage } from '../components/EventCard';
import { tokens } from '../theme/theme';
import { EventMap } from '../components/EventMap';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AddToCalendar } from '../components/AddToCalendar';
import { AuthButtons } from '../components/GuestGate';
import { isFree } from '../lib/eventFilters';

const roundGlass = {
  bgcolor: 'rgba(27,28,41,0.6)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${tokens.border}`,
  '&:hover': { bgcolor: 'rgba(27,28,41,0.85)' },
};

const rsvpStatusKey: Record<RsvpStatus, MessageKey> = {
  [RsvpStatus.Going]: 'event.rsvpStatus.going',
  [RsvpStatus.Interested]: 'event.rsvpStatus.interested',
  [RsvpStatus.NotGoing]: 'event.rsvpStatus.notGoing',
};

export function EventDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { t, locale } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [now] = useState(() => Date.now());

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const requireLogin = () => navigate('/login', { state: { from: location.pathname } });

  const rsvp = useMutation({
    mutationFn: async (status: RsvpStatus | null) => {
      if (status === null) await eventsApi.removeRsvp(id);
      else await eventsApi.rsvp(id, status);
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      invalidateLists();
      notify(status === null ? t('event.rsvpRemoved') : t(rsvpStatusKey[status]));
    },
    onError: (err) => notify(errorMessage(err, t), 'error'),
  });

  const favorite = useMutation({
    mutationFn: async (fav: boolean) => {
      if (fav) await eventsApi.favorite(id);
      else await eventsApi.unfavorite(id);
      return fav;
    },
    onMutate: async (fav) => {
      await queryClient.cancelQueries({ queryKey: ['event', id] });
      const prev = queryClient.getQueryData<EventDetail>(['event', id]);
      if (prev) queryClient.setQueryData<EventDetail>(['event', id], { ...prev, isFavorite: fav });
      return { prev };
    },
    onError: (err, _fav, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['event', id], ctx.prev);
      notify(errorMessage(err, t), 'error');
    },
    onSuccess: (fav) => {
      queryClient.invalidateQueries({ queryKey: ['me', 'favorites'] });
      notify(fav ? t('event.favorited') : t('event.unfavorited'));
    },
  });

  const remove = useMutation({
    mutationFn: () => eventsApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['event', id] });
      invalidateLists();
      notify(t('event.deleted'));
      navigate('/me/events', { replace: true });
    },
    onError: (err) => {
      setConfirmDelete(false);
      notify(errorMessage(err, t), 'error');
    },
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify(t('event.linkCopied'), 'info');
      }
    } catch {
      // user cancelled the share sheet
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={320} />
        <Skeleton width="60%" height={48} />
        <Skeleton width="40%" />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    );
  }

  if (error || !event) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" component={RouterLink} to="/">
            {t('common.backToEvents')}
          </Button>
        }
      >
        {error ? errorMessage(error, t) : t('event.notFound')}
      </Alert>
    );
  }

  const meta = categoryMeta(event.category);
  const price = formatPrice(event.price, locale, t('common.free'), isFree(event));
  const isOwner = !!user && user.id === event.organizerId;
  const isPast = new Date(event.endUtc).getTime() < now;
  const isFull = event.capacity !== null && event.goingCount >= event.capacity && event.myRsvpStatus !== RsvpStatus.Going;
  const hasLocation = event.latitude !== null && event.longitude !== null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.address}`)}`;

  const onRsvpChange = (_: unknown, value: RsvpStatus | null) => {
    if (!isAuthenticated) return requireLogin();
    rsvp.mutate(value);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
          {t('common.back')}
        </Button>
      </Box>

      {/* Poster header: photo with the title set over it. */}
      <Box sx={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <EventImage
          imageUrl={event.imageUrl}
          category={event.category}
          height={{ xs: 300, md: 440 }}
          alt={event.title}
          eager
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(27,28,41,0.15) 0%, rgba(27,28,41,0.35) 45%, rgba(27,28,41,0.95) 100%)',
          }}
        />
        <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 16, right: 16 }}>
          {/* Favorites are for signed-in users only; visitors just read. */}
          {isAuthenticated && (
            <Tooltip title={event.isFavorite ? t('event.removeFavorite') : t('event.addFavorite')}>
              <IconButton
                onClick={() => favorite.mutate(!event.isFavorite)}
                aria-label={event.isFavorite ? t('event.removeFavorite') : t('event.addFavorite')}
                sx={roundGlass}
              >
                {event.isFavorite ? <FavoriteIcon sx={{ color: tokens.pink }} /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('event.share')}>
            <IconButton onClick={share} aria-label={t('event.share')} sx={roundGlass}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack
          direction="row"
          spacing={{ xs: 2, md: 3 }}
          sx={{ position: 'absolute', left: { xs: 20, md: 40 }, right: { xs: 20, md: 40 }, bottom: { xs: 20, md: 36 }, alignItems: 'flex-end' }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <DateBlock iso={event.startUtc} size="lg" />
          </Box>
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.pink }}>
                {t(meta.labelKey)}
                {event.externalSource ? ` · ${t('event.via', { source: event.externalSource })}` : ''}
              </Typography>
              {isPast && <Chip size="small" label={t('event.ended')} />}
              {isOwner && <Chip size="small" label={t('event.youOrganize')} variant="outlined" />}
            </Stack>
            <Typography variant="h1" sx={{ fontSize: { xs: 24, sm: 32, md: 44 } }}>
              {event.title}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, fontSize: 16, color: 'text.secondary' }}>
              {event.description}
            </Typography>

            {hasLocation && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('event.location')}
                </Typography>
                <EventMap latitude={event.latitude!} longitude={event.longitude!} />
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2} sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5}>
                    <AccessTimeIcon color="action" />
                    <Typography variant="body2">{formatRange(event.startUtc, event.endUtc, locale)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <PlaceIcon color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.venueName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.address}
                      </Typography>
                      <Button size="small" href={mapsUrl} target="_blank" rel="noopener" sx={{ px: 0 }}>
                        {t('event.directions')}
                      </Button>
                    </Box>
                  </Stack>
                  {price && (
                    <Stack direction="row" spacing={1.5}>
                      <SellIcon color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {price}
                      </Typography>
                    </Stack>
                  )}

                  {!isPast && <AddToCalendar event={event} />}

                  <Divider />

                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="h5">{event.goingCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('event.going')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5">{event.interestedCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('event.interested')}
                      </Typography>
                    </Box>
                    {event.capacity !== null && (
                      <Box>
                        <Typography variant="h5">{Math.max(0, event.capacity - event.goingCount)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('event.spotsLeft')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  {event.capacity !== null && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (event.goingCount / event.capacity) * 100)}
                      color={event.goingCount >= event.capacity ? 'error' : 'primary'}
                      sx={{ height: 8, borderRadius: '4px' }}
                    />
                  )}

                  {!isPast && !isAuthenticated && (
                    <>
                      <Divider />
                      <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 1 }}>
                        <Typography variant="h6">{t('guest.rsvpTitle')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('guest.rsvpText')}
                        </Typography>
                        <AuthButtons size="small" />
                      </Stack>
                    </>
                  )}

                  {!isPast && isAuthenticated && (
                    <>
                      <Divider />
                      <Typography variant="subtitle2">{t('event.areYouGoing')}</Typography>
                      <ToggleButtonGroup
                        exclusive
                        fullWidth
                        size="small"
                        color="primary"
                        value={event.myRsvpStatus}
                        onChange={onRsvpChange}
                        disabled={rsvp.isPending}
                      >
                        <ToggleButton value={RsvpStatus.Going} disabled={isFull}>
                          <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('event.rsvp.going')}
                        </ToggleButton>
                        <ToggleButton value={RsvpStatus.Interested}>
                          <StarIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('event.rsvp.interested')}
                        </ToggleButton>
                        <ToggleButton value={RsvpStatus.NotGoing}>
                          <DoNotDisturbIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('event.rsvp.no')}
                        </ToggleButton>
                      </ToggleButtonGroup>
                      {isFull && (
                        <Typography variant="caption" color="error">
                          {t('event.full')}
                        </Typography>
                      )}
                      {event.myRsvpStatus !== null && (
                        <Typography variant="caption" color="text.secondary">
                          {t('event.rsvpHint', { status: t(rsvpStatusKey[event.myRsvpStatus]) })}
                        </Typography>
                      )}
                    </>
                  )}

                  {event.externalUrl && (
                    <Button variant="contained" endIcon={<OpenInNewIcon />} href={event.externalUrl} target="_blank" rel="noopener">
                      {t('event.tickets')}
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {event.organizerName && (
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{initials(event.organizerName)}</Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('event.organizedBy')}
                      </Typography>
                      <Typography variant="subtitle2">{event.organizerName}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="outlined" startIcon={<EditIcon />} component={RouterLink} to={`/events/${event.id}/edit`}>
                  {t('event.edit')}
                </Button>
                <Button fullWidth variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
                  {t('event.delete')}
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmDelete}
        title={t('event.deleteTitle')}
        message={t('event.deleteText', { title: event.title })}
        confirmLabel={t('event.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}
