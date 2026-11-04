/**
 * Daftar project — sumber tunggal.
 *
 * Sebelumnya hidup di dalam `SpotlightPortfolio.astro`. Dipindah ke sini supaya
 * jumlahnya bisa di-derive (strip index hero, "01/04") tanpa nulis angka dua
 * kali: angka yang di-hardcode bakal salah sendiri begitu project ke-5 masuk.
 */
import type { ImageMetadata } from "astro";

import anessaWeb from "../../public/projects/anessa/anessa-web.png";
import daihatsuWeb from "../../public/projects/daihatsu-web.png";
import daihatsuOm from "../../public/projects/daihatsu-om.png";
import daihatsuSparepart from "../../public/projects/daihatsu-sparepart.png";

export interface ProjectDefinition {
  image: ImageMetadata;
  name: string;
  /**
   * Bentuk pendek untuk section WORK (design: `ANESSA WEB`, `DAIHATSU OM`, …).
   * Judul penuh bikin 2 dari 4 nama pecah 2 baris di kolom kiri (terukur 475px
   * vs kolom ~511px), sementara bentuk pendek semuanya satu baris.
   */
  shortName: string;
  summary: string;
  link: string;
}

export const PROJECTS: ProjectDefinition[] = [
  {
    image: anessaWeb,
    name: "Anessa Main Website",
    shortName: "Anessa Web",
    summary: "Corporate marketing site for Anessa skincare",
    link: "/projects/anessa-web",
  },
  {
    image: daihatsuWeb,
    name: "Daihatsu Main Website",
    shortName: "Daihatsu Web",
    summary: "Official landing page for Daihatsu vehicles",
    link: "/projects/daihatsu-web",
  },
  {
    image: daihatsuOm,
    name: "Daihatsu Owner Manual PWA",
    shortName: "Daihatsu OM",
    summary: "Progressive web app for vehicle owner manuals",
    // Bug: href-nya relatif (tanpa `/`) — dari home kebetulan jalan, dari halaman
    // yang lebih dalam nggak. Disamain sama tiga project lain.
    link: "/projects/daihatsu-om",
  },
  {
    image: daihatsuSparepart,
    name: "Daihatsu Sparepart Catalog",
    shortName: "Daihatsu Sparepart",
    summary: "Digital catalog for genuine Daihatsu spare parts",
    link: "/projects/daihatsu-sparepart",
  },
];

export const paddedProjectCount = (): string =>
  String(PROJECTS.length).padStart(2, "0");
