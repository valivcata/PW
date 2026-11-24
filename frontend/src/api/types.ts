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
  /** Asked for Going while the event was full; set by the server, never sent by the client. */
  Waitlisted: 3,
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
  latitude: number | null;
  longitude: number | null;
}

export interface Recommendations {
  items: EventSummary[];
  /** Categories the picks are based on, most liked first. Empty = no history yet, popular events instead. */
  basedOn: EventCategory[];
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
  waitlistCount: number;
  myRsvpStatus: RsvpStatus | null;
  /** 1-based place in the waitlist when myRsvpStatus is Waitlisted. */
  myWaitlistPosition: number | null;
  isFavorite: boolean;
  averageRating: number | null;
  reviewCount: number;
  externalSource: string | null;
  externalUrl: string | null;
}

export interface RsvpResponse {
  status: RsvpStatus;
  waitlistPosition: number | null;
}

export interface Attendee {
  userId: string;
  displayName: string;
  status: RsvpStatus;
  respondedAtUtc: string;
}

export interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  rating: number;
  comment: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ReviewRequest {
  rating: number;
  comment: string | null;
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
