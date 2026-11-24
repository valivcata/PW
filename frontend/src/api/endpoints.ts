import { api } from './client';
import type {
  AuthResponse,
  EventDetail,
  EventQuery,
  EventRequest,
  EventSummary,
  LoginRequest,
  PagedResult,
  RegisterRequest,
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
  create: (body: EventRequest) => api<EventDetail>('POST', '/api/events', { body }),
  update: (id: string, body: EventRequest) => api<EventDetail>('PUT', `/api/events/${id}`, { body }),
  remove: (id: string) => api('DELETE', `/api/events/${id}`),
  rsvp: (id: string, status: RsvpStatus) => api('POST', `/api/events/${id}/rsvp`, { body: { status } }),
  removeRsvp: (id: string) => api('DELETE', `/api/events/${id}/rsvp`),
  favorite: (id: string) => api('POST', `/api/events/${id}/favorite`),
  unfavorite: (id: string) => api('DELETE', `/api/events/${id}/favorite`),
};
