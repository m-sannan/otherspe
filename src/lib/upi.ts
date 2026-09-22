const VPA_RE =
  /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{1,64}$/;

export type UpiSource = "upi-uri" | "vpa" | "bharat-qr" | "http-wrapper";

export type UpiPayload = {
  vpa: string;
  name: string;
  amount: number | null;
  currency: string;
  note: string;
  mcc: string;
  txnRef: string;
  source: UpiSource;
  raw: string;
};

export type UpiParseResult =
  | { ok: true; payload: UpiPayload }
  | { ok: false; error: string };

export const SAMPLE_VPA = "guptakirana@okhdfcbank";

export const SAMPLE_UPI_URI =
  "upi://pay?pa=guptakirana@okhdfcbank&pn=Gupta%20Kirana&cu=INR&tn=Store%20payment";

export function isDemoPayload(payload: Pick<UpiPayload, "vpa">): boolean {
  return payload.vpa.toLowerCase() === SAMPLE_VPA;
}

export function parseUpi(rawInput: string): UpiParseResult {
  let raw = rawInput.trim();
  if (!raw) {
    return { ok: false, error: "Nothing to read. Drop a QR image or paste a UPI link." };
  }

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }

  const lower = raw.toLowerCase();

  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:")
  ) {
    return { ok: false, error: "That is not a UPI payment QR." };
  }

  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    const uri = safeUri(raw);
    if (uri && uri.searchParams.get("pa")) {
      return parseUpi(`upi://pay?${uri.searchParams.toString()}`);
    }
    return {
      ok: false,
      error: "That looks like a web link, not a UPI QR. Paste the upi://pay link instead.",
    };
  }

  if (raw.startsWith("0002")) {
    const fromBharat = parseBharatQr(raw);
    if (fromBharat) return { ok: true, payload: fromBharat };
    return {
      ok: false,
      error: "Bharat QR found, but no UPI ID inside it.",
    };
  }

  let vpa = "";
  let name = "";
  let amountStr = "";
  let currency = "INR";
  let note = "";
  let mcc = "";
  let txnRef = "";
  let source: UpiSource = "vpa";

  if (lower.startsWith("upi://")) {
    source = "upi-uri";
    const uri = safeUri(raw);
    const params = uri?.searchParams;
    if (params) {
      vpa = params.get("pa") ?? "";
      name = params.get("pn") ?? "";
      amountStr = params.get("am") ?? "";
      currency = (params.get("cu") || "INR").toUpperCase();
      note = params.get("tn") ?? "";
      mcc = params.get("mc") ?? "";
      txnRef = params.get("tr") ?? "";
    } else {
      vpa = queryFallback(raw, "pa") ?? "";
      name = queryFallback(raw, "pn") ?? "";
      amountStr = queryFallback(raw, "am") ?? "";
      currency = (queryFallback(raw, "cu") || "INR").toUpperCase();
      note = queryFallback(raw, "tn") ?? "";
      mcc = queryFallback(raw, "mc") ?? "";
      txnRef = queryFallback(raw, "tr") ?? "";
    }
  } else if (raw.includes(" ") || raw.includes("\n")) {
    return {
      ok: false,
      error: "Malformed UPI ID. It should look like name@okhdfcbank.",
    };
  } else {
    vpa = raw;
  }

  const cleanVpa = sanitize(vpa).toLowerCase();
  if (!VPA_RE.test(cleanVpa)) {
    return {
      ok: false,
      error:
        "No UPI ID found. This QR is not a payment QR, or it uses a format we do not read yet.",
    };
  }

  if (currency && currency !== "INR") {
    return { ok: false, error: `Only INR is supported (got ${currency}).` };
  }

  const amount = parseAmount(amountStr);
  const cleanName = sanitize(name);
  const handle = cleanVpa.split("@")[0] ?? "Payee";
  const fallbackName = handle.charAt(0).toUpperCase() + handle.slice(1);

  return {
    ok: true,
    payload: {
      vpa: cleanVpa,
      name: cleanName || fallbackName,
      amount,
      currency: "INR",
      note: sanitize(note),
      mcc: sanitize(mcc),
      txnRef: sanitize(txnRef),
      source,
      raw,
    },
  };
}

