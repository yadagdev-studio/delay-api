import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { start, server } from '../src/server';

// 任意のポート番号（存在しないポートを使用すると競合のリスクが低くなります）
const TEST_PORT = 4000;

describe('delay-api server', () => {
  beforeAll(async () => {
    await start(TEST_PORT);
  });

  afterAll(async () => {
    // テスト終了後にサーバーを閉じる
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /healthz should return 200 with ok=true', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/healthz`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(body).toEqual({ ok: true });
  });

  it('GET /delay with valid ms returns 200 and X-Delay-MS header', async () => {
    const ms = 1200;
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=${ms}`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('X-Delay-MS')).toBe(`${ms}`);
    expect(body).toEqual({
      delayedMs: ms,
      now: expect.any(String),
    });
  });

  it('GET /delay without ms should return 400 bad request', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid ms value' });
  });

  it('GET /delay with invalid ms should return 400 bad request', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=invalid`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid ms value' });
  });

  it('GET /delay with ms \u003e MAX_DELAY_MS should return 400 bad request', async () => {
    const largeMs = 40000; // MAX_DELAY_MS は 30000
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=${largeMs}`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid ms value' });
  });
it('GET /delay with ms=0 returns 200 and X-Delay-MS header 0', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=0`);
    const body = await res.json();
    const header = res.headers.get('X-Delay-MS');
    expect(res.status).toBe(200);
    expect(header).toBe('0');
    expect(body).toEqual({ delayedMs: 0, now: expect.any(String) });
  });

  it('GET /delay with non-integer ms (12.3) returns 400', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=12.3`);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid ms value' });
  });
});