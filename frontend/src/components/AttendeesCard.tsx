import { useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Box, Card, CardContent, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { eventsApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { RsvpStatus, type Attendee } from '../api/types';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';
import { formatShortDate, initials } from '../lib/format';

/** Sections in display order; the API already sorts each group by answer time (= waitlist order). */
const GROUPS: { status: RsvpStatus; labelKey: MessageKey; color: 'success' | 'warning' | 'info' | 'default' }[] = [
  { status: RsvpStatus.Going, labelKey: 'attendees.going', color: 'success' },
  { status: RsvpStatus.Waitlisted, labelKey: 'attendees.waitlisted', color: 'warning' },
  { status: RsvpStatus.Interested, labelKey: 'attendees.interested', color: 'info' },
  { status: RsvpStatus.NotGoing, labelKey: 'attendees.notGoing', color: 'default' },
];

/** RSVP list for the event's organizer: who's going, who's waiting and who's interested. */
export function AttendeesCard({ eventId }: { eventId: string }) {
  const { t, locale } = useI18n();
  const { data, isLoading, error } = useQuery({
    queryKey: ['event', eventId, 'attendees'],
    queryFn: () => eventsApi.attendees(eventId),
  });

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <GroupIcon color="action" />
            <Typography variant="h6">{t('attendees.title')}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t('attendees.subtitle')}
          </Typography>

          {isLoading && <Skeleton variant="rounded" height={80} />}
          {error && <Alert severity="error">{errorMessage(error, t)}</Alert>}
          {data && data.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('attendees.empty')}
            </Typography>
          )}

          {data &&
            GROUPS.map(({ status, labelKey, color }) => {
              const people = data.filter((a) => a.status === status);
              if (people.length === 0) return null;
              return (
                <Box key={status}>
                  <Divider sx={{ mb: 1.5 }} />
                  <Chip size="small" color={color} label={`${t(labelKey)} · ${people.length}`} sx={{ mb: 1 }} />
                  <Stack spacing={1}>
                    {people.map((a, i) => (
                      <AttendeeRow
                        key={a.userId}
                        attendee={a}
                        position={status === RsvpStatus.Waitlisted ? i + 1 : null}
                        answered={t('attendees.respondedAt', { date: formatShortDate(a.respondedAtUtc, locale) })}
                      />
                    ))}
                  </Stack>
                </Box>
              );
            })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function AttendeeRow({ attendee, position, answered }: { attendee: Attendee; position: number | null; answered: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'secondary.main' }}>{initials(attendee.displayName)}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {position !== null && `#${position} `}
          {attendee.displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {answered}
        </Typography>
      </Box>
    </Stack>
  );
}
