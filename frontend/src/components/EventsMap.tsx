import { useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { EventSummary } from '../api/types';
import { categoryMeta } from '../lib/categories';
import { formatShortDate } from '../lib/format';
import { TIMISOARA } from '../lib/geo';
import { useI18n } from '../i18n/i18n';

/** Category colour (first gradient stop), so pins match the cards. */
const pinColor = (category: number) => categoryMeta(category).gradient[0];

const iconCache = new Map<string, L.DivIcon>();
/** Teardrop pin in the category colour, drawn with CSS so no image assets are needed. */
function pinIcon(color: string) {
  let icon = iconCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: 'gatherly-pin',
      html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -26],
    });
    iconCache.set(color, icon);
  }
  return icon;
}

type Located = EventSummary & { latitude: number; longitude: number };

/** Zoom so every pin is visible; re-runs when the set of events changes (filters). */
function FitToEvents({ events }: { events: Located[] }) {
  const map = useMap();
  const key = events.map((e) => e.id).join(',');
  useEffect(() => {
    if (events.length === 0) map.setView(TIMISOARA, 13);
    else if (events.length === 1) map.setView([events[0].latitude, events[0].longitude], 15);
    else map.fitBounds(L.latLngBounds(events.map((e) => [e.latitude, e.longitude])), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** All events as category-coloured pins; a pin's popup links to the event. */
export function EventsMap({ events, height = 520 }: { events: EventSummary[]; height?: number | string }) {
  const { t, locale } = useI18n();

  const located = useMemo(
    () => events.filter((e): e is Located => e.latitude !== null && e.longitude !== null),
    [events],
  );
  const missing = events.length - located.length;
  const legend = useMemo(() => [...new Set(located.map((e) => e.category))].sort((a, b) => a - b), [located]);

  return (
    <Stack spacing={1.5}>
      <Box sx={{ height, borderRadius: '20px', overflow: 'hidden', border: 1, borderColor: 'divider', isolation: 'isolate' }}>
        <MapContainer center={TIMISOARA} zoom={13} style={{ height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoResize />
          <FitToEvents events={located} />
          {located.map((e) => (
            <Marker key={e.id} position={[e.latitude, e.longitude]} icon={pinIcon(pinColor(e.category))} title={e.title}>
              <Popup>
                <Stack spacing={0.5} sx={{ minWidth: 180, color: '#1b1c29' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: pinColor(e.category), textTransform: 'uppercase' }}>
                    {t(categoryMeta(e.category).labelKey)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
                    {e.title}
                  </Typography>
                  <Typography variant="caption">
                    {formatShortDate(e.startUtc, locale)} · {e.venueName}
                  </Typography>
                  <Button size="small" variant="contained" component={RouterLink} to={`/events/${e.id}`} sx={{ mt: 0.5 }}>
                    {t('map.open')}
                  </Button>
                </Stack>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {legend.map((c) => (
          <Stack key={c} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: pinColor(c), border: '1px solid rgba(255,255,255,.6)' }} />
            <Typography variant="caption" color="text.secondary">
              {t(categoryMeta(c).labelKey)}
            </Typography>
          </Stack>
        ))}
        {missing > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {missing === 1 ? t('map.missing.one') : t('map.missing.other', { count: missing })}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
