// Stock photography bundled with the app (works offline). Sources and license: src/assets/photos/CREDITS.md.
import music from '../assets/photos/music.jpg';
import food from '../assets/photos/food.jpg';
import arts from '../assets/photos/arts.jpg';
import sports from '../assets/photos/sports.jpg';
import tech from '../assets/photos/tech.jpg';
import nightlife from '../assets/photos/nightlife.jpg';
import community from '../assets/photos/community.jpg';
import theatre from '../assets/photos/theatre.jpg';
import film from '../assets/photos/film.jpg';
import other from '../assets/photos/other.jpg';
import hero from '../assets/photos/hero.jpg';
import heroSmall from '../assets/photos/hero-thumb.jpg';
import banner from '../assets/photos/banner.jpg';

/** One photo per EventCategory (same order as the backend enum). */
const CATEGORY_PHOTOS = [music, food, arts, sports, tech, nightlife, community, theatre, film, other];

/** Fallback image for events that don't have one of their own. */
export function categoryPhoto(category: number) {
  return CATEGORY_PHOTOS[category] ?? other;
}

export const heroPhoto = hero;
export const heroThumb = heroSmall;
export const bannerPhoto = banner;
