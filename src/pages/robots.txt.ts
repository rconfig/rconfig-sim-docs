import type { APIRoute } from 'astro';

// Production allows full crawl and advertises the sitemap. Any non-production
// host (e.g. simdocs.dev.rconfig.com) is fully disallowed so it never competes
// with the canonical site in search results.
const PROD_ORIGIN = 'https://simdocs.rconfig.com';

const allowAll = (sitemapURL: URL) => `\
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

const disallowAll = () => `\
User-agent: *
Disallow: /
`;

export const GET: APIRoute = ({ site }) => {
  const origin = site ? new URL(site).origin : PROD_ORIGIN;
  if (origin !== PROD_ORIGIN) {
    return new Response(disallowAll());
  }
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(allowAll(sitemapURL));
};
