import { api } from './client';
import type {
  Attendee,
  AuthResponse,
  EventDetail,
  EventQuery,
  EventRequest,
  EventSummary,
  LoginRequest,
  PagedResult,
  Recommendations,
  RegisterRequest,
  Review,
  ReviewRequest,
  RsvpResponse,
  RsvpStatus,
  UpdateProfileRequest,
  UserProfile,
} from './types';

export const authApi = {
  login: (body: LoginRequest) => api<AuthResponse>('POST', '/api/auth/login', { body }),
  register: (body: RegisterRequest) => api<AuthResponse>('POST', '/api/auth/register', { body }),
};

export const usersApi = {
  me: () => api<UserProfile>('GET', '/api/users/me'),
  updateMe: (body: UpdateProfileRequest) => api<UserProfile>('PUT', '/api/users/me', { body }),
};

export const eventsApi = {
  list: (query: EventQuery) =>
    api<PagedResult<EventSummary>>('GET', '/api/events', { query: { ...query } }),
  get: (id: string) => api<EventDetail>('GET', `/api/events/${id}`),
  mine: () => api<EventSummary[]>('GET', '/api/events/mine'),
  attending: () => api<EventSummary[]>('GET', '/api/events/attending'),
  favorites: () => api<EventSummary[]>('GET', '/api/events/favorites'),
  recommended: (limit = 8) => api<Recommendations>('GET', '/api/events/recommended', { query: { limit } }),
  create: (body: EventRequest) => api<EventDetail>('POST', '/api/events', { body }),
  update: (id: string, body: EventRequest) => api<EventDetail>('PUT', `/api/events/${id}`, { body }),
  remove: (id: string) => api('DELETE', `/api/events/${id}`),
  rsvp: (id: string, status: RsvpStatus) =>
    api<RsvpResponse>('POST', `/api/events/${id}/rsvp`, { body: { status } }),
  removeRsvp: (id: string) => api('DELETE', `/api/events/${id}/rsvp`),
  favorite: (id: string) => api('POST', `/api/events/${id}/favorite`),
  unfavorite: (id: string) => api('DELETE', `/api/events/${id}/favorite`),
  attendees: (id: string) => api<Attendee[]>('GET', `/api/events/${id}/attendees`),
  reviews: (id: string) => api<Review[]>('GET', `/api/events/${id}/reviews`),
  saveReview: (id: string, body: ReviewRequest) => api<Review>('PUT', `/api/events/${id}/reviews`, { body }),
  deleteReview: (id: string) => api('DELETE', `/api/events/${id}/reviews`),
};
