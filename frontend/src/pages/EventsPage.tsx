import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Collapse,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { eventsApi } from '../api/endpoints';
import type { EventQuery } from '../api/types';
import { CATEGORY_OPTIONS } from '../lib/categories';
import { dateInputToIso } from '../lib/format';
import { activeQuickRange, quickRange, QUICK_RANGES, type QuickRange } from '../lib/dateRanges';
import { applyClientFilters, isSortKey, SORT_KEYS, type SortKey } from '../lib/eventFilters';
import { EmptyState, EventGrid } from '../components/EventGrid';
import { fourUpGridSize } from '../lib/grid';
import { TIMISOARA } from '../lib/geo';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/i18n';
import { Hero } from '../components/Hero';
import { Reveal } from '../components/Reveal';
import { GuestGate } from '../components/GuestGate';
import { GUEST_EVENT_LIMIT } from '../lib/config';
import { scrollToElement } from '../lib/smoothScroll';
import { display, tokens } from '../theme/theme';
import type { MessageKey } from '../i18n/messages';

const PAGE_SIZE = 12;
/** API max page size; used when sorting/filtering has to happen in the browser. */
const CLIENT_FETCH_SIZE = 100;

const quickLabel: Record<QuickRange, MessageKey> = { today: 'home.today', weekend: 'home.weekend', week: 'home.week' };
const sortLabel: Record<SortKey, MessageKey> = { date: 'home.sort.date', price: 'home.sort.price', popular: 'home.sort.popular' };

const noScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } } as const;

