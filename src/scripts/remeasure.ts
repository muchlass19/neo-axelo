/**
 * T-08 — Hook remeasure tunggal.
 *
 * Kenapa ada: font self-host (T-01) mengubah metrik teks SETELAH pengukuran
 * pertama. Semua nilai yang diukur sekali di `load` (tinggi container spotlight,
 * grouping baris `splitIntoVisualLines`, lebar label Button, posisi-x logo
 * marquee) jadi salah dan cuma bisa dibetulkan dengan mengukur ulang.
 *
 * Satu sumber sinyal, banyak pendengar:
 *   document.addEventListener("axelo:remeasure", handler)
 *   atau pakai onRemeasure(handler) di bawah.
 *
 * Kapan di-fire: `document.fonts.ready`, `load`, dan resize/orientationchange
 * yang sudah di-debounce.
 */

export const REMEASURE_EVENT = "axelo:remeasure";

const RESIZE_SETTLE_MS = 150;

interface RemeasureWindow extends Window {
  __axeloRemeasureReady?: boolean;
  __axeloRemeasureFired?: boolean;
}

function dispatchRemeasure(): void {
  const state = window as RemeasureWindow;
  state.__axeloRemeasureFired = true;
  document.dispatchEvent(new CustomEvent(REMEASURE_EVENT));
}

export function initRemeasure(): void {
  const state = window as RemeasureWindow;
  if (state.__axeloRemeasureReady) return;
  state.__axeloRemeasureReady = true;

  const fire = (): void => {
    // Satu frame jeda: pastikan font/layout sudah benar-benar ter-paint.
    requestAnimationFrame(dispatchRemeasure);
  };

  let settleTimer = 0;
  const schedule = (): void => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(fire, RESIZE_SETTLE_MS);
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(fire).catch(() => {
      /* font gagal dimuat: layout fallback tetap jalan, tidak perlu di-throw */
    });
  }

  if (document.readyState === "complete") {
    fire();
  } else {
    window.addEventListener("load", fire, { once: true });
  }

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
}

/**
 * Daftarkan pengukur. Mengembalikan fungsi unsubscribe.
 * Kalau remeasure sudah pernah terjadi sebelum komponen ini daftar (script
 * dimuat belakangan), callback langsung dipanggil supaya nggak ada komponen
 * yang ketinggalan pakai metrik font fallback.
 */
export function onRemeasure(handler: () => void): () => void {
  const listener = (): void => handler();
  document.addEventListener(REMEASURE_EVENT, listener);

  if ((window as RemeasureWindow).__axeloRemeasureFired) {
    requestAnimationFrame(listener);
  }

  return () => document.removeEventListener(REMEASURE_EVENT, listener);
}
