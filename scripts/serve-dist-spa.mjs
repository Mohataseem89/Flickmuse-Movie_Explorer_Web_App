import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const DIST = resolve("dist");
const PORT = Number(process.env.PORT || process.argv[2] || 4174);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/\\/g, "/");
  const relative = normalize(decoded).replace(/^([/\\])+/, "");
  const candidate = resolve(DIST, relative);
  return candidate.startsWith(DIST) ? candidate : null;
}

function resolveFile(pathname) {
  const candidate = safePath(pathname);

  if (candidate && existsSync(candidate)) {
    const stat = statSync(candidate);
    if (stat.isFile()) return candidate;

    const nestedIndex = join(candidate, "index.html");
    if (stat.isDirectory() && existsSync(nestedIndex)) return nestedIndex;
  }

  // Client-side routes that do not have generated SEO HTML still need a
  // successful application document when loaded directly.
  return join(DIST, "index.html");
}

createServer((req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const file = resolveFile(url.pathname);
    const extension = extname(file).toLowerCase();

    res.statusCode = 200;
    res.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
    res.setHeader("Cache-Control", extension === ".html" ? "no-cache" : "public, max-age=3600");

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    createReadStream(file)
      .on("error", () => {
        res.statusCode = 500;
        res.end("Unable to read application file.");
      })
      .pipe(res);
  } catch {
    res.statusCode = 400;
    res.end("Bad request.");
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`FlickMuse SPA audit server listening on http://127.0.0.1:${PORT}`);
});
