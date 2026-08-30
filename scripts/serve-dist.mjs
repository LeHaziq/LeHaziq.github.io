import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const generatedRoot = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const host = process.env.PORTFOLIO_PREVIEW_HOST || "127.0.0.2";
const port = Number(process.env.PORTFOLIO_PREVIEW_PORT) || 4381;
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function generatedPath(pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const path = resolve(generatedRoot, relativePath);
  return path.startsWith(`${generatedRoot}${sep}`) ? path : undefined;
}

async function responseFile(pathname) {
  const path = generatedPath(pathname);
  if (path) {
    try {
      if ((await stat(path)).isFile()) {
        return { path, status: pathname === "/404.html" ? 404 : 200 };
      }
    } catch {
      // Unknown paths use the generated 404 document.
    }
  }
  return { path: resolve(generatedRoot, "404.html"), status: 404 };
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const file = await responseFile(decodeURIComponent(requestUrl.pathname));
    const contents = await readFile(file.path);
    response.writeHead(file.status, {
      "Content-Length": contents.byteLength,
      "Content-Type": contentTypes.get(extname(file.path)) ?? "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Static preview failed.");
    console.error(error);
  }
});

server.listen(port, host, () => {
  console.log(`Static Portfolio listening at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit()));
}
