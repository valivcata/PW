// Mirrors the DTOs in backend/src/Gatherly.Application. Enums are serialized as numbers by the API.

export const CATEGORIES = [
  'Music',
  'Food',
  'Arts',
  'Sports',
  'Tech',
  'Nightlife',
  'Community',
  'Theatre',
  'Film',
  'Other',
] as const;

/** Index into CATEGORIES (matches the backend EventCategory enum value). */
export type EventCategory = number;

export const RsvpStatus = {
  Interested: 0,
  Going: 1,
  NotGoing: 2,
} as const;
export type RsvpStatus = (typeof RsvpStatus)[keyof typeof RsvpStatus];

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EventSummary {
  id: string;
  title: string;
  category: EventCategory;
  startUtc: string;
  endUtc: string;
  venueName: string;
  imageUrl: string | null;
  price: number | null;
  goingCount: number;
  externalSource: string | null;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startUtc: string;
  endUtc: string;
  venueName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  capacity: number | null;
  imageUrl: string | null;
  organizerId: string | null;
  organizerName: string | null;
  goingCount: number;
  interestedCount: number;
  myRsvpStatus: RsvpStatus | null;
  isFavorite: boolean;
  externalSource: string | null;
  externalUrl: string | null;
}

export interface EventRequest {
  title: string;
  description: string;
  category: EventCategory;
  startUtc: string;
  endUtc: string;
  venueName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  capacity: number | null;
  imageUrl: string | null;
}

export interface EventQuery {
  category?: EventCategory;
  from?: string;
  to?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  pageSize?: number;
}
