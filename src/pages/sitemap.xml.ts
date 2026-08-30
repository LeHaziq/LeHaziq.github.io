import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const rootUrl = new URL("/", site);
  const contents = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${rootUrl}</loc></url>
</urlset>
`;

  return new Response(contents, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
