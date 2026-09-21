import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UpiAppButtons } from "@/components/upi-app-buttons";
import { qrDataUrl } from "@/lib/decode-qr";
import { buildPaySearch } from "@/lib/upi-apps";
import { buildUpiUri, formatInr, parseUpi } from "@/lib/upi";

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
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
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
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12 text-foreground">
        <p className="font-display text-2xl font-medium">OthersPe</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This payment link is missing a UPI ID or amount.
        </p>
        <Link to="/" className="mt-6 text-sm text-primary underline-offset-4 hover:underline">
          Create a new one
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-10 text-foreground">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Pay for someone
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
        {payload.name}
      </h1>
      <p className="mt-1 font-mono text-sm text-muted-foreground">{payload.vpa}</p>
      <p className="mt-6 font-display text-4xl font-medium tabular-nums">
        ₹{formatInr(amount)}
      </p>

      <section className="mt-8 rounded-xl bg-paper p-5 text-ink">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Payment QR"
            className="mx-auto size-52 rounded-md"
          />
        ) : (
          <div className="mx-auto size-52 rounded-md bg-ink/5" />
        )}
        <p className="mt-4 text-center text-sm leading-relaxed text-ink-muted">
          Scan this inside CRED / GPay / PhonePe. Buttons below try to open
          that app directly — they will not work from WhatsApp Pay.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Open in
        </p>
        <UpiAppButtons upiUri={upiUri} />
      </section>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        If a button does nothing, this in-app browser is blocking app links.
        Open the page in Chrome, or scan the QR.
      </p>
    </main>
  );
}
