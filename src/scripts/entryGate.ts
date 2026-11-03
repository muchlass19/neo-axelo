/**
 * F1-03 — Entry gate halaman non-home.
 *
 * Spesifikasi @motion-designer: begitu overlay preloader dibuang dari halaman
 * project, reveal hero (`clipPath: inset(100% 0 0 0)` → `inset(0)`, 1.1s
 * `power3.out`) jadi hal pertama yang user lihat. Kalau dia start sebelum
 * gambar ke-decode, 1.1 detik itu reveal kotak kosong.
 *
 * Jadi reveal nunggu DUA hal: (1) gambar target selesai decode, (2) satu
 * siklus `axelo:remeasure` selesai — kuncinya remeasure, bukan cuma
 * `fonts.ready`, karena split baris yang jalan sebelum font siap bakal
 * kekunci di metrik fallback. Dua-duanya dibatasi cap ~600ms supaya gambar
 * lambat nggak nge-hang halaman.
 */

import { onceRemeasure } from "./remeasure";

const DEFAULT_CAP_MS = 600;

export interface EntryGateOptions {
  /** Elemen gambar (atau wrapper yang berisi `<img>`) yang harus ter-decode. */
  imageTargets?: readonly (HTMLElement | null)[];
  /** Batas tunggu total. Default 600ms. */
  capMs?: number;
}

function decodeImage(target: HTMLElement | null | undefined): Promise<void> {
  if (!target) return Promise.resolve();

  const image =
    target instanceof HTMLImageElement
      ? target
      : target.querySelector("img");

  if (!image) return Promise.resolve();

  if (image.complete && image.naturalWidth > 0) {
    return typeof image.decode === "function"
      ? image.decode().catch(() => undefined)
      : Promise.resolve();
  }

  return new Promise((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

export type EntryGateResult = "ready" | "timeout";

export function waitForEntryGate(
  options: EntryGateOptions = {},
): Promise<EntryGateResult> {
  const capMs = options.capMs ?? DEFAULT_CAP_MS;
  const images = (options.imageTargets ?? []).map(decodeImage);

  const ready = Promise.all([...images, onceRemeasure()]).then(
    () => "ready" as const,
  );

  const cap = new Promise<EntryGateResult>((resolve) => {
    window.setTimeout(() => resolve("timeout"), capMs);
  });

  return Promise.race([ready, cap]);
}
