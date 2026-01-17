import http from "node:http";
import type { IncomingMessage } from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const MAX_DELAY_MS = 30000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = url.pathname;

  // health check
  if (path === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // delay endpoint
  if (path === "/delay") {
    const msRaw = url.searchParams.get("ms");
    if (msRaw == null || msRaw.trim() === "") {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Value must be an integer between 0 and 30000" }));
      return;
    }
    const msNumber = Number(msRaw);
    if (msNumber < 0 || msNumber > MAX_DELAY_MS || !Number.isInteger(msNumber) || !Number.isFinite(msNumber)) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Value must be an integer between 0 and 30000" }));
      return;
    }
    const ms = msNumber;
    if (process.env.NODE_ENV !== 'test') {
      await sleep(ms);
    }
    res.writeHead(200, { "content-type": "application/json", "X-Delay-MS": String(ms) });
    res.end(JSON.stringify({ delayedMs: ms, now: new Date().toISOString() }));
    return;
  }

  log404(req, path);
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

const getSafeRequestId =(req: IncomingMessage): string | undefined => {
  const xRequestId = req.headers["x-request-id"];
  if (typeof xRequestId !== "string" ) return undefined;
  if (xRequestId.length === 0 || xRequestId.length > 64 ) return undefined;
  if (!/^[A-Za-z0-9._-]+$/.test(xRequestId)) return undefined;

  return xRequestId;
};

const log404 = (req: IncomingMessage, path: string): void => {
  const method: string = req.method ?? "UNKNOWN";
  const rid: string | undefined = getSafeRequestId(req);

  const message = rid
    ? `[access] 404 ${method} ${path} rid=${rid}`
    : `[access] 404 ${method} ${path}`

  console.log(message);
};

export const start = (port: number = PORT): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      console.log(`delay-api listening on ${host} :${port}`);
      resolve();
    });
    server.once('error', err => reject(err));
  });
}

if (process.env.NODE_ENV !== "test") {
  start().catch((err) => {
    console.error("[fatal] failed to start server", err);
    process.exitCode = 1;
  })
}

