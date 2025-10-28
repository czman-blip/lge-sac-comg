export type PdfTextVisibilityResult = {
  pass: boolean;
  issues: string[];
};

function describe(el: Element, msg: string, extra: Record<string, unknown>) {
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : "";
  const cls = (el as HTMLElement).className
    ? `.${String((el as HTMLElement).className)
        .toString()
        .split(" ")
        .slice(0, 3)
        .join(".")}`
    : "";
  return `${el.tagName}${id}${cls}: ${msg} ${JSON.stringify(extra)}`;
}

export function runPdfTextVisibilityTest(root: HTMLElement = document.body): PdfTextVisibilityResult {
  const issues: string[] = [];
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>("input, textarea, button[aria-haspopup='listbox']")
  );

  candidates.forEach((el) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const height = rect.height;
    const fontSize = parseFloat(cs.fontSize || "0");
    const lineHeight = cs.lineHeight === "normal" ? 1.2 * fontSize : parseFloat(cs.lineHeight || "0");
    const pt = parseFloat(cs.paddingTop || "0");
    const pb = parseFloat(cs.paddingBottom || "0");
    const bt = parseFloat(cs.borderTopWidth || "0");
    const bb = parseFloat(cs.borderBottomWidth || "0");

    const contentBox = height - pt - pb - bt - bb;

    if (lineHeight < fontSize * 1.2) {
      issues.push(describe(el, "line-height too small", { lineHeight, fontSize }));
    }
    if (pb < 6) {
      issues.push(describe(el, "padding-bottom < 6px", { pb }));
    }
    if (contentBox < fontSize + 2) {
      issues.push(describe(el, "content height < font size", { contentBox, fontSize }));
    }

    // Special case for select trigger value span
    if (el.matches("button[aria-haspopup='listbox']")) {
      const span = el.querySelector("span");
      if (span) {
        const scs = getComputedStyle(span);
        const sFont = parseFloat(scs.fontSize || "0");
        const sLine = scs.lineHeight === "normal" ? 1.2 * sFont : parseFloat(scs.lineHeight || "0");
        if (sLine < sFont * 1.2) {
          issues.push(describe(el, "select value line-height too small", { sLine, sFont }));
        }
      }
    }
  });

  return { pass: issues.length === 0, issues };
}
