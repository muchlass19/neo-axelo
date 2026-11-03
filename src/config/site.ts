/**
 * T-10 — Sumber tunggal untuk semua nilai yang diisi manual.
 *
 * Aturan:
 * - Field kosong ("") = fitur belum dikonfigurasi. Komponen yang memakainya
 *   merender elemen NON-INTERAKTIF, bukan `href="#"` atau anchor mati.
 * - Isi file ini saja, jangan cari-cari di komponen.
 *
 * Catatan kontrak (dari @backend-dev):
 * - WhatsApp: simpan angka mentah format bebas; normalisasi ke `62…` lewat
 *   normalizeWhatsApp(). `wa.me/0812…` dan `wa.me/+62…` gagal DIAM-DIAM.
 * - mailto: hanya `subject` dan `body` yang di-encode. Alamat email lewat polos.
 */

export interface SocialLink {
  label: string;
  /** URL profil asli. Kosong = belum ada, dirender sebagai teks non-interaktif. */
  url: string;
}

export interface NavLink {
  label: string;
  /** Id section tanpa "#". */
  id: string;
  /** `false` = section-nya belum ada (Fase 1), link tidak dirender. */
  enabled: boolean;
}

export interface SiteConfig {
  name: string;
  /** Domain final. TODO(user): dipakai S-08 (canonical + og:url + sitemap). */
  domain: string;
}

export interface ContactConfig {
  /** Nomor WhatsApp mentah: "0812…", "+62 812-…", atau "62812…". */
  whatsapp: string;
  /** Email tujuan (jangan di-encode). */
  email: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}

export interface ContactCtaConfig {
  label: string;
  /** Id section tujuan CTA (tanpa "#"). Diisi "contact" saat S-04 ada (Fase 1). */
  sectionId: string;
}

export const SITE: SiteConfig = {
  name: "Axelo Dev",
  domain: "",
};

export const CONTACT: ContactConfig = {
  // TODO(user): isi nomor WhatsApp, contoh: "08123456789" atau "+62 812-3456-7890".
  whatsapp: "089685618837",
  // TODO(user): isi email tujuan, contoh: "hello@axelo.dev".
  email: "muchlas@neodigital.co.id",
  whatsappMessage: "Halo Axelo, saya mau ngobrol soal project.",
  emailSubject: "Project inquiry — Axelo",
  emailBody:
    "Halo Axelo,\n\nSaya mau ngobrol soal project.\n\nNama:\nPerusahaan:\nKebutuhan:\nTimeline:",
};

export const CONTACT_CTA: ContactCtaConfig = {
  label: "Let's Work Together",
  sectionId: "",
};

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Work", id: "work", enabled: true },
  // Aktifkan saat section-nya ada (Fase 1): satu baris per section.
  { label: "Services", id: "services", enabled: false },
  { label: "About", id: "about", enabled: false },
  { label: "Contact", id: "contact", enabled: false },
];

export const SOCIALS: readonly SocialLink[] = [
  // TODO(user): isi URL asli tiap platform (T-04).
  { label: "Instagram", url: "" },
  { label: "TikTok", url: "" },
  { label: "LinkedIn", url: "" },
  { label: "X/Twitter", url: "" },
  { label: "GitHub", url: "" },
];

/**
 * Strip semua non-digit, ubah awalan `0` / `8` menjadi `62`, lalu VALIDASI
 * (fail-closed): cuma `62` + 9–13 digit yang lolos (E.164 maks 15 digit).
 * Typo kayak "12", "62 0812…", atau 21 digit wajib balik ke "" — kalau nggak,
 * CTA-nya keliatan hidup, diklik, wa.me buka nomor invalid, dan gagal DIEM-DIEM.
 */
export function normalizeWhatsApp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  let number = digits;
  // "62" + "0…" = typo double-prefix (mis. "62 0812-3456-7890") → 620812…
  // Panjangnya masih lolos E.164, jadi harus ditolak eksplisit di sini.
  if (/^620/.test(number)) return "";
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;

  if (!/^62\d{9,13}$/.test(number)) return "";
  return number;
}

/** `https://wa.me/62…?text=…`, atau "" kalau nomor belum diisi. */
export function whatsappHref(): string {
  const number = normalizeWhatsApp(CONTACT.whatsapp);
  if (!number) return "";
  const text = CONTACT.whatsappMessage.trim();
  return text
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${number}`;
}

/** Nomor siap-tampil/siap-copy, contoh "+628123456789". */
export function whatsappDisplay(): string {
  const number = normalizeWhatsApp(CONTACT.whatsapp);
  return number ? `+${number}` : "";
}

/** `mailto:…` dengan subject/body ter-encode, atau "" kalau email belum diisi. */
export function mailtoHref(): string {
  const email = CONTACT.email.trim();
  if (!email) return "";
  // Fail-closed: "hello@" / "hello axelo.dev" bikin href hidup berisi domain
  // kosong atau spasi mentah yang gagal diem-diem di mail client.
  if (!/^\S+@\S+\.\S+$/.test(email)) return "";
  const params: string[] = [];
  const subject = CONTACT.emailSubject.trim();
  const body = CONTACT.emailBody.trim();
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return params.length ? `mailto:${email}?${params.join("&")}` : `mailto:${email}`;
}

/**
 * Target CTA utama. Urutan: anchor section → WhatsApp → email.
 * "" = belum ada target yang hidup → tombol dirender non-interaktif.
 */
export function contactHref(): string {
  if (CONTACT_CTA.sectionId) return `#${CONTACT_CTA.sectionId}`;
  return whatsappHref() || mailtoHref();
}

export function navLinks(): NavLink[] {
  return NAV_LINKS.filter((link) => link.enabled);
}

/**
 * Cuma http(s) yang boleh masuk ke `<a href>`. Ini satu-satunya jalur nilai
 * manual langsung ke href, jadi skemanya dicek (mis. "javascript:alert(1)"
 * harus ditolak, bukan cuma "nggak kosong").
 */
export function isValidUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function activeSocials(): SocialLink[] {
  return SOCIALS.filter((social) => isValidUrl(social.url));
}
