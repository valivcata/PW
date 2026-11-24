import { createElement, type ReactElement } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaletteIcon from '@mui/icons-material/Palette';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import MemoryIcon from '@mui/icons-material/Memory';
import NightlifeIcon from '@mui/icons-material/Nightlife';
import GroupsIcon from '@mui/icons-material/Groups';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import MovieIcon from '@mui/icons-material/Movie';
import CategoryIcon from '@mui/icons-material/Category';
import { CATEGORIES, type EventCategory } from '../api/types';
import type { MessageKey } from '../i18n/messages';

interface CategoryMeta {
  value: number;
  /** Translation key for the category name. */
  labelKey: MessageKey;
  icon: ReactElement;
  /** Two-stop gradient used for cards without an image. */
  gradient: [string, string];
}

const ICONS: SvgIconComponent[] = [
  MusicNoteIcon,
  RestaurantIcon,
  PaletteIcon,
  SportsSoccerIcon,
  MemoryIcon,
  NightlifeIcon,
  GroupsIcon,
  TheaterComedyIcon,
  MovieIcon,
  CategoryIcon,
];

const GRADIENTS: [string, string][] = [
  ['#7c4dff', '#e040fb'],
  ['#ff6d00', '#ffab40'],
  ['#d81b60', '#ff8a80'],
  ['#00897b', '#64ffda'],
  ['#1e88e5', '#00e5ff'],
  ['#311b92', '#c51162'],
  ['#43a047', '#c6ff00'],
  ['#b71c1c', '#ffb300'],
  ['#263238', '#78909c'],
  ['#5c6bc0', '#90a4ae'],
];

export const CATEGORY_OPTIONS: CategoryMeta[] = CATEGORIES.map((_, value) => ({
  value,
  labelKey: `category.${value}` as MessageKey,
  icon: createElement(ICONS[value]),
  gradient: GRADIENTS[value],
}));

export function categoryMeta(category: EventCategory): CategoryMeta {
  return CATEGORY_OPTIONS[category] ?? CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
}
