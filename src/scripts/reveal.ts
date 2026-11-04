/**
 * F1-04/05/06/07 — reveal section baru. IO-driven, satu implementasi.
 *
 * Kontrak markup (disepakati @figcraft-designer + @motion-designer):
 *   data-reveal="lines|fade|clip"
 *   data-reveal-stagger="0.08"   (opsional)
 *   data-reveal-duration="0.7"   (opsional)
 *   data-reveal-delay="0.15"     (opsional)
 *
 * Aturan sistem (ruling @motion-designer):
 * - Mask-block dua lapis (orange + white) EKSKLUSIF hero, di-hand-build di
 *   Preloader.astro. Karena itu `mask` sengaja bukan bagian dari kontrak ini:
 *   idiom itu butuh wrapper `width: max-content`, properti yang justru dilarang
 *   di section baru (sumber overflow +102).
 * - Semua section baru pakai satu arah: muncul dari tepi bawah.
 * - `data-reveal="lines"` pada alur teks → split baris + mask (idiom halaman
 *   project). Pada container beranak elemen (list/grid) → tiap anak jadi satu
 *   "baris", supaya grid-nya nggak diratakan splitter teks.
 * - `prefers-reduced-motion` → final state instan, nol IntersectionObserver,
 *   nol `gsap.set` awal (nggak ada yang pernah ke-hide).
 * - FAILSAFE: kalau IO nggak fire dalam 2.5s, paksa final state. `yPercent: 115`
 *   yang nggak pernah dibalikin = teks yang nggak pernah muncul.
 */

import gsap from "gsap";
import { onRemeasure } from "./remeasure";
import { childTargets, isTextFlow, splitIntoVisualLines } from "./splitLines";

export type RevealKind = "lines" | "fade" | "clip";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const FAILSAFE_MS = 2500;

const DEFAULT_DURATION: Record<RevealKind, number> = {
  lines: 0.7,
  fade: 0.5,
  clip: 0.8,
};
const DEFAULT_STAGGER: Record<RevealKind, number> = {
  lines: 0.08,
  fade: 0.08,
  clip: 0,
};

interface RevealEntry {
  el: HTMLElement;
  kind: RevealKind;
  duration: number;
  stagger: number;
  delay: number;
  targets: HTMLElement[];
  /** `lines` pada container beranak elemen (list/grid) → mode fade-up per anak. */
  childMode: boolean;
  /** Mode target yang sudah dikunci untuk elemen ini (lihat resolveMode). */
  mode: RevealMode;
  revealed: boolean;
  failsafe: number;
}

const prefersReducedMotion = (): boolean =>
  window.matchMedia(REDUCED_QUERY).matches;

const number = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

function kindOf(el: HTMLElement): RevealKind | null {
  const raw = el.dataset.reveal;
  return raw === "lines" || raw === "fade" || raw === "clip" ? raw : null;
}

/**
 * Mode target per elemen, DIKUNCI saat pertama dilihat.
 *
 * Kenapa harus dikunci: `splitIntoVisualLines` mengubah `<p>` jadi container
 * yang berisi anak elemen (mask + baris). Kalau klasifikasinya dihitung ulang
 * (mis. saat remeasure re-split), elemen yang sama akan kebaca sebagai
 * "container beranak elemen" → baris-barisnya ditinggal di 115% dan yang
 * dianimasikan justru mask-nya. Itu yang bikin teks nggak pernah muncul.
 */
type RevealMode = "text" | "children" | "self";

function resolveMode(el: HTMLElement, kind: RevealKind): RevealMode {
  if (kind === "clip") return "self";

  const stored = el.dataset.revealMode;
  if (stored === "text" || stored === "children") return stored;

  const mode: RevealMode = isTextFlow(el) ? "text" : "children";
  el.dataset.revealMode = mode;
  return mode;
}

/** Susun target final untuk sebuah entry (dipanggil awal + setiap remeasure). */
function applyInitial(entry: RevealEntry): void {
  const { el, kind } = entry;
  const mode = resolveMode(el, kind);
  entry.mode = mode;

  if (kind === "clip") {
    entry.childMode = false;
    entry.targets = [el];
    gsap.set(el, { clipPath: "inset(100% 0 0 0)" });
    return;
  }

  if (kind === "fade") {
    entry.childMode = mode === "children";
    entry.targets = entry.childMode ? childTargets(el) : [el];
    gsap.set(entry.targets, { opacity: 0 });
    return;
  }

  // lines
  if (mode === "text") {
    entry.childMode = false;
    entry.targets = splitIntoVisualLines(el);
    gsap.set(entry.targets, { yPercent: 115 });
    return;
  }

  entry.childMode = true;
  entry.targets = childTargets(el);
  gsap.set(entry.targets, { yPercent: 0, y: 32, opacity: 0 });
}

