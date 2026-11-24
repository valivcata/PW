import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import type { EventSummary } from '../api/types';
import { categoryMeta } from '../lib/categories';
import { formatPrice } from '../lib/format';
import { categoryPhoto } from '../lib/images';
import { isFree } from '../lib/eventFilters';
import { useI18n } from '../i18n/i18n';
import { display, tokens } from '../theme/theme';

/** Event image, or a category stock photo when the event has none. */
export function EventImage({
  imageUrl,
  category,
  height,
  alt,
  eager,
}: {
  imageUrl: string | null;
  category: number;
  height: number | string | Record<string, number | string>;
  alt: string;
  /** Load immediately (above-the-fold images). */
  eager?: boolean;
}) {
  return (
    <Box
      component="img"
      src={imageUrl || categoryPhoto(category)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={(e) => {
        // Broken organiser URL: fall back to the bundled category photo (once, to avoid loops).
        const img = e.currentTarget as HTMLImageElement;
        if (img.dataset.fallback) return;
        img.dataset.fallback = '1';
        img.src = categoryPhoto(category);
      }}
      sx={{ display: 'block', width: '100%', height, objectFit: 'cover', bgcolor: tokens.surfaceRaised }}
    />
  );
}

/** Poster-style date block: big day number over a short month. */
export function DateBlock({ iso, size = 'md' }: { iso: string; size?: 'md' | 'lg' }) {
  const { locale } = useI18n();
  const d = new Date(iso);
  const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).replace('.', '');
  return (
    <Box
      sx={{
        width: size === 'lg' ? 72 : 56,
        py: size === 'lg' ? 1.25 : 0.75,
        borderRadius: '12px',
        bgcolor: 'rgba(27, 28, 41, 0.78)',
        backdropFilter: 'blur(6px)',
        border: `1px solid ${tokens.border}`,
        textAlign: 'center',
        lineHeight: 1,
      }}
    >
      <Box sx={{ ...display, fontSize: size === 'lg' ? 26 : 20, lineHeight: 1.1 }}>{d.getDate()}</Box>
      <Box sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.peach }}>
        {month}
      </Box>
    </Box>
  );
}

export function EventCard({ event, dimmed }: { event: EventSummary; dimmed?: boolean }) {
  const { t, locale } = useI18n();
  const meta = categoryMeta(event.category);
  const free = isFree(event);
  const price = formatPrice(event.price, locale, t('common.free'), free);
  const time = new Intl.DateTimeFormat(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(event.startUtc),
  );

  return (
    <Card
      sx={{
        height: '100%',
        opacity: dimmed ? 0.6 : 1,
        transition: 'border-color .2s, transform .2s, opacity .2s',
        '&:hover': { borderColor: tokens.pink, transform: 'translateY(-3px)', opacity: 1 },
        '&:hover .card-img': { transform: 'scale(1.04)' },
        '&:hover .card-arrow': { background: tokens.accentGradient, color: tokens.onAccent, borderColor: 'transparent' },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/events/${event.id}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <Box className="card-img" sx={{ transition: 'transform .4s' }}>
            <EventImage imageUrl={event.imageUrl} category={event.category} height={190} alt={event.title} />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(27,28,41,0) 45%, rgba(27,28,41,0.85) 100%)',
            }}
          />
          <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
            <DateBlock iso={event.startUtc} />
          </Box>
          {price && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                ...(free
                  ? { background: tokens.accentGradient, color: tokens.onAccent }
                  : { bgcolor: 'rgba(27,28,41,0.78)', border: `1px solid ${tokens.border}`, backdropFilter: 'blur(6px)' }),
              }}
            >
              {price}
            </Box>
          )}
          <Typography
            sx={{
              position: 'absolute',
              left: 14,
              bottom: 10,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: tokens.pink,
            }}
          >
            {t(meta.labelKey)}
            {event.externalSource ? ` · ${event.externalSource}` : ''}
          </Typography>
        </Box>

        <Stack spacing={1.25} sx={{ p: 2, flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 16, lineHeight: 1.35 }} className="clamp-2">
            {event.title}
          </Typography>
          <Stack spacing={0.5} sx={{ color: 'text.secondary', fontSize: 13 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 15 }} />
              <span>{time}</span>
            </Stack>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 15 }} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.venueName}
              </Box>
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ mt: 'auto', pt: 0.5, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{t('card.going', { count: event.goingCount })}</Typography>
            <Box
              className="card-arrow"
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${tokens.borderStrong}`,
                transition: 'all .2s',
              }}
            >
              <NorthEastIcon sx={{ fontSize: 16 }} />
            </Box>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
