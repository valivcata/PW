import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@mui/material';
import { EmptyState } from '../components/EventGrid';
import { useI18n } from '../i18n/i18n';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <EmptyState
      title={t('notFound.title')}
      description={t('notFound.text')}
      action={
        <Button variant="contained" component={RouterLink} to="/">
          {t('common.backToEvents')}
        </Button>
      }
    />
  );
}
