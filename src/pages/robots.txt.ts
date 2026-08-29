import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const indexingEnabled = import.meta.env.SITE_INDEXING === "enabled";
  const body = indexingEnabled
    ? `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap-index.xml", site).href}\n`
    : "User-agent: *\nDisallow: /\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
