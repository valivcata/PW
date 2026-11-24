import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MailOutlineIcon from '@mui/icons-material/EmailOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNotify } from '../notify/notify';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';
import { SUPPORT_EMAIL } from '../lib/config';


const faq: [MessageKey, MessageKey][] = [
  ['help.q1', 'help.a1'],
  ['help.q2', 'help.a2'],
  ['help.q3', 'help.a3'],
  ['help.q4', 'help.a4'],
];

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const notify = useNotify();
  const { t } = useI18n();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      notify(t('help.copied'), 'info');
    } catch {
      notify(t('help.copyFailed'), 'warning');
    }
  };

  return (
    <>
      <Tooltip title={t('help.button')}>
        <IconButton onClick={() => setOpen(true)} aria-label={t('help.button')}>
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('help.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box>
              {faq.map(([q, a]) => (
                <Accordion key={q} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                    <Typography variant="subtitle2">{t(q)}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t(a)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('help.contactTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('help.contactText')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                <Typography variant="body1" sx={{ fontWeight: 600, flexGrow: 1, wordBreak: 'break-all' }}>
                  {SUPPORT_EMAIL}
                </Typography>
                <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
                  {t('help.copy')}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<MailOutlineIcon />}
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('help.subject'))}`}
                >
                  {t('help.sendEmail')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
