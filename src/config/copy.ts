/**
 * Teks marketing. Pemilik isi: @creative-researcher (T-04).
 *
 * Aturan: string kosong = tidak dirender. Jangan pernah isi lorem ipsum.
 */

export interface CopyConfig {
  /** T-04: paragraf hero, voice studio-dev. */
  heroIntro: string;
  /**
   * F1-09: meta description buat home + 404, ≤160 karakter.
   * JANGAN pakai `heroIntro` sebagai description — itu paragraf (316 char),
   * kepotong Google di ~155-160 dan bikin hero & SERP punya teks identik.
   */
  metaDescription: string;
}

export const COPY: CopyConfig = {
  heroIntro:
    "Axelo builds websites and digital products for brands in Indonesia — from consumer launches to automotive platforms and part catalogs. Design and development sit in one team, so the people who plan the experience are the ones who ship it. Sites, progressive web apps, catalogs — built to be used, not just looked at.",
  metaDescription:
    "Axelo Dev builds websites, digital products, and progressive web apps for brands in Indonesia — design and development in one team, from wireframe to launch.",
};
