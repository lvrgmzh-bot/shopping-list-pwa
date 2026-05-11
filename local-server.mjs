import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 8080);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
};

http
  .createServer(async (request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    let filePath = path.join(root, decodeURIComponent(url.pathname));

    if (url.pathname.endsWith("/")) {
      filePath = path.join(filePath, "index.html");
    }

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const file = await fs.readFile(filePath);
      response.writeHead(200, {
        "content-type": types[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(file);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Shopping list PWA: http://127.0.0.1:${port}/`);
  });