export function buildUpiUri(input: {
  vpa: string;
  name: string;
  amount: number;
  note?: string;
  mcc?: string;
  txnRef?: string;
}): string {
  const vpa = input.vpa.trim();
  const parts: string[] = [`pa=${vpa}`];
  if (input.name.trim()) parts.push(`pn=${encodeURIComponent(input.name.trim())}`);
  if (input.mcc?.trim()) parts.push(`mc=${encodeURIComponent(input.mcc.trim())}`);
  const tr = input.txnRef?.trim() || `OP${Date.now().toString(36).toUpperCase()}`;
  parts.push(`tr=${encodeURIComponent(tr)}`);
  if (input.note?.trim()) parts.push(`tn=${encodeURIComponent(input.note.trim())}`);
  parts.push(`am=${input.amount.toFixed(2)}`);
  parts.push("cu=INR");
  return `upi://pay?${parts.join("&")}`;
}

/** String encoded into the QR the friend should scan inside GPay / PhonePe. */
export function buildQrPayload(input: {
  payload: UpiPayload;
  amount: number;
  note?: string;
  txnRef?: string;
}): string {
  if (input.payload.source === "bharat-qr" && input.payload.raw.startsWith("0002")) {
    return rebuildBharatQr(input.payload.raw, input.amount);
  }
  return buildUpiUri({
    vpa: input.payload.vpa,
    name: input.payload.name,
    amount: input.amount,
    note: input.note,
    mcc: input.payload.mcc,
    txnRef: input.txnRef,
  });
}

export function formatInrPretty(amount: number): string {
  const paise = Math.round(amount * 100) % 100;
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: paise === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatInr(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


export function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0 || n > 500000) return null;
  return Math.round(n * 100) / 100;
}

export function buildShareText(input: {
  payeeName: string;
  amount: number;
  payPageUrl: string;
}): string {
  return [
    `Pay ₹${formatInrPretty(input.amount)} to ${input.payeeName}`,
    "",
    "Open this page, then tap Google Pay — or scan the QR.",
    input.payPageUrl,
  ].join("\n");
}


function sanitize(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>|&[a-zA-Z0-9#]+;/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

function safeUri(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function queryFallback(raw: string, key: string): string | null {
  const match = new RegExp(`[?&]${key}=([^&]+)`, "i").exec(raw);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function parseTlv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of parseTlvList(payload)) {
    if (!(field.tag in out)) out[field.tag] = field.value;
  }
  return out;
}

function parseTlvList(payload: string): { tag: string; value: string }[] {
  const out: { tag: string; value: string }[] = [];
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number.parseInt(payload.slice(i + 2, i + 4), 10);
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > payload.length) break;
    out.push({ tag, value: payload.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  return out;
}

function serializeTlv(fields: { tag: string; value: string }[]): string {
  return fields
    .map((f) => `${f.tag}${String(f.value.length).padStart(2, "0")}${f.value}`)
    .join("");
}

/** EMVCo QR CRC-16-CCITT (poly 0x1021, init 0xFFFF). */
export function crc16ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function rebuildBharatQr(raw: string, amount: number): string {
  const fields = parseTlvList(raw).filter((f) => f.tag !== "63" && f.tag !== "54");
  const amountField = { tag: "54", value: amount.toFixed(2) };
  const insertAt = fields.findIndex((f) => Number.parseInt(f.tag, 10) > 54);
  if (insertAt === -1) fields.push(amountField);
  else fields.splice(insertAt, 0, amountField);
  const body = `${serializeTlv(fields)}6304`;
  return `${body}${crc16ccitt(body)}`;
}

function looksLikeVpa(value: string): boolean {
  return VPA_RE.test(value.trim().toLowerCase());
}

function parseBharatQr(raw: string): UpiPayload | null {
  const root = parseTlv(raw);
  let vpa = "";
  let name = root["59"] ?? "";
  const amount = parseAmount(root["54"]);
  const mcc = root["52"] ?? "";

  for (let tag = 26; tag <= 51; tag += 1) {
    const key = String(tag);
    const nestedRaw = root[key];
    if (!nestedRaw) continue;
    const nested = parseTlv(nestedRaw);
    const candidates = [nested["01"], nested["02"], nested["03"], nested["04"]];
    for (const c of candidates) {
      if (c && looksLikeVpa(c)) {
        vpa = c;
        break;
      }
    }
    if (vpa) break;
    for (const c of candidates) {
      if (c && c.includes("@")) {
        vpa = c;
        break;
      }
    }
    if (vpa) break;
  }

  const cleanVpa = sanitize(vpa).toLowerCase();
  if (!looksLikeVpa(cleanVpa)) return null;

  const handle = cleanVpa.split("@")[0] ?? "Payee";
  const fallbackName = handle.charAt(0).toUpperCase() + handle.slice(1);

  return {
    vpa: cleanVpa,
    name: sanitize(name) || fallbackName,
    amount,
    currency: "INR",
    note: "",
    mcc: sanitize(mcc),
    txnRef: "",
    source: "bharat-qr",
    raw,
  };
}
