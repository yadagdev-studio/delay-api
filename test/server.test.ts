import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
