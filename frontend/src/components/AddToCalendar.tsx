import { useState } from 'react';
import { Button, ListItemIcon, Menu, MenuItem } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import GoogleIcon from '@mui/icons-material/Google';
import DownloadIcon from '@mui/icons-material/Download';
import type { EventDetail } from '../api/types';
import { downloadIcs, googleCalendarUrl } from '../lib/calendar';
import { useI18n } from '../i18n/i18n';

export function AddToCalendar({ event }: { event: EventDetail }) {
  const { t } = useI18n();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const url = `${window.location.origin}/events/${event.id}`;

  return (
    <>
      <Button variant="outlined" startIcon={<EventIcon />} onClick={(e) => setAnchor(e.currentTarget)} fullWidth>
        {t('event.addToCalendar')}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem
          component="a"
          href={googleCalendarUrl(event, url)}
          target="_blank"
          rel="noopener"
          onClick={() => setAnchor(null)}
        >
          <ListItemIcon>
            <GoogleIcon fontSize="small" />
          </ListItemIcon>
          {t('event.googleCalendar')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadIcs(event, url);
            setAnchor(null);
          }}
        >
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          {t('event.downloadIcs')}
        </MenuItem>
      </Menu>
    </>
  );
}
