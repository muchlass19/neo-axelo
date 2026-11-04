/**
 * F1-07 — tombol copy untuk kontak (progressive enhancement).
 * Logika inti dari @backend-dev (diuji 5 mode: clipboard ada / noclip / reject /
 * notarget / semua gagal). Ditambah satu hal dari sisi komponen: label tombolnya
 * juga ikut berubah state (`Copied` / `Select to copy`) karena UI kit
 * @figcraft-designer menggambar state tombol, bukan cuma satu pesan status.
 *
 * Kontrak:
 * 1. Tombol di-render `hidden` di markup; script ini yang menampilkannya. Kalau
 *    JS gagal load / di-disable, tombolnya nggak pernah kelihatan — nol tombol
 *    yang diklik terus diem-diem.
 * 2. Nilai yang di-copy diambil dari `data-copy` (diisi dari `src/config/site.ts`),
 *    BUKAN dari textContent tombol (label bisa ter-mask/terpotong).
 * 3. `navigator.clipboard` cuma ada di secure context + butuh user gesture.
 *    Gagal / nggak ada → fallback `execCommand` → terakhir: seleksi teks yang
 *    kelihatan supaya Ctrl/Cmd+C manual tetap bisa.
 * 4. "Copied" HANYA ditulis setelah promise resolve. Gagal = label jujur.
 *
 * Markup:
 *   <div data-copy-group>
 *     <span id="contact-email">{CONTACT.email}</span>
 *     <button type="button" data-copy={CONTACT.email}
 *             data-copy-target="#contact-email" hidden>Copy email</button>
 *     <span data-copy-status role="status" aria-live="polite"></span>
 *   </div>
 *
 * Atribut opsional: `data-copy-done`, `data-copy-manual` (label tombol),
 * `data-copy-done-status`, `data-copy-manual-status` (pesan status).
 */

const DEFAULTS = {
  done: "Copied",
  manual: "Select to copy",
  doneStatus: "Copied",
  manualStatus: "Clipboard tidak tersedia",
} as const;

const LABEL_RESET_MS = 2400;
const STATUS_RESET_MS = 4000;

const statusTimers = new WeakMap<HTMLElement, number>();
const labelTimers = new WeakMap<HTMLElement, number>();

function statusElement(button: HTMLElement): HTMLElement | null {
  return (
    button
      .closest("[data-copy-group]")
      ?.querySelector<HTMLElement>("[data-copy-status]") ??
    button.parentElement?.querySelector<HTMLElement>("[data-copy-status]") ??
    null
  );
}

function setStatus(button: HTMLElement, message: string): void {
  const target = statusElement(button);
  if (!target) return;

  target.textContent = message;

  const previous = statusTimers.get(target);
  if (previous) window.clearTimeout(previous);
  if (!message) return;

  statusTimers.set(
    target,
    window.setTimeout(() => {
      target.textContent = "";
      statusTimers.delete(target);
    }, STATUS_RESET_MS),
  );
}

function labelElement(button: HTMLElement): HTMLElement | null {
  return button.querySelector<HTMLElement>(".copy-label") ?? button;
}

function setLabel(button: HTMLElement, message: string): void {
  const label = labelElement(button);
  const base = label.dataset.copyBase ?? label.textContent ?? "";
  label.dataset.copyBase = base;
  label.textContent = message;

  const previous = labelTimers.get(label);
  if (previous) window.clearTimeout(previous);

  labelTimers.set(
    label,
    window.setTimeout(() => {
      label.textContent = base;
      labelTimers.delete(label);
    }, LABEL_RESET_MS),
  );
}

function targetElement(button: HTMLElement): HTMLElement | null {
  const selector = button.dataset.copyTarget;
  if (!selector) return null;
  try {
    return document.querySelector<HTMLElement>(selector);
  } catch {
    return null; // selector salah = jangan lempar error ke console
  }
}

/** Seleksi teks yang kelihatan — jalur manual kalau clipboard API ditolak. */
function selectVisible(node: HTMLElement | null): void {
  if (!node) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** Jalur terakhir: textarea offscreen + execCommand. */
function copyViaExecCommand(value: string): boolean {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("aria-hidden", "true");
  field.tabIndex = -1;
  field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, value.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  field.remove();
  return ok;
}

export async function copyValue(
  button: HTMLElement,
  value: string,
): Promise<"copied" | "manual"> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return "copied";
    } catch {
      // Ditolak (bukan secure context / dokumen nggak fokus / permission):
      // jangan bilang "Copied", lanjut ke fallback.
    }
  }

  if (copyViaExecCommand(value)) return "copied";

  selectVisible(targetElement(button));
  return "manual";
}

export function initCopyButtons(root: ParentNode = document): void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>("[data-copy]"));
  if (!buttons.length) return;

  for (const button of buttons) {
    const value = (button.dataset.copy ?? "").trim();
    // Nilai dari config kosong = tombol tetap `hidden`. Fail-closed.
    if (!value) continue;

    button.hidden = false;

    button.addEventListener("click", async () => {
      const result = await copyValue(button, value);
      const copied = result === "copied";

      setLabel(
        button,
        copied
          ? (button.dataset.copyDone ?? DEFAULTS.done)
          : (button.dataset.copyManual ?? DEFAULTS.manual),
      );

      const statusMessage = copied
        ? `${button.dataset.copyDoneStatus ?? DEFAULTS.doneStatus}: ${value}`
        : `${button.dataset.copyManualStatus ?? DEFAULTS.manualStatus}. Teks ${value} sudah dipilih — tekan Ctrl atau Command + C.`;

      setStatus(button, statusMessage);
    });
  }
}
