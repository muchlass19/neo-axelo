/**
 * Teks marketing. Pemilik isi: @creative-researcher (T-04).
 *
 * Aturan: string kosong = tidak dirender. Jangan pernah isi lorem ipsum.
 */

export interface ServiceItem {
  label: string;
  description: string;
}

export interface CopyConfig {
  /** T-04: paragraf hero, voice studio-dev. */
  heroIntro: string;
  /**
   * F1-09: meta description buat home + 404, ≤160 karakter.
   * JANGAN pakai `heroIntro` sebagai description — itu paragraf (316 char),
   * kepotong Google di ~155-160 dan bikin hero & SERP punya teks identik.
   */
  metaDescription: string;
  /**
   * F1-16: eyebrow halaman project. Konstanta `Case study`, BUKAN
   * `Case study — {title}`: versi itu mengulang H1 persis di bawahnya, pola yang
   * baru kita buang di 404 ("Error 404" + "404" + statement). Nol wrap di 320.
   */
  caseStudyEyebrow: string;
  /**
   * F1-19 (frame WORK): caption di bawah preview portfolio.
   * `labelPrefix` + angka + nama project, plus link ke case study-nya.
   * Dua string ini dari design render — pending sign-off @creative-researcher.
   */
  work: {
    labelPrefix: string;
    /** Tanpa panah — panahnya jadi `<span aria-hidden>` di markup, jadi screen
     *  reader baca "Open case study" saja. */
    openCaseStudy: string;
  };
  /** F1-05: client index dalam bentuk type (nol aset logo, nol marquee). */
  clients: {
    label: string;
    names: string[];
  };
  /** F1-06. */
  services: {
    label: string;
    heading: string;
    items: ServiceItem[];
  };
  /** F1-07. */
  contact: {
    label: string;
    display: string;
    subline: string;
    whatsappCta: string;
    emailCta: string;
    copyCta: string;
  };
  /** F1-04. */
  footer: {
    navLabel: string;
    contactLabel: string;
    socialsLabel: string;
    backToTop: string;
  };
  /**
   * F1-14 (frame home 1440/375): strip index di bawah headline. Angka-nya
   * DI-DERIVE dari data (jumlah project, klien, layanan) — jangan hardcode,
   * nanti salah sendiri begitu project kelima masuk.
   */
  heroIndex: {
    workLabel: string;
    clientsLabel: string;
    servicesLabel: string;
    /** Pending sign-off @creative-researcher (satu string, bukan struktur). */
    location: string;
  };
}

export const COPY: CopyConfig = {
  heroIntro:
    "Axelo builds websites and digital products for brands in Indonesia — from consumer launches to automotive platforms and part catalogs. Design and development sit in one team, so the people who plan the experience are the ones who ship it. Sites, progressive web apps, catalogs — built to be used, not just looked at.",
  metaDescription:
    "Axelo Dev builds websites, digital products, and progressive web apps for brands in Indonesia — design and development in one team, from wireframe to launch.",
  caseStudyEyebrow: "Case study",
  work: {
    labelPrefix: "Project",
    openCaseStudy: "Open case study ",
  },
  clients: {
    label: "Clients",
    names: [
      "Astra",
      "BYD",
      "Chery",
      "Daihatsu",
      "BCA Life",
      "Danareksa",
    ],
  },
  services: {
    label: "What we do",
    heading: "Design and build, in one team.",
    items: [
      {
        label: "UI Design",
        description:
          "Layout, type, colour, and motion, designed against real content so the page still holds after launch.",
      },
      {
        label: "UX Design",
        description:
          "Models, variants, price lists, part numbers: structured so buyers and workshop staff both find what they need.",
      },
      {
        label: "Web Development",
        description:
          "Astro, TypeScript, Tailwind, and GSAP front ends, plus progressive web apps that install and work offline.",
      },
    ],
  },
  contact: {
    label: "Contact",
    display: "Let's build it.",
    subline:
      "Tell us what you're building and who it's for. A few lines is enough to start.",
    whatsappCta: "Chat on WhatsApp",
    emailCta: "Email us",
    copyCta: "Copy email",
  },
  footer: {
    navLabel: "Menu",
    contactLabel: "Contact",
    socialsLabel: "Socials",
    backToTop: "Back to top",
  },
  heroIndex: {
    workLabel: "Work",
    clientsLabel: "Clients",
    servicesLabel: "Services",
    location: "Based in Indonesia",
  },
};