function finalState(entry: RevealEntry): void {
  if (entry.kind === "clip") {
    gsap.set(entry.el, { clipPath: "inset(0% 0 0 0)" });
    return;
  }
  if (entry.kind === "fade") {
    gsap.set(entry.targets, { opacity: 1 });
    return;
  }
  if (entry.childMode) {
    gsap.set(entry.targets, { yPercent: 0, y: 0, opacity: 1 });
    return;
  }
  gsap.set(entry.targets, { yPercent: 0 });
}

function reveal(entry: RevealEntry): void {
  if (entry.revealed) return;
  entry.revealed = true;
  entry.el.dataset.revealState = "revealed";
  window.clearTimeout(entry.failsafe);

  if (entry.kind === "clip") {
    gsap.to(entry.el, {
      clipPath: "inset(0% 0 0 0)",
      duration: entry.duration,
      ease: "power3.out",
      delay: entry.delay,
    });
    return;
  }

  if (entry.kind === "fade") {
    gsap.to(entry.targets, {
      opacity: 1,
      duration: entry.duration,
      ease: "power2.out",
      stagger: entry.stagger,
      delay: entry.delay,
    });
    return;
  }

  gsap.to(entry.targets, {
    yPercent: 0,
    y: 0,
    opacity: 1,
    duration: entry.duration,
    ease: "power3.out",
    stagger: entry.stagger,
    delay: entry.delay,
  });
}

interface RevealWindow extends Window {
  __axeloRevealsReady?: boolean;
  __axeloRevealRuns?: number;
}

export function initReveals(): void {
  const state = window as RevealWindow;

  // Idempoten: pemanggilan kedua bikin DUA entry per elemen, dan entry kedua
  // yang masih "belum reveal" bakal nge-split ulang setelah yang pertama
  // reveal — hasilnya baris yang tampil nyangkut di yPercent 115.
  state.__axeloRevealRuns = (state.__axeloRevealRuns ?? 0) + 1;
  if (state.__axeloRevealsReady) return;
  state.__axeloRevealsReady = true;

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-reveal]"),
  );
  if (elements.length === 0) return;

  const entries: RevealEntry[] = elements.map((el) => {
    const kind = kindOf(el) ?? "fade";
    const entry: RevealEntry = {
      el,
      kind,
      duration: number(el.dataset.revealDuration, DEFAULT_DURATION[kind]),
      stagger: number(el.dataset.revealStagger, DEFAULT_STAGGER[kind]),
      delay: number(el.dataset.revealDelay, 0),
      targets: [],
      childMode: false,
      mode: "self",
      revealed: false,
      failsafe: 0,
    };
    return entry;
  });

  if (prefersReducedMotion()) {
    // Nol IO, nol hide: teks cuma butuh tampil.
    entries.forEach((entry) => {
      entry.targets = [entry.el];
      reveal(entry);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (observed) => {
      observed.forEach((record) => {
        if (!record.isIntersecting) return;
        const entry = entries.find((item) => item.el === record.target);
        if (!entry) return;
        reveal(entry);
        observer.unobserve(record.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
  );

  entries.forEach((entry) => {
    applyInitial(entry);
    entry.failsafe = window.setTimeout(() => reveal(entry), FAILSAFE_MS);
    observer.observe(entry.el);
  });

  // T-08: font swap mengubah pembagian baris → susun ulang. Cuma entry yang
  // BELUM reveal yang di-split ulang: menyentuh yang sudah reveal cuma bikin
  // baris yang sedang tampil lompat (dan dulu ninggalin state 115%).
  onRemeasure(() => {
    entries.forEach((entry) => {
      if (entry.kind === "clip" || entry.revealed) return;
      applyInitial(entry);
      // Amankan ulang: split ulang = target baru, jadi timer failsafe lama
      // (kalau sudah kepakai) nggak lagi menunjuk elemen yang benar.
      window.clearTimeout(entry.failsafe);
      entry.failsafe = window.setTimeout(() => reveal(entry), FAILSAFE_MS);
    });
  });
}
