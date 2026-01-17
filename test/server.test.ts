import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { start, server } from '../src/server';

const TEST_PORT = 4000;

beforeAll(async () => {
  await start(TEST_PORT);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('delay-api server', () => {
  const base = `http://127.0.0.1:${TEST_PORT}`;

  it('GET /healthz should return 200 with ok=true', async () => {
    const res = await fetch(`${base}/healthz`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('GET /delay without ms should return 400', async () => {
    const res = await fetch(`${base}/delay`);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Value must be an integer between 0 and 30000' });
  });

  it('GET /delay with non-numeric ms should return 400', async () => {
    const res = await fetch(`${base}/delay?ms=invalid`);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Value must be an integer between 0 and 30000' });
  });

  it('GET /delay with negative ms should return 400', async () => {
    const res = await fetch(`${base}/delay?ms=-1`);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Value must be an integer between 0 and 30000' });
  });

  it('GET /delay with ms > MAX_DELAY_MS should return 400', async () => {
    const res = await fetch(`${base}/delay?ms=40000`);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Value must be an integer between 0 and 30000' });
  });

  it('GET /delay with non-integer ms (12.3) should return 400', async () => {
    const res = await fetch(`${base}/delay?ms=12.3`);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Value must be an integer between 0 and 30000' });
  });

  it('GET unknown path should return 404 and log once (no rid)', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await fetch(`${base}/does-not-exist`);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'not found' });
    expect(spy).toHaveBeenCalledTimes(1);
    const message = String(spy.mock.calls[0][0]);
    expect(message).toContain('[access] 404');
    expect(message).toContain('GET');
    expect(message).toContain('/does-not-exist');
    expect(message).not.toContain('rid=');

    spy.mockRestore();
  });

  it('GET unknown path with safe X-Request-Id should log rid', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await fetch(`${base}/nope`, {
      headers: { 'X-Request-Id': 'xxx-123'},
    });
    expect(res.status).toBe(404);
    expect(spy).toHaveBeenCalledTimes(1);
    const message = String(spy.mock.calls[0][0]);
    expect(message).toContain('rid=xxx-123');

    spy.mockRestore();
  });

  it('GET unknown path with unsafe X-Request-Id should NOT log rid', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await fetch(`${base}/nope2`, {
      headers: { 'X-Request-Id': 'xxx 123' },
    });

    expect(res.status).toBe(404);
    expect(spy).toHaveBeenCalledTimes(1);

    const message = String(spy.mock.calls[0][0]);
    expect(message).not.toContain('rid=');
    spy.mockRestore();
  });

  it('GET unknown path with too-long X-Request-Id should NOT log rig', async ()=> {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await fetch(`${base}/nope3`, {
      headers: { 'X-Request-Id': 'x'.repeat(65) },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'not found' });

    expect(spy).toHaveBeenCalledTimes(1);
    const message = String(spy.mock.calls[0][0]);
    expect(message).not.toContain('rid=');

    spy.mockRestore();
  });

  const successCases = [
    { ms: '0', header: '0' },
    { ms: '1200', header: '1200' },
    { ms: '30000', header: '30000' },
  ];

  for (const { ms, header } of successCases) {
    it(`GET /delay?ms=${ms} should return 200 and X-Delay-MS header ${header}`, async () => {
      const res = await fetch(`${base}/delay?ms=${ms}`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
      expect(res.headers.get('X-Delay-MS')).toBe(header);
      expect(body).toEqual({ delayedMs: Number(ms), now: expect.any(String) });
    });
  }
});
