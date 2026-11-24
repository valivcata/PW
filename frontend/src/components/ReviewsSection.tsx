import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Avatar, Box, Button, Card, CardContent, Rating, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { eventsApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import type { Review } from '../api/types';
import { useI18n } from '../i18n/i18n';
import { useNotify } from '../notify/notify';
import { formatShortDate, initials } from '../lib/format';

/**
 * Ratings and comments for an event. Everyone can read them; `canReview` (the caller was going and the
 * event has ended) shows the form to write or edit your own review.
 */
export function ReviewsSection({
  eventId,
  userId,
  canReview,
  averageRating,
  reviewCount,
}: {
  eventId: string;
  userId: string | null;
  canReview: boolean;
  averageRating: number | null;
  reviewCount: number;
}) {
  const { t, locale } = useI18n();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['event', eventId, 'reviews'],
    queryFn: () => eventsApi.reviews(eventId),
  });

  const mine = reviews?.find((r) => r.userId === userId) ?? null;
  const others = reviews?.filter((r) => r.userId !== userId) ?? [];

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">{t('reviews.title')}</Typography>
        {averageRating !== null && (
          <>
            <Rating value={averageRating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {averageRating.toFixed(1)}
            </Typography>
          </>
        )}
        <Typography variant="body2" color="text.secondary">
          {reviewCount === 1 ? t('reviews.count.one') : t('reviews.count.other', { count: reviewCount })}
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {/* key resets the form state when the saved review changes */}
        {canReview && !isLoading && <ReviewForm key={mine?.updatedAtUtc ?? 'new'} eventId={eventId} existing={mine} />}

        {isLoading && <Skeleton variant="rounded" height={90} />}
        {!isLoading && reviews?.length === 0 && !canReview && (
          <Typography variant="body2" color="text.secondary">
            {t('reviews.empty')}
          </Typography>
        )}
        {!canReview && mine && <ReviewItem review={mine} locale={locale} editedLabel={t('reviews.edited')} />}
        {others.map((r) => (
          <ReviewItem key={r.id} review={r} locale={locale} editedLabel={t('reviews.edited')} />
        ))}
      </Stack>
    </Box>
  );
}

function ReviewItem({ review, locale, editedLabel }: { review: Review; locale: string; editedLabel: string }) {
  const edited = review.updatedAtUtc.slice(0, 19) !== review.createdAtUtc.slice(0, 19);
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: review.comment ? 1 : 0 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'secondary.main' }}>{initials(review.userDisplayName)}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {review.userDisplayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatShortDate(review.createdAtUtc, locale)}
              {edited && ` · ${editedLabel}`}
            </Typography>
          </Box>
          <Rating value={review.rating} readOnly size="small" />
        </Stack>
        {review.comment && (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {review.comment}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewForm({ eventId, existing }: { eventId: string; existing: Review | null }) {
  const { t } = useI18n();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [ratingError, setRatingError] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId, 'reviews'] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId], exact: true });
  };

  const save = useMutation({
    mutationFn: () => eventsApi.saveReview(eventId, { rating: rating!, comment: comment.trim() || null }),
    onSuccess: () => {
      refresh();
      notify(t('reviews.saved'));
    },
    onError: (err) => notify(errorMessage(err, t), 'error'),
  });

  const remove = useMutation({
    mutationFn: () => eventsApi.deleteReview(eventId),
    onSuccess: () => {
      refresh();
      notify(t('reviews.deleted'));
    },
    onError: (err) => notify(errorMessage(err, t), 'error'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setRatingError(true);
      return;
    }
    save.mutate();
  };

  const busy = save.isPending || remove.isPending;

  return (
    <Card component="form" onSubmit={submit} noValidate>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {existing ? t('reviews.yourReview') : t('reviews.writeTitle')}
            </Typography>
            {!existing && (
              <Typography variant="body2" color="text.secondary">
                {t('reviews.writeText')}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography component="legend" variant="caption" color="text.secondary">
              {t('reviews.rating')}
            </Typography>
            <Rating
              value={rating}
              onChange={(_, v) => {
                setRating(v);
                setRatingError(false);
              }}
              size="large"
            />
            {ratingError && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {t('reviews.pickRating')}
              </Alert>
            )}
          </Box>
          <TextField
            label={t('reviews.comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            {existing && (
              <Button color="error" onClick={() => remove.mutate()} disabled={busy}>
                {t('reviews.delete')}
              </Button>
            )}
            <Button type="submit" variant="contained" disabled={busy}>
              {existing ? t('reviews.update') : t('reviews.submit')}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
