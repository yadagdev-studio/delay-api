import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT ?? 3000);

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
    const msRaw = url.searchParams.get("ms") ?? "500";
    const ms = Math.max(0, Math.min(60_000, Number(msRaw) || 0)); // 0〜60s
    await sleep(ms);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ delayedMs: ms, now: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`delay-api listening on :${PORT}`);
});
