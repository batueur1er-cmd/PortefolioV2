// Après le build : écrit les balises de chaque page directement dans le HTML, pour que LinkedIn,
// Discord ou un moteur de recherche (qui n'exécutent pas JavaScript) voient le bon aperçu.
//
//   dist/…/browser/index.html                 l'accueil
//   dist/…/browser/projets/<id>/index.html    une copie par projet, avec ses propres balises
//   dist/…/browser/sitemap.xml, robots.txt    seulement si SITE_URL est renseignée
//
// Les données viennent de src/app/domain/profile/seo.ts : rien à tenir à jour à la main.
//
// Usage : node scripts/seo.mjs            (après ng build)
//         node scripts/seo.mjs --dump     (affiche les pages en JSON, pour les images d'aperçu)

import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const DIST = resolve('dist/portfolio-v2/browser');

const seo = await loadSeo();

if (process.argv.includes('--dump')) {
  console.log(JSON.stringify(seo.PAGES, null, 2));
  process.exit(0);
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
for (const page of seo.PAGES) {
  const html = withTags(template, seo.seoTags(page));
  const dir = page.path === '/' ? DIST : join(DIST, ...page.path.split('/').filter(Boolean));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

if (seo.SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = seo.PAGES.map(
    (p) => `  <url><loc>${seo.SITE_URL}${p.path}</loc><lastmod>${today}</lastmod></url>`,
  ).join('\n');
  writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${seo.SITE_URL}/sitemap.xml\n`);
  console.log(`SEO : ${seo.PAGES.length} pages, sitemap.xml et robots.txt écrits.`);
} else {
  writeFileSync(join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  console.log(`SEO : ${seo.PAGES.length} pages écrites. SITE_URL est vide : pas de sitemap (voir domain/profile/seo.ts).`);
}

for (const page of seo.PAGES) {
  if (!existsSync(join(DIST, page.image))) console.warn(`  ⚠ image d'aperçu absente : ${page.image}`);
}

/** Compile seo.ts (et le profil) en un module temporaire, puis l'importe. */
async function loadSeo() {
  const dir = mkdtempSync(join(tmpdir(), 'pv2-seo-'));
  const outfile = join(dir, 'seo.mjs');
  try {
    await build({
      entryPoints: ['src/app/domain/profile/seo.ts'],
      bundle: true,
      format: 'esm',
      platform: 'node',
      tsconfig: 'tsconfig.json',
      outfile,
      logLevel: 'error',
    });
    return await import(pathToFileURL(outfile).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function escape(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function withTags(html, tags) {
  const lines = [
    `<title>${escape(tags.title)}</title>`,
    `<meta name="description" content="${escape(tags.description)}" />`,
    `<link rel="canonical" href="${escape(tags.url)}" />`,
    `<meta property="og:type" content="${escape(tags.type)}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${escape(tags.title)}" />`,
    `<meta property="og:description" content="${escape(tags.description)}" />`,
    `<meta property="og:url" content="${escape(tags.url)}" />`,
    `<meta property="og:image" content="${escape(tags.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(tags.title)}" />`,
    `<meta name="twitter:description" content="${escape(tags.description)}" />`,
    `<meta name="twitter:image" content="${escape(tags.image)}" />`,
  ].join('\n    ');
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/?>/, '')
    .replace('</head>', `  ${lines}\n  </head>`);
}
