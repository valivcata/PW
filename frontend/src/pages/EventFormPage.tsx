import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import { eventsApi } from '../api/endpoints';
import { ApiError, errorMessage } from '../api/client';
import type { EventDetail, EventRequest } from '../api/types';
import { CATEGORY_OPTIONS } from '../lib/categories';
import {
  emptyEventForm,
  eventFormToRequest,
  eventToForm,
  serverErrorsToForm,
  validateEventForm,
  type EventFormErrors,
  type EventFormState,
} from '../lib/eventForm';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { useI18n } from '../i18n/i18n';
import { LocationPicker } from '../components/EventMap';
import { EventImage } from '../components/EventCard';
import { FormSection, PageHeader } from '../components/FormLayout';

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const { t } = useI18n();
  const existing = useQuery({ queryKey: ['event', id], queryFn: () => eventsApi.get(id!), enabled: isEdit });

  if (!isEdit) return <EventForm />;

  if (existing.isLoading) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Skeleton height={56} width="40%" />
        <Skeleton variant="rounded" height={480} />
      </Stack>
    );
  }
  if (existing.error || !existing.data) {
    return <Alert severity="error">{existing.error ? errorMessage(existing.error, t) : t('event.notFound')}</Alert>;
  }
  if (user && existing.data.organizerId !== user.id) return <Navigate to={`/events/${id}`} replace />;

  return <EventForm key={existing.data.id} event={existing.data} />;
}

function EventForm({ event }: { event?: EventDetail }) {
  const id = event?.id;
  const isEdit = !!event;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { t } = useI18n();

  const [form, setForm] = useState<EventFormState>(() => (event ? eventToForm(event) : emptyEventForm()));
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const errorText = (key: keyof EventFormState) => {
    const e = errors[key];
    if (!e) return undefined;
    return 'key' in e ? t(e.key) : e.text;
  };

  const save = useMutation({
    mutationFn: (req: EventRequest) => (isEdit ? eventsApi.update(id!, req) : eventsApi.create(req)),
    onSuccess: (saved) => {
      queryClient.setQueryData(['event', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      notify(isEdit ? t('form.updated') : t('form.created'));
      navigate(`/events/${saved.id}`, { replace: isEdit });
    },
    onError: (err) => {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors(serverErrorsToForm(err.fieldErrors));
      setSubmitError(errorMessage(err, t));
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validateEventForm(form, isEdit);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setSubmitError(t('form.fixFields'));
      return;
    }
    save.mutate(eventFormToRequest(form));
  };

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
      <PageHeader
        overline={t('form.overline')}
        title={isEdit ? t('form.editTitle') : t('form.createTitle')}
        subtitle={isEdit ? t('form.editText') : t('form.createText')}
      />

      <Stack component="form" onSubmit={submit} noValidate>
        {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

        <FormSection index={1} title={t('form.basics')} description={t('form.basicsHelp')}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label={t('form.title')}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errorText('title')}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  id="event-category"
                  label={t('form.category')}
                  value={form.category}
                  onChange={(e) => set('category', Number(e.target.value))}
                  fullWidth
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', '& svg': { fontSize: 18 } }}>
                        {c.icon}
                        <span>{t(c.labelKey)}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t('form.description')}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errorText('description') ?? `${form.description.length}/4000`}
                  required
                  fullWidth
                  multiline
                  minRows={5}
                  slotProps={{ htmlInput: { maxLength: 4000 } }}
                />
              </Grid>
            </Grid>
        </FormSection>

        <FormSection index={2} title={t('form.when')} description={t('form.whenHelp')}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.starts')}
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => set('start', e.target.value)}
                  error={!!errors.start}
                  helperText={errorText('start')}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.ends')}
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => set('end', e.target.value)}
                  error={!!errors.end}
                  helperText={errorText('end')}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.start || undefined } }}
                />
              </Grid>
            </Grid>
        </FormSection>

        <FormSection index={3} title={t('form.where')} description={t('form.whereHelp')}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t('form.venue')}
                  value={form.venueName}
                  onChange={(e) => set('venueName', e.target.value)}
                  error={!!errors.venueName}
                  helperText={errorText('venueName')}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t('form.address')}
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  error={!!errors.address}
                  helperText={errorText('address')}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 300 } }}
                />
              </Grid>
              <Grid size={12}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {form.latitude !== null && form.longitude !== null
                      ? t('form.pinSet', { lat: form.latitude, lng: form.longitude })
                      : t('form.pinHint')}
                  </Typography>
                  {form.latitude !== null && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                      sx={{ flexShrink: 0 }}
                    >
                      {t('form.clearPin')}
                    </Button>
                  )}
                </Stack>
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
                />
              </Grid>
            </Grid>
        </FormSection>

        <FormSection index={4} title={t('form.extras')} description={t('form.extrasHelp')}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.price')}
                  type="number"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  error={!!errors.price}
                  helperText={errorText('price') ?? t('form.priceHelp')}
                  fullWidth
                  slotProps={{
                    htmlInput: { min: 0, step: '0.01' },
                    input: { endAdornment: <InputAdornment position="end">RON</InputAdornment> },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('form.capacity')}
                  type="number"
                  value={form.capacity}
                  onChange={(e) => set('capacity', e.target.value)}
                  error={!!errors.capacity}
                  helperText={errorText('capacity') ?? t('form.capacityHelp')}
                  fullWidth
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t('form.imageUrl')}
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  error={!!errors.imageUrl}
                  helperText={errorText('imageUrl') ?? t('form.imageHelp')}
                  placeholder="https://…"
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('form.preview')}
                </Typography>
                <Card sx={{ mt: 0.5 }}>
                  <EventImage imageUrl={form.imageUrl.trim() || null} category={form.category} height={140} alt="" />
                </Card>
              </Grid>
            </Grid>
        </FormSection>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', pt: 4 }}>
          <Button variant="outlined" onClick={() => navigate(-1)} disabled={save.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} loading={save.isPending}>
            {isEdit ? t('form.save') : t('form.publish')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
