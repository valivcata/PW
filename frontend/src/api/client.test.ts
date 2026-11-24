import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, errorMessage, setAuthToken, setUnauthorizedHandler } from './client';
import { jsonResponse } from '../test/render';

const mockFetch = (res: Response) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(res);

afterEach(() => {
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

describe('api', () => {
  it('sends the bearer token and JSON body', async () => {
    const spy = mockFetch(jsonResponse({ ok: true }));
    setAuthToken('tok');
    await api('POST', '/api/x', { body: { a: 1 }, query: { page: 2, empty: '', none: undefined } });

    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/x\?page=2$/);
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(init!.body).toBe('{"a":1}');
  });

  it('returns undefined for 204', async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(api('DELETE', '/api/x')).resolves.toBeUndefined();
  });

  it('normalizes { error } bodies', async () => {
    mockFetch(jsonResponse({ error: 'Event is at full capacity.' }, 409));
    await expect(api('POST', '/api/x')).rejects.toMatchObject({ status: 409, message: 'Event is at full capacity.' });
  });

  it('normalizes Identity { errors: [] } bodies', async () => {
    mockFetch(jsonResponse({ errors: ['Email taken.', 'Weak password.'] }, 400));
    await expect(api('POST', '/api/x')).rejects.toMatchObject({ message: 'Email taken. Weak password.' });
  });

  it('normalizes ValidationProblemDetails into field errors', async () => {
    mockFetch(jsonResponse({ title: 'One or more validation errors occurred.', errors: { StartUtc: ['Too early.'] } }, 400));
    const err = (await api('POST', '/api/x').catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.fieldErrors).toEqual({ startUtc: ['Too early.'] });
    expect(err.message).toBe('Too early.');
  });

  it('calls the unauthorized handler on 401 when signed in', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setAuthToken('expired');
    mockFetch(jsonResponse(undefined, 401));
    await expect(api('GET', '/api/users/me')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('reports network failures with status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const err = (await api('GET', '/api/events').catch((e) => e)) as ApiError;
    expect(err.status).toBe(0);
    expect(errorMessage(err, (k) => k)).toBe('error.network');
  });
});