export function EventsPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const location = useLocation();

  // Links like "Discover" arrive with state { scrollTo: 'events' }: jump to the list.
  // Runs after the route-change scroll-to-top (parent effects run after this one), hence the short delay.
  useEffect(() => {
    if ((location.state as { scrollTo?: string } | null)?.scrollTo !== 'events') return;
    const timer = window.setTimeout(() => scrollToElement(document.getElementById('events')), 150);
    return () => window.clearTimeout(timer);
  }, [location.key, location.state]);

  const search = params.get('q') ?? '';
  const category = params.get('category');
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const near = params.get('near') === '1';
  const radius = Number(params.get('radius') ?? 5);
  const lat = params.get('lat');
  const lng = params.get('lng');
  const freeOnly = params.get('free') === '1';
  const sortParam = params.get('sort');
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'date';
  // Signed-out visitors only ever see the first few events (see GuestGate).
  const page = isAuthenticated ? Math.max(1, Number(params.get('page') ?? 1)) : 1;

  // Free-only and non-date sorting aren't supported by the API, so fetch a larger batch and do it here.
  const clientMode = freeOnly || sort !== 'date';

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(!!(near || freeOnly || sort !== 'date' || ((from || to) && !activeQuickRange(from, to))));
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<MessageKey | null>(null);

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // Keep the box in sync when the URL changes from elsewhere (Discover link, Reset, back button).
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    if (search !== searchInput.trim()) setSearchInput(search);
  }

  // Search as you type: push the text into the URL shortly after the last keystroke.
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = window.setTimeout(() => update({ q: searchInput.trim() || null }), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query: EventQuery = useMemo(() => {
    const q: EventQuery = clientMode ? { page: 1, pageSize: CLIENT_FETCH_SIZE } : { page, pageSize: PAGE_SIZE };
    if (search) q.search = search;
    if (category !== null) q.category = Number(category);
    if (from) q.from = dateInputToIso(from);
    if (to) q.to = dateInputToIso(to, true);
    if (near) {
      q.latitude = lat ? Number(lat) : TIMISOARA[0];
      q.longitude = lng ? Number(lng) : TIMISOARA[1];
      q.radiusKm = radius;
    }
    return q;
  }, [clientMode, page, search, category, from, to, near, lat, lng, radius]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['events', query],
    queryFn: () => eventsApi.list(query),
    placeholderData: keepPreviousData,
  });

  const view = useMemo(() => {
    if (!data) return null;
    if (!clientMode) return { items: data.items, total: data.total, pages: Math.max(1, Math.ceil(data.total / PAGE_SIZE)) };
    const all = applyClientFilters(data.items, { freeOnly, sort });
    return {
      items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: all.length,
      pages: Math.max(1, Math.ceil(all.length / PAGE_SIZE)),
    };
  }, [data, clientMode, freeOnly, sort, page]);

  const truncated = clientMode && !!data && data.total > data.items.length;
  const quick = activeQuickRange(from, to);
  const hasFilters = !!(search || category !== null || from || to || near || freeOnly || sort !== 'date');

  const setQuick = (kind: QuickRange) => {
    if (quick === kind) return update({ from: null, to: null });
    const r = quickRange(kind);
    update({ from: r.from, to: r.to });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('home.geoUnavailable');
      update({ near: '1' });
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        update({ near: '1', lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
      },
      () => {
        setLocating(false);
        setGeoError('home.geoFailed');
        update({ near: '1', lat: null, lng: null });
      },
      { timeout: 8000 },
    );
  };

  const scrollToEvents = () => scrollToElement(document.getElementById('events'));

  const textTab = (active: boolean) => ({
    ...display,
    fontSize: 12,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    background: 'none',
    border: 0,
    p: 0,
    whiteSpace: 'nowrap',
    color: active ? 'text.primary' : 'text.secondary',
    opacity: active ? 1 : 0.7,
    transition: 'color .15s, opacity .15s',
    '&:hover': { color: 'text.primary', opacity: 1 },
    ...(active ? { textDecoration: 'underline', textDecorationColor: tokens.pink, textUnderlineOffset: 6, textDecorationThickness: 2 } : {}),
  });

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Reveal y={16}>
        <Hero onExplore={scrollToEvents} />
      </Reveal>

      <Reveal delay={150}>
      <TextField
        fullWidth
        placeholder={t('home.searchPlaceholder')}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{
          maxWidth: 760,
          mx: 'auto',
          '& .MuiOutlinedInput-root': { borderRadius: 999, pl: 1, bgcolor: tokens.surface, height: 56 },
        }}
        slotProps={{
          htmlInput: { 'aria-label': t('home.searchPlaceholder') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchInput('')} aria-label={t('home.clearSearch')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
      </Reveal>

      {/* Category strip, styled like a row of partner logos. */}
      <Reveal delay={250}>
      <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider', py: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 3, md: 4.5 },
            overflowX: 'auto',
            justifyContent: { lg: 'space-between' },
            ...noScrollbar,
          }}
        >
          {[{ value: null as number | null, labelKey: 'home.all' as MessageKey, icon: null }, ...CATEGORY_OPTIONS].map((c) => {
            const active = c.value === null ? category === null : category === String(c.value);
            return (
              <Box
                key={c.labelKey}
                component="button"
                type="button"
                onClick={() => update({ category: active || c.value === null ? null : String(c.value) })}
                sx={{
                  ...textTab(active),
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: 13,
                  ...(active ? { background: tokens.accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: 1 } : {}),
                  '& svg': { fontSize: 20, color: active ? tokens.pink : 'inherit' },
                }}
              >
                {c.icon}
                {t(c.labelKey)}
              </Box>
            );
          })}
        </Box>
      </Box>
      </Reveal>

      <Stack spacing={2.5} id="events" sx={{ scrollMarginTop: 96 }}>
        <Reveal>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { lg: 'flex-end' }, gap: 2.5 }}
        >
          <Typography variant="h2" sx={{ fontSize: { xs: 24, md: 34 } }}>
            {t('home.sectionLine1')}
            <br />
            {t('home.sectionLine2')}
          </Typography>
          <Stack spacing={1.5} sx={{ alignItems: { lg: 'flex-end' }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', ...noScrollbar }}>
              {QUICK_RANGES.map((k) => (
                <Box key={k} component="button" type="button" onClick={() => setQuick(k)} sx={textTab(quick === k)}>
                  {t(quickLabel[k])}
                </Box>
              ))}
              <Box component="button" type="button" onClick={() => update({ free: freeOnly ? null : '1' })} sx={textTab(freeOnly)}>
                {t('home.freeOnly')}
              </Box>
            </Box>
            <Button
              size="small"
              startIcon={<TuneIcon />}
              variant={showFilters ? 'contained' : 'outlined'}
              onClick={() => setShowFilters((s) => !s)}
              sx={{ alignSelf: { xs: 'flex-start', lg: 'flex-end' } }}
            >
              {t('home.filters')}
            </Button>
          </Stack>
        </Stack>
        </Reveal>

        <Collapse in={showFilters}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
                <TextField
                  label={t('home.from')}
                  type="date"
                  size="small"
                  value={from}
                  onChange={(e) => update({ from: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('home.to')}
                  type="date"
                  size="small"
                  value={to}
                  onChange={(e) => update({ to: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
                />
                <TextField
                  select
                  label={t('home.sortBy')}
                  size="small"
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value === 'date' ? null : e.target.value })}
                  sx={{ minWidth: 200 }}
                >
                  {SORT_KEYS.map((k) => (
                    <MenuItem key={k} value={k}>
                      {t(sortLabel[k])}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={near}
                      onChange={(e) =>
                        e.target.checked ? update({ near: '1' }) : update({ near: null, lat: null, lng: null })
                      }
                    />
                  }
                  label={t('home.near')}
                />
                <Box sx={{ flexGrow: 1, minWidth: 160, px: 1, opacity: near ? 1 : 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('home.within', { km: radius, place: lat ? t('home.you') : t('home.cityCentre') })}
                  </Typography>
                  <Slider
                    size="small"
                    value={radius}
                    min={1}
                    max={50}
                    disabled={!near}
                    valueLabelDisplay="auto"
                    onChange={(_, v) => update({ radius: String(v) })}
                  />
                </Box>
                <Button startIcon={<MyLocationIcon />} onClick={useMyLocation} loading={locating}>
                  {t('home.useMyLocation')}
                </Button>
                {hasFilters && (
                  <Button
                    color="inherit"
                    onClick={() => {
                      setSearchInput('');
                      setParams(new URLSearchParams(), { replace: true });
                    }}
                  >
                    {t('home.reset')}
                  </Button>
                )}
              </Stack>
            </Stack>
            {geoError && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                {t(geoError)}
              </Typography>
            )}
          </Paper>
        </Collapse>

        {view && (
          <Typography variant="body2" color="text.secondary">
            {view.total === 1 ? t('home.count.one') : t('home.count.other', { count: view.total })}
            {isFetching && !isLoading ? ` · ${t('home.updating')}` : ''}
          </Typography>
        )}
      {truncated && (
        <Typography variant="caption" color="text.secondary">
          {t('home.limitedNote', { count: CLIENT_FETCH_SIZE })}
        </Typography>
      )}

      <EventGrid
        events={isAuthenticated ? view?.items : view?.items.slice(0, GUEST_EVENT_LIMIT)}
        gridSize={isAuthenticated ? undefined : fourUpGridSize}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        empty={
          <EmptyState
            title={hasFilters ? t('home.emptyFiltered') : t('home.empty')}
            description={hasFilters ? t('home.emptyFilteredText') : t('home.emptyText')}
            action={
              isAuthenticated && (
                <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
                  {t('nav.createEvent')}
                </Button>
              )
            }
          />
        }
      />

      {!isAuthenticated && view && view.total > GUEST_EVENT_LIMIT && (
        <GuestGate total={view.total} teaser={view.items.slice(GUEST_EVENT_LIMIT, GUEST_EVENT_LIMIT + 4)} />
      )}

      {isAuthenticated && view && view.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={view.pages}
            page={Math.min(page, view.pages)}
            color="primary"
            onChange={(_, p) => {
              update({ page: p === 1 ? null : String(p) }, false);
              scrollToElement(document.getElementById('events'));
            }}
          />
        </Box>
      )}
      </Stack>
    </Stack>
  );
}
