import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MerchantAvatar } from "@/components/brand-mark";
import { UpiAppButtons } from "@/components/upi-app-buttons";
import { qrDataUrl } from "@/lib/decode-qr";
import { buildPaySearch } from "@/lib/upi-apps";
import { buildUpiUri, formatInrPretty, parseUpi } from "@/lib/upi";

type PaySearch = {
  pa?: string;
  pn?: string;
  am?: string;
  tn?: string;
  tr?: string;
  mc?: string;
  cu?: string;
};

export const Route = createFileRoute("/pay")({
  validateSearch: (raw: Record<string, unknown>): PaySearch => ({
    pa: str(raw.pa),
    pn: str(raw.pn),
    am: str(raw.am),
    tn: str(raw.tn),
    tr: str(raw.tr),
    mc: str(raw.mc),
    cu: str(raw.cu),
  }),
  component: PayPage,
});

function str(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return undefined;
  let s = value.trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

function PayPage() {
  const search = Route.useSearch();
  const raw = useMemo(() => {
    if (!search.pa) return "";
    return `upi://pay?${buildPaySearch({
      vpa: search.pa,
      name: search.pn ?? "",
      amount: Number(search.am) || 0,
      note: search.tn,
      mcc: search.mc,
      txnRef: search.tr,
    })}`;
  }, [search]);

  const parsed = useMemo(() => (raw ? parseUpi(raw) : null), [raw]);
  const payload = parsed?.ok ? parsed.payload : null;
  const amount = payload?.amount ?? null;

  const upiUri = useMemo(() => {
    if (!payload || amount == null) return "";
    return buildUpiUri({
      vpa: payload.vpa,
      name: payload.name,
      amount,
      note: payload.note,
      mcc: payload.mcc,
      txnRef: payload.txnRef,
    });
  }, [payload, amount]);

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!upiUri) {
      setQrUrl(null);
      return;
    }
    let cancelled = false;
    void qrDataUrl(upiUri).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [upiUri]);

  if (!payload || amount == null) {
    return (
      <div className="flex min-h-dvh w-full justify-center bg-lime">
        <main className="page-shell flex min-h-dvh w-full max-w-md flex-col justify-center bg-lime px-6 text-ink md:my-8 md:min-h-[min(52rem,calc(100dvh-4rem))] md:rounded-[2rem] md:shadow-[0_24px_80px_rgba(17,17,17,0.16)]">
          <p className="font-display text-2xl font-semibold">OthersPe</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            This payment link is missing a UPI ID or amount.
          </p>
          <Link to="/" className="mt-6 text-sm font-medium underline underline-offset-4">
            Create a request
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full justify-center bg-lime">
      <main className="page-shell flex min-h-dvh w-full max-w-md flex-col bg-lime px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-ink md:my-8 md:min-h-[min(52rem,calc(100dvh-4rem))] md:overflow-y-auto md:rounded-[2rem] md:shadow-[0_24px_80px_rgba(17,17,17,0.16)]">
        <p className="text-center text-xs font-medium text-ink-muted">Pay with OthersPe</p>
        <div className="mt-6 flex flex-col items-center text-center">
          <MerchantAvatar name={payload.name} />
          <h1 className="mt-3 max-w-full break-words text-xl font-semibold">{payload.name}</h1>
          <p className="max-w-full break-all text-sm text-ink-muted">{payload.vpa}</p>
          <p className="mt-6 font-display text-5xl font-semibold tabular-nums tracking-tight">
            ₹{formatInrPretty(amount)}
          </p>
          {payload.note ? (
            <p className="mt-2 text-sm text-ink-muted">{payload.note}</p>
          ) : null}
        </div>

        <section className="mt-6 rounded-[1.5rem] bg-paper p-5">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Payment QR"
              className="mx-auto aspect-square w-full max-w-48"
            />
          ) : (
            <div className="mx-auto aspect-square w-full max-w-48 rounded-xl bg-paper-muted" />
          )}
          <p className="mt-3 text-center text-xs leading-relaxed text-haze">
            Scan this QR in any UPI app — Google Pay included. If you’re inside
            WhatsApp, open this page in Chrome first.
          </p>
        </section>

        <section className="mt-5 flex flex-col gap-3 pb-2">
          <UpiAppButtons upiUri={upiUri} />
        </section>
      </main>
    </div>
  );
}
