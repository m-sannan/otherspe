import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type RefObject } from "react";
import {
  Check,
  Copy,
  Download,
  ImagePlus,
  Link2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decodeQrFromBlob, makeSampleQrBlob, qrDataUrl } from "@/lib/decode-qr";
import {
  buildQrPayload,
  buildShareText,
  buildUpiUri,
  formatInr,
  isDemoPayload,
  parseAmount,
  parseUpi,
  type UpiPayload,
} from "@/lib/upi";
import { cn } from "@/lib/utils";

type Status = "idle" | "reading" | "error";

const SOURCE_LABEL: Record<UpiPayload["source"], string> = {
  "upi-uri": "UPI intent",
  "bharat-qr": "Bharat QR",
  vpa: "UPI ID",
  "http-wrapper": "Payment link",
};

export function OthersPeApp() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<UpiPayload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [friendName, setFriendName] = useState("");
  const [note, setNote] = useState("");
  const [pasteValue, setPasteValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<"message" | "link" | "qr" | null>(null);
  const [payQrUrl, setPayQrUrl] = useState<string | null>(null);

  const amount = parseAmount(amountInput);

  const txnRef = useMemo(() => {
    if (!payload || amount == null) return "";
    return `OP${Date.now().toString(36).toUpperCase()}`;
  }, [payload, amount]);

  const upiUri = useMemo(() => {
    if (!payload || amount == null) return "";
    return buildUpiUri({
      vpa: payload.vpa,
      name: payload.name,
      amount,
      note: note.trim() || (friendName.trim() ? `Paid for ${friendName.trim()}` : payload.note),
      mcc: payload.mcc,
      txnRef,
    });
  }, [payload, amount, note, friendName, txnRef]);

  const qrPayload = useMemo(() => {
    if (!payload || amount == null) return "";
    return buildQrPayload({
      payload,
      amount,
      note: note.trim() || (friendName.trim() ? `Paid for ${friendName.trim()}` : payload.note),
      txnRef,
    });
  }, [payload, amount, note, friendName, txnRef]);

  const message = useMemo(() => {
    if (!payload || amount == null) return "";
    return buildShareText({
      friendName,
      payeeName: payload.name,
      vpa: payload.vpa,
      amount,
      upiUri,
    });
  }, [payload, amount, friendName, upiUri]);

  useEffect(() => {
    if (!qrPayload) {
      setPayQrUrl(null);
      return;
    }
    let cancelled = false;
    void qrDataUrl(qrPayload).then((url) => {
      if (!cancelled) setPayQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const applyPayload = useCallback((next: UpiPayload, preview?: string) => {
    setPayload(next);
    setError(null);
    setStatus("idle");
    setAmountInput(next.amount != null ? String(next.amount) : "");
    setNote(next.note);
    if (preview) setPreviewUrl(preview);
  }, []);

  const handleRaw = useCallback(
    (raw: string, preview?: string) => {
      const result = parseUpi(raw);
      if (!result.ok) {
        setStatus("error");
        setError(result.error);
        setPayload(null);
        return;
      }
      applyPayload(result.payload, preview);
    },
    [applyPayload],
  );

  const handleBlob = useCallback(
    async (blob: Blob) => {
      setStatus("reading");
      setError(null);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      try {
        const raw = await decodeQrFromBlob(blob);
        if (!raw) {
          setStatus("error");
          setError(
            "Could not read a QR in that image. Try a tighter crop, or paste the upi:// link.",
          );
          setPayload(null);
          return;
        }
        handleRaw(raw, url);
      } catch {
        setStatus("error");
        setError("Could not open that image.");
        setPayload(null);
      }
    },
    [handleRaw],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void handleBlob(file);
            return;
          }
        }
      }
      const text = event.clipboardData?.getData("text");
      if (
        text &&
        (text.includes("upi://") || text.includes("@") || text.startsWith("0002")) &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        handleRaw(text);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleBlob, handleRaw]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPayload(null);
    setPreviewUrl(null);
    setAmountInput("");
    setFriendName("");
    setNote("");
    setPasteValue("");
    setError(null);
    setStatus("idle");
    setCopied(null);
    setPayQrUrl(null);
  };

  const copyText = async (value: string, kind: "message" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast(kind === "message" ? "Note copied" : "UPI link copied");
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast("Could not copy. Select the text instead.");
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleBlob(file);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <header className="mb-10 flex items-baseline justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              OthersPe
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Drop a merchant or personal UPI QR. We turn it into a QR and a
              UPI link your friend can pay — scan inside CRED / GPay works;
              tapping the link is hit-or-miss by app.
            </p>
          </div>
          {payload ? (
            <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
              <RotateCcw />
              New QR
            </Button>
          ) : null}
        </header>

        {!payload ? (
          <IdlePanel
            status={status}
            error={error}
            dragging={dragging}
            pasteValue={pasteValue}
            fileRef={fileRef}
            onPasteValue={setPasteValue}
            onBrowse={() => fileRef.current?.click()}
            onFile={(file) => void handleBlob(file)}
            onSubmitPaste={() => handleRaw(pasteValue)}
            onDragOver={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onSample={async () => {
              setStatus("reading");
              try {
                const blob = await makeSampleQrBlob();
                await handleBlob(blob);
              } catch {
                setStatus("error");
                setError("Could not build the sample QR.");
              }
            }}
          />
        ) : (
          <Composer
            payload={payload}
            previewUrl={previewUrl}
            amountInput={amountInput}
            friendName={friendName}
            note={note}
            amount={amount}
            message={message}
            upiUri={upiUri}
            payQrUrl={payQrUrl}
            isDemo={isDemoPayload(payload)}
            copied={copied}
            onAmount={setAmountInput}
            onFriend={setFriendName}
            onNote={setNote}
            onCopyMessage={() => void copyText(message, "message")}
            onCopyLink={() => void copyText(upiUri, "link")}
            onCopyQr={async () => {
              if (!payQrUrl) return;
              try {
                const blob = await (await fetch(payQrUrl)).blob();
                await navigator.clipboard.write([
                  new ClipboardItem({ [blob.type]: blob }),
                ]);
                setCopied("qr");
                toast("QR copied — paste it into WhatsApp");
                window.setTimeout(() => setCopied(null), 1600);
              } catch {
                toast("Could not copy the QR. Save it instead.");
              }
            }}
          />
        )}

        <p className="mt-12 text-xs leading-relaxed text-muted-foreground">
          Scanning the QR inside CRED / PhonePe / GPay is the reliable path.
          The WhatsApp message now includes the raw upi:// link so they can
          try tapping it too. We still cannot confirm the transfer — they
          check their UPI app.
        </p>
      </div>
    </div>
  );
}

function IdlePanel({
  status,
  error,
  dragging,
  pasteValue,
  fileRef,
  onPasteValue,
  onBrowse,
  onFile,
  onSubmitPaste,
  onDragOver,
  onDragLeave,
  onDrop,
  onSample,
}: {
  status: Status;
  error: string | null;
  dragging: boolean;
  pasteValue: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onPasteValue: (value: string) => void;
  onBrowse: () => void;
  onFile: (file: File) => void;
  onSubmitPaste: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent) => void;
  onSample: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        aria-label="Upload UPI QR image"
        className="sr-only"
        data-testid="qr-file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={onBrowse}
        onDragEnter={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-[border-color,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
          dragging
            ? "border-primary bg-muted"
            : "border-border bg-card hover:border-primary/50",
        )}
      >
        <span className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-foreground">
          {status === "reading" ? (
            <Upload className="size-5 animate-pulse" />
          ) : (
            <ImagePlus className="size-5" />
          )}
        </span>
        <span className="text-base font-medium text-foreground">
          {status === "reading" ? "Reading QR…" : "Drop a UPI QR here"}
        </span>
        <span className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Screenshot, camera roll, or paste an image. Personal UPI QRs are the
          reliable ₹1 test.
        </span>
      </button>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
        >
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <Label htmlFor="paste-upi">Or paste a UPI link / ID</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="paste-upi"
            value={pasteValue}
            onChange={(e) => onPasteValue(e.target.value)}
            placeholder="upi://pay?pa=name@oksbi or 9876543210@ybl"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitPaste();
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="sm:w-28"
            onClick={onSubmitPaste}
            disabled={!pasteValue.trim()}
          >
            Read
          </Button>
        </div>
      </div>

      <Button type="button" variant="outline" onClick={onSample}>
        Try a sample QR (will not actually pay)
      </Button>
    </div>
  );
}

function Composer({
  payload,
  previewUrl,
  amountInput,
  friendName,
  note,
  amount,
  message,
  payQrUrl,
  isDemo,
  copied,
  onAmount,
  onFriend,
  onNote,
  onCopyMessage,
  onCopyLink,
  onCopyQr,
}: {
  payload: UpiPayload;
  previewUrl: string | null;
  amountInput: string;
  friendName: string;
  note: string;
  amount: number | null;
  message: string;
  upiUri: string;
  payQrUrl: string | null;
  isDemo: boolean;
  copied: "message" | "link" | "qr" | null;
  onAmount: (value: string) => void;
  onFriend: (value: string) => void;
  onNote: (value: string) => void;
  onCopyMessage: () => void;
  onCopyLink: () => void;
  onCopyQr: () => void;
}) {
  const whatsappHref =
    amount != null
      ? `https://wa.me/?text=${encodeURIComponent(message)}`
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Uploaded QR"
              className="size-16 shrink-0 rounded-md border border-border bg-paper object-cover p-1"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              <Link2 className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {SOURCE_LABEL[payload.source]}
            </p>
            <p className="mt-1 truncate font-display text-xl font-medium text-foreground">
              {payload.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-sm text-muted-foreground">
              {payload.vpa}
            </p>
          </div>
        </div>
      </section>

      {isDemo ? (
        <p
          role="status"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-foreground"
        >
          This sample UPI ID does not exist. Google Pay will show “Payment
          couldn't be completed.” Drop a real QR — your own personal UPI
          is the clean ₹1 test.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <Input
              id="amount"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => onAmount(e.target.value)}
              placeholder="0.00"
              className="pl-7 font-mono tabular-nums"
              data-testid="amount"
            />
          </div>
          {payload.amount != null ? (
            <p className="text-xs text-muted-foreground">
              QR had ₹{formatInr(payload.amount)}. Change it if you want.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Static QR — type what they should pay.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="friend">Friend's name (optional)</Label>
          <Input
            id="friend"
            value={friendName}
            onChange={(e) => onFriend(e.target.value)}
            placeholder="Rohit"
            data-testid="friend"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="note">Note on the payment (optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Dinner / groceries"
          />
        </div>
      </section>

      <section className="rounded-xl bg-paper p-5 text-ink sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Scan this inside GPay
        </p>
        {amount == null ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Add an amount to generate the payment QR.
          </p>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-4">
            {payQrUrl ? (
              <img
                src={payQrUrl}
                alt="Payment QR"
                data-testid="pay-qr"
                className="size-52 rounded-md sm:size-56"
              />
            ) : (
              <div className="size-52 rounded-md bg-ink/5 sm:size-56" />
            )}
            <p className="max-w-sm text-center text-sm leading-relaxed text-ink-muted">
              Open CRED / GPay / PhonePe → Scan QR. WhatsApp also gets the
              upi:// link if they want to try tapping it.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Message to send
        </p>
        {amount == null ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Add an amount to generate the note.
          </p>
        ) : (
          <pre
            data-testid="share-message"
            className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground"
          >
            {message}
          </pre>
        )}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="flex-1"
          disabled={amount == null || !payQrUrl}
          onClick={onCopyQr}
        >
          {copied === "qr" ? <Check /> : <Copy />}
          Copy QR
        </Button>
        {payQrUrl ? (
          <Button type="button" variant="secondary" className="flex-1" asChild>
            <a href={payQrUrl} download="otherspe-pay.png">
              <Download />
              Save QR
            </a>
          </Button>
        ) : (
          <Button type="button" variant="secondary" className="flex-1" disabled>
            <Download />
            Save QR
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={amount == null}
          onClick={onCopyMessage}
        >
          {copied === "message" ? <Check /> : <Copy />}
          Copy note
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={!whatsappHref}
          asChild={Boolean(whatsappHref)}
        >
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Open WhatsApp
            </a>
          ) : (
            <span>Open WhatsApp</span>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          disabled={amount == null}
          onClick={onCopyLink}
        >
          {copied === "link" ? <Check /> : <Link2 />}
          Copy UPI link
        </Button>
      </div>
    </div>
  );
}
