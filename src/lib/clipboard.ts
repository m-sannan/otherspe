type SelectableField = {
  focus(): void;
  select(): void;
  setSelectionRange(start: number, end: number): void;
  value: string;
};

/**
 * Copy must run in the same tick as the click. Brave (and some in-app browsers)
 * hang on clipboard.writeText waiting for a permission, so we never await that
 * first — execCommand on a selected field is the path that actually works.
 */
export function copyTextNow(text: string, field?: SelectableField | null): boolean {
  if (!text || typeof document === "undefined") return false;

  if (field) {
    try {
      field.focus();
      field.select();
      field.setSelectionRange(0, field.value.length);
      if (document.execCommand("copy")) return true;
    } catch {
      /* try the textarea fallback */
    }
  }

  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.setAttribute("aria-hidden", "true");
  // Brave ignores 1×1 opacity-0 nodes. Keep it in the layout, just tiny.
  el.style.cssText =
    "position:fixed;top:8px;left:8px;width:64px;height:24px;opacity:0.01;z-index:2147483647;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  el.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

export async function copyText(
  text: string,
  field?: SelectableField | null,
): Promise<boolean> {
  if (copyTextNow(text, field)) return true;
  if (!text) return false;
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof window !== "undefined" &&
      window.isSecureContext &&
      navigator.clipboard?.writeText
    ) {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("clipboard-timeout")), 400);
        }),
      ]);
      return true;
    }
  } catch {
    /* give up */
  }
  return false;
}
