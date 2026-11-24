export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5115';

/** Error thrown for any non-2xx response, normalized from the backend's different error shapes. */
export class ApiError extends Error {
  readonly status: number;
  /** Field-level messages from ValidationProblemDetails, keyed by lower-camel field name. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(path, API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function lowerFirst(s: string) {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s;
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // empty or non-JSON body
  }

  const fallback =
    res.status === 401
      ? 'Please sign in to continue.'
      : res.status === 403
        ? "You don't have permission to do that."
        : res.status === 404
          ? 'Not found.'
          : `Request failed (${res.status}).`;

  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    // { error: "..." }
    if (typeof b.error === 'string') return new ApiError(res.status, b.error);
    // Identity errors: { errors: ["...", "..."] }
    if (Array.isArray(b.errors)) return new ApiError(res.status, b.errors.join(' '));
    // ValidationProblemDetails: { title, errors: { Field: ["..."] } }
    if (b.errors && typeof b.errors === 'object') {
      const fieldErrors: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(b.errors as Record<string, string[]>)) {
        fieldErrors[lowerFirst(k)] = v;
      }
      const message = Object.values(fieldErrors).flat().join(' ') || (b.title as string) || fallback;
      return new ApiError(res.status, message, fieldErrors);
    }
    if (typeof b.title === 'string') return new ApiError(res.status, b.title);
  }
  return new ApiError(res.status, fallback);
}

export async function api<T = void>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: unknown; query?: Query } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Can't reach the server at ${API_URL}. Is the backend running?`);
  }

  if (res.status === 401 && currentToken) onUnauthorized?.();
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Human-readable error text. Messages coming from the API are shown as-is;
 * network failures and unknown errors use the translated fallbacks when `t` is given.
 */
export function errorMessage(err: unknown, t?: (key: 'error.network' | 'error.generic') => string): string {
  if (err instanceof ApiError && err.status === 0 && t) return t('error.network');
  if (err instanceof Error && err.message) return err.message;
  return t ? t('error.generic') : 'Something went wrong.';
}
