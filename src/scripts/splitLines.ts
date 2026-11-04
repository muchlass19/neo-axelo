/**
 * Split manual per baris visual, tanpa plugin SplitText.
 *
 * Pecah jadi kata (inline-block agar `offsetTop` stabil), kelompokkan
 * berdasarkan `offsetTop`, bungkus tiap baris pakai mask (`.about-line-mask`).
 *
 * SATU implementasi untuk seluruh situs — halaman project dan semua section
 * baru. Sebelumnya fungsi ini hidup di dalam `pages/projects/[slug].astro`;
 * dipindah ke sini supaya `reveal.ts` nggak menulis splitter kedua.
 *
 * PENTING: fungsi ini mengganti `innerHTML` target jadi satu alur teks. JANGAN
 * dipakai pada container yang punya anak elemen block (list/grid) — layout-nya
 * bakal rata jadi satu paragraf. Untuk kasus itu pakai `childTargets()`.
 */
export function splitIntoVisualLines(target: HTMLElement): HTMLElement[] {
  if (!target.dataset.original) {
    target.dataset.original = (target.textContent ?? "").trim().replace(/\s+/g, " ");
  }

  const words = (target.dataset.original ?? "").split(" ").filter(Boolean);
  target.innerHTML = "";

  const wordEls = words.map((word) => {
    const span = document.createElement("span");
    span.className = "about-word";
    span.textContent = word;
    target.appendChild(span);
    target.appendChild(document.createTextNode(" "));
    return span;
  });

  const grouped: HTMLElement[][] = [];
  let current: HTMLElement[] = [];
  let lastTop: number | null = null;

  wordEls.forEach((el) => {
    if (lastTop === null || Math.abs(el.offsetTop - lastTop) > 2) {
      if (current.length) grouped.push(current);
      current = [el];
      lastTop = el.offsetTop;
    } else {
      current.push(el);
    }
  });
  if (current.length) grouped.push(current);

  target.innerHTML = "";
  return grouped.map((lineWords) => {
    const mask = document.createElement("span");
    mask.className = "about-line-mask";
    const inner = document.createElement("span");
    inner.className = "about-line";
    lineWords.forEach((word, index) => {
      inner.appendChild(word);
      if (index < lineWords.length - 1) inner.appendChild(document.createTextNode(" "));
    });
    mask.appendChild(inner);
    target.appendChild(mask);
    return inner;
  });
}

/**
 * Container yang isinya anak elemen (list/grid): tiap anak diperlakukan sebagai
 * satu "baris". Dipakai `reveal.ts` supaya stagger tetap satu gestur dari
 * container, tanpa merusak layout-nya.
 */
export function childTargets(target: HTMLElement): HTMLElement[] {
  return Array.from(target.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
}

/** Container ini alur teks (aman di-split) atau punya anak elemen (jangan)? */
export function isTextFlow(target: HTMLElement): boolean {
  return childTargets(target).length === 0;
}
