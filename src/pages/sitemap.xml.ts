import type { APIRoute } from 'astro';

export const prerender = true;

const SITE_URL = 'https://eleamteresitadejesus.cl';

const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/servicios-e-instalaciones', priority: '0.9', changefreq: 'monthly' },
  { path: '/quienes-somos', priority: '0.8', changefreq: 'monthly' },
  { path: '/testimonios', priority: '0.8', changefreq: 'monthly' },
];

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
