// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { writeFile } from "node:fs/promises";

import { siteBaseUrl } from "./src/config/site";

// F1-09 — fail-closed. `SITE.domain` kosong (src/config/site.ts) berarti:
// nol `site`, nol canonical, nol og:url, sitemap.xml kosong (nol <loc>),
// robots.txt tanpa baris Sitemap — dan NOL string `vercel.app` di dist/.
// Begitu domain diisi, semuanya nyala tanpa perubahan kode lain.
// Domain SENGAJA tidak pernah di-hardcode di sini: salah isi = canonical + OG
// + sitemap nempel permanen ke URL preview dari hari pertama.
const baseUrl = siteBaseUrl();

export default defineConfig({
  site: baseUrl || undefined,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    {
      name: "axelo-seo-files",
      hooks: {
        "astro:build:done": async ({ dir, pages, logger }) => {
          // Daftar route diambil dari hasil build, jadi tidak ada daftar URL
          // kedua yang bisa basi.
          const routes = pages
            .map((page) => page.pathname)
            .filter((pathname) => !pathname.startsWith("404"));

          if (!baseUrl) {
            await writeFile(new URL("sitemap.xml", dir), "", "utf8");
            await writeFile(
              new URL("robots.txt", dir),
              "User-agent: *\nAllow: /\n",
              "utf8",
            );
            logger.warn(
              "SITE.domain kosong: sitemap.xml ditulis kosong & robots.txt tanpa Sitemap (fail-closed)",
            );
            return;
          }

          const entries = routes
            .map(
              (pathname) =>
                `  <url><loc>${new URL(pathname, baseUrl).href}</loc></url>`,
            )
            .join("\n");

          await writeFile(
            new URL("sitemap.xml", dir),
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
            "utf8",
          );
          await writeFile(
            new URL("robots.txt", dir),
            `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
            "utf8",
          );
          logger.info(
            `seo files: sitemap.xml + robots.txt (${routes.length} URL)`,
          );
        },
      },
    },
  ],
});
