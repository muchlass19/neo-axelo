/**
 * T-07 — Handler anchor in-page.
 *
 * Aturan kontrak:
 * - HANYA `href="#…"` yang ditangani. `wa.me`, `mailto:`, `http(s)`, dan link
 *   internal biasa dibiarkan polos tanpa `preventDefault` — itu satu-satunya
 *   jalur kontak yang tetap hidup kalau JS/Lenis gagal dimuat.
 * - Lenis dipakai kalau ada (`window.__axeloLenis`), fallback ke scroll native.
 * - Target yang tidak ada di DOM diabaikan sepenuhnya (tidak ada scroll mati).
 * - `prefers-reduced-motion` → lompat langsung, tanpa animasi.
 */

const NAV_HEIGHT_VAR = "--nav-h";

interface LenisLike {
  scrollTo: (
    target: HTMLElement,
    options?: { offset?: number; duration?: number },
  ) => void;
}

interface AnchorWindow extends Window {
  __axeloLenis?: LenisLike;
  __axeloSmoothAnchorsReady?: boolean;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tinggi nav sticky dari CSS var `--nav-h` (0 kalau belum di-set). */
export function navHeight(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    NAV_HEIGHT_VAR,
  );
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

/** Id section yang jadi tujuan anchor, tanpa "#". */
export function anchorId(href: string): string {
  return href.slice(1);
}

function scrollToTarget(target: HTMLElement, href: string): void {
  const offset = -navHeight();
  const state = window as AnchorWindow;
  const lenis = state.__axeloLenis;

  // Target dihitung dari posisi dokumen (bukan diserahkan ke Lenis) supaya
  // jalur Lenis dan jalur native mendarat di titik yang sama.
  const top = target.getBoundingClientRect().top + window.scrollY + offset;

  if (prefersReducedMotion()) {
    window.scrollTo({ top, behavior: "auto" });
  } else if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(top, { duration: 1.1 });
  } else {
    // `scroll-margin-top: var(--nav-h)` di global.css yang mengurus offset.
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (window.location.hash !== href) {
    history.replaceState(null, "", href);
  }
}

export function initSmoothAnchors(): void {
  const state = window as AnchorWindow;
  if (state.__axeloSmoothAnchorsReady) return;
  state.__axeloSmoothAnchorsReady = true;

  document.addEventListener(
    "click",
    (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const origin = event.target;
      if (!(origin instanceof Element)) return;

      const anchor = origin.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Cuma anchor in-page. "#" telanjang dan wa.me/mailto lewat.
      if (!href.startsWith("#") || href.length < 2) return;

      const target = document.getElementById(anchorId(href));
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target, href);

      // Pindahkan fokus ke section supaya user keyboard lanjut dari sana.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    },
    { passive: false },
  );
}
