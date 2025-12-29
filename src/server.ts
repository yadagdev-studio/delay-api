import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const MAX_DELAY_MS = 30000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const server = http.createServer(async (req, res) => {
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
      res.end(JSON.stringify({ error: "bad request" }));
      return;
    }
    const msNumber = Number(msRaw);
    if (!Number.isFinite(msNumber) || !Number.isInteger(msNumber) || msNumber < 0 || msNumber > MAX_DELAY_MS) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "bad request" }));
      return;
    }
    const ms = msNumber;
    await sleep(ms);
    res.writeHead(200, { "content-type": "application/json", "X-Delay-MS": String(ms) });
    res.end(JSON.stringify({ delayedMs: ms, now: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

export function start(port: number = PORT): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      console.log(`delay-api listening on ${host} :${port}`);
      resolve();
    });
    server.on('error', err => reject(err));
  });
}

export { server };

