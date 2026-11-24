import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Box, Button, Skeleton, Stack, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { usersApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import type { UserProfile } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { useI18n } from '../i18n/i18n';
import { initials } from '../lib/format';
import { FormSection, PageHeader } from '../components/FormLayout';
import { tokens } from '../theme/theme';

export function ProfilePage() {
  const { t } = useI18n();
  const { data: profile, isLoading, error } = useQuery({ queryKey: ['me', 'profile'], queryFn: usersApi.me });

  if (error) return <Alert severity="error">{errorMessage(error, t)}</Alert>;

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
      {isLoading || !profile ? (
        <Stack spacing={3}>
          <Skeleton width={120} />
          <Skeleton variant="rounded" height={56} width="50%" />
          <Skeleton variant="rounded" height={260} />
        </Stack>
      ) : (
        <ProfileForm key={profile.id} profile={profile} />
      )}
    </Box>
  );
}

function ProfileForm({ profile: initial }: { profile: UserProfile }) {
  const { setUser } = useAuth();
  const { t } = useI18n();
  const notify = useNotify();
  const [profile, setProfile] = useState(initial);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');

  const save = useMutation({
    mutationFn: () => usersApi.updateMe({ displayName: displayName.trim(), bio: bio.trim(), avatarUrl: avatarUrl.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      setProfile(updated);
      notify(t('profile.saved'));
    },
    onError: (err) => notify(errorMessage(err, t), 'error'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    save.mutate();
  };

  const dirty =
    displayName !== profile.displayName || bio !== (profile.bio ?? '') || avatarUrl !== (profile.avatarUrl ?? '');

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <PageHeader
        overline={t('profile.title')}
        title={displayName.trim() || profile.displayName}
        subtitle={profile.email}
        action={
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: { xs: 72, md: 104 },
              height: { xs: 72, md: 104 },
              fontSize: { xs: 26, md: 38 },
              background: tokens.accentGradient,
              color: tokens.onAccent,
              fontWeight: 600,
              border: `3px solid ${tokens.surfaceRaised}`,
            }}
          >
            {initials(displayName || profile.displayName)}
          </Avatar>
        }
      />

      <FormSection index={1} title={t('profile.identity')} description={t('profile.identityHelp')}>
        <Stack spacing={2.5}>
          <TextField
            label={t('auth.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            fullWidth
            error={!displayName.trim()}
            helperText={!displayName.trim() ? t('profile.nameRequired') : undefined}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField label={t('auth.email')} value={profile.email} disabled fullWidth helperText={t('profile.emailLocked')} />
        </Stack>
      </FormSection>

      <FormSection index={2} title={t('profile.about')} description={t('profile.aboutHelp')}>
        <Stack spacing={2.5}>
          <TextField
            label={t('profile.bio')}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            placeholder={t('profile.bioPlaceholder')}
          />
          <TextField
            label={t('profile.avatarUrl')}
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            type="url"
            fullWidth
          />
        </Stack>
      </FormSection>

      <Stack direction="row" sx={{ justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', pt: 4 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14, mr: 'auto', alignSelf: 'center', visibility: dirty ? 'visible' : 'hidden' }}>
          {t('profile.unsaved')}
        </Typography>
        <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} loading={save.isPending} disabled={!dirty}>
          {t('profile.save')}
        </Button>
      </Stack>
    </Box>
  );
}
