const MAX_RUPEES = 500_000;

export function applyAmountKey(current: string, key: string): string {
  if (key === "back") return current.slice(0, -1);

  if (key === ".") {
    if (current.includes(".")) return current;
    return current ? `${current}.` : "0.";
  }

  if (!/^\d$/.test(key)) return current;

  const base = current === "0" ? "" : current;
  const next = `${base}${key}`;
  const frac = next.split(".")[1];
  if (frac !== undefined && frac.length > 2) return current;

  const n = Number(next);
  if (!Number.isFinite(n) || n > MAX_RUPEES) return current;
  return next;
}

/** Grouped rupees for the amount screen. Keeps a trailing decimal while typing. */
export function formatAmountDigits(raw: string): string {
  if (!raw) return "0";
  const hasDot = raw.includes(".");
  const [wholeRaw, frac] = raw.split(".");
  const whole = Number(wholeRaw || "0");
  const grouped = Number.isFinite(whole) ? whole.toLocaleString("en-IN") : "0";
  if (hasDot) return `${grouped}.${frac ?? ""}`;
  return grouped;
}

export function amountFromDigits(raw: string): number | null {
  if (!raw || raw === "." || raw === "0.") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_RUPEES) return null;
  return Math.round(n * 100) / 100;
}

export function digitsFromAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n * 100) / 100);
}
