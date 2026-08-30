import type { APIRoute } from "astro";
import { productionIndexing } from "../release";

export const GET: APIRoute = ({ site }) => {
  const contents = productionIndexing
    ? `User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap.xml", site)}\n`
    : "User-agent: *\nDisallow: /\n";

  return new Response(contents, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
