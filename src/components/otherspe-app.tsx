import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, ChevronLeft, IndianRupee, ScanLine, Share2, Trash2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { AmountKeypad } from "@/components/amount-keypad";
import { BrandMark, MerchantAvatar } from "@/components/brand-mark";
import { QrScanner } from "@/components/qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { amountFromDigits, applyAmountKey, formatAmountDigits } from "@/lib/amount";
import { decodeQrFromBlob, makeSampleQrBlob, qrDataUrl } from "@/lib/decode-qr";
import {
  isOnboarded,
  loadRequests,
  setOnboarded,
  setRequestStatus,
  upsertRequest,
  deleteRequest,
  type SavedRequest,
} from "@/lib/history";
import { buildPaySearch } from "@/lib/upi-apps";
import {
  buildQrPayload,
  buildShareText,
  buildUpiUri,
  formatInrPretty,
  isDemoPayload,
  parseUpi,
  rebuildBharatQr,
  type UpiPayload,
} from "@/lib/upi";
import { cn } from "@/lib/utils";

type Screen = "boot" | "welcome" | "home" | "scan" | "amount" | "share" | "history" | "error";

export function OthersPeApp() {
  const [screen, setScreen] = useState<Screen>("boot");
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [payload, setPayload] = useState<UpiPayload | null>(null);
  const [amountDigits, setAmountDigits] = useState("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [txnRef, setTxnRef] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    setRequests(loadRequests());
    setScreen(isOnboarded() ? "home" : "welcome");
  }, []);

  const startScan = () => setScreen("scan");

  const applyRaw = useCallback((raw: string) => {
    const result = parseUpi(raw);
    if (!result.ok) {
      toast(result.error);
      return false;
    }
    const next = result.payload;
    setPayload(next);
    setAmountDigits(next.amount != null ? String(next.amount) : "");
    setNote(next.note);
    setNoteOpen(false);
    setTxnRef(`OP${Date.now().toString(36).toUpperCase()}`);
    setScreen("amount");
    return true;
  }, []);

  const onSample = async () => {
    try {
      const blob = await makeSampleQrBlob();
      const raw = await decodeQrFromBlob(blob);
      if (raw) applyRaw(raw);
    } catch {
      setError({
        title: "Couldn't build the sample",
        body: "Upload a real UPI QR instead.",
      });
      setScreen("error");
    }
  };

  const amount = amountFromDigits(amountDigits);
  const active = requests.find((r) => r.id === activeId) ?? null;

  const saveRequest = () => {
    if (!payload || amount == null) return;
    const item: SavedRequest = {
      id: txnRef,
      createdAt: Date.now(),
      vpa: payload.vpa,
      name: payload.name,
      amount,
      note: note.trim(),
      mcc: payload.mcc,
      txnRef,
      source: payload.source,
      raw: payload.raw,
      status: "waiting",
    };
    setRequests(upsertRequest(item));
    setActiveId(item.id);
    setScreen("share");
  };

  if (screen === "boot") {
    return (
      <Phone tone="paper">
        <div className="flex min-h-dvh flex-col items-center justify-center">
          <BrandMark variant="badge" className="size-24" />
        </div>
      </Phone>
    );
  }

  if (screen === "welcome") {
    return (
      <Phone tone="lime">
        <WelcomeScreen
          onStart={() => {
            setOnboarded();
            setScreen("home");
          }}
        />
      </Phone>
    );
  }

  if (screen === "scan") {
    return (
      <Phone tone="ink">
        <QrScanner
          onRaw={applyRaw}
          onClose={() => setScreen("home")}
          onFileError={(body) => {
            setError({ title: "Couldn't read that QR", body });
            setScreen("error");
          }}
          onSample={() => void onSample()}
        />
      </Phone>
    );
  }

  if (screen === "amount" && payload) {
    return (
      <Phone tone="lime">
        <AmountScreen
          payload={payload}
          amountDigits={amountDigits}
          note={note}
          noteOpen={noteOpen}
          amount={amount}
          onBack={() => setScreen("home")}
          onKey={(key) => setAmountDigits((cur) => applyAmountKey(cur, key))}
          onNote={setNote}
          onToggleNote={() => setNoteOpen((v) => !v)}
          onRequest={saveRequest}
        />
      </Phone>
    );
  }

  if (screen === "share" && active) {
    return (
      <Phone tone="lime">
        <ShareScreen
          item={active}
          payload={payload}
          onBack={() => setScreen("home")}
          onGotIt={(status) => {
            setRequests(setRequestStatus(active.id, status));
          }}
        />
      </Phone>
    );
  }

  if (screen === "history") {
    return (
      <Phone tone="paper">
        <HistoryScreen
          items={requests}
          onBack={() => setScreen("home")}
          onOpen={(id) => {
            setActiveId(id);
            setScreen("share");
          }}
          onDelete={(id) => {
            const next = deleteRequest(id);
            setRequests(next);
            if (activeId === id) {
              setActiveId(null);
              setScreen("home");
            }
            toast("Removed from this phone");
          }}
        />
      </Phone>
    );
  }

  if (screen === "error" && error) {
    return (
      <Phone tone="lime">
        <ErrorScreen
          title={error.title}
          body={error.body}
          onRetry={() => setScreen("scan")}
        />
      </Phone>
    );
  }

  return (
    <Phone tone="paper">
      <HomeScreen
        items={requests}
        onScan={startScan}
        onSeeAll={() => setScreen("history")}
        onOpen={(id) => {
          setActiveId(id);
          setScreen("share");
        }}
        onDelete={(id) => {
          setRequests(deleteRequest(id));
          if (activeId === id) setActiveId(null);
          toast("Removed from this phone");
        }}
      />
    </Phone>
  );
}

function Phone({
  tone,
  children,
}: {
  tone: "lime" | "paper" | "ink";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-dvh w-full justify-center",
        tone === "ink" ? "bg-ink" : "bg-lime",
      )}
    >
      <div
        className={cn(
          "page-shell flex min-h-dvh w-full max-w-md flex-col overflow-x-clip md:my-8 md:min-h-[min(52rem,calc(100dvh-4rem))] md:overflow-hidden md:rounded-[2rem] md:shadow-[0_24px_80px_rgba(17,17,17,0.16)]",
          tone === "lime" && "bg-lime text-ink",
          tone === "paper" && "bg-paper text-ink",
          tone === "ink" && "bg-ink text-paper",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] md:min-h-0 md:flex-1">
      <BrandMark variant="mark" className="size-14 text-ink" />
      <div className="flex flex-1 flex-col justify-end pb-10">
        <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight">
          Scan.
          <br />
          Request.
          <br />
          Get Paid.
        </h1>
        <p className="mt-4 max-w-[16rem] text-base leading-relaxed text-ink-muted">
          Request a payment from anyone with a UPI app. Everything stays on
          this phone — no account, no server.
        </p>
      </div>
      <Button size="lg" className="w-full" onClick={onStart} data-testid="get-started">
        Get Started
      </Button>
    </div>
  );
}

function HomeScreen({
  items,
  onScan,
  onSeeAll,
  onOpen,
  onDelete,
}: {
  items: SavedRequest[];
  onScan: () => void;
  onSeeAll: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const preview = items.slice(0, 4);
  return (
    <div className="flex min-h-dvh flex-col bg-paper md:min-h-0 md:flex-1">
      <header className="bg-lime px-6 pb-8 pt-[max(2rem,calc(env(safe-area-inset-top)+1.25rem))]">
        <BrandMark variant="mark" className="size-10 text-ink" />
        <h1 className="mt-5 font-display text-[2rem] font-semibold leading-tight tracking-tight">
          Welcome to OthersPe!
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Stuck? Let others pay.</p>
      </header>
      <section className="flex flex-1 flex-col px-6 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          {items.length > 0 ? (
            <button type="button" onClick={onSeeAll} className="text-sm text-haze">
              See All
            </button>
          ) : null}
        </div>
        {preview.length === 0 ? (
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-haze">
            Your recent requests will show up here. They stay on this phone —
            unlike a server, we never see them.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {preview.map((item) => (
              <li key={item.id}>
                <HistoryRow
                  item={item}
                  onOpen={() => onOpen(item.id)}
                  onDelete={() => onDelete(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <Button size="lg" className="w-full" onClick={onScan} data-testid="scan-and-request">
          <ScanLine className="size-5" />
          Scan and Request
        </Button>
      </div>
    </div>
  );
}

function AmountScreen({
  payload,
  amountDigits,
  note,
  noteOpen,
  amount,
  onBack,
  onKey,
  onNote,
  onToggleNote,
  onRequest,
}: {
  payload: UpiPayload;
  amountDigits: string;
  note: string;
  noteOpen: boolean;
  amount: number | null;
  onBack: () => void;
  onKey: (key: string) => void;
  onNote: (value: string) => void;
  onToggleNote: () => void;
  onRequest: () => void;
}) {
  const demo = isDemoPayload(payload);
  return (
    <div className="flex min-h-dvh flex-col md:min-h-0 md:flex-1">
      <div className="flex items-center px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <BackButton onClick={onBack} />
      </div>
      <div className="flex flex-1 flex-col items-center px-6 pt-2 text-center">
        <MerchantAvatar name={payload.name} />
        <p className="mt-3 flex max-w-full items-center justify-center gap-1 text-lg font-semibold">
          <span className="min-w-0 truncate">{payload.name}</span>
          <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-ink text-lime">
            <Check className="size-2.5" />
          </span>
        </p>
        <p className="max-w-full break-all text-sm text-ink-muted">{payload.vpa}</p>
        <p className="mt-8 font-display text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl" data-testid="amount-display">
          ₹{formatAmountDigits(amountDigits)}
        </p>
        {demo ? (
          <p className="mt-3 max-w-xs text-center text-xs leading-relaxed text-ink-muted">
            Sample UPI ID — a real payment will not go through. Use your own QR to test.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onToggleNote}
          className="mt-4 text-sm font-medium text-ink-muted underline-offset-4 hover:underline"
        >
          {note.trim() ? note.trim() : "Add a note"}
        </button>
        {noteOpen ? (
          <Input
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Pay for groceries"
            className="mt-3 max-w-xs bg-paper/70"
            autoComplete="off"
          />
        ) : null}
      </div>
      <div className="rounded-t-[1.75rem] bg-paper-muted pt-3">
        <div className="px-3">
          <Button
            size="lg"
            className="w-full"
            disabled={amount == null}
            onClick={onRequest}
            data-testid="request-payment"
          >
            {amount == null ? "Enter Amount" : "Request Payment"}
          </Button>
        </div>
        <AmountKeypad onKey={onKey} />
      </div>
    </div>
  );
}

function ShareScreen({
  item,
  payload,
  onBack,
  onGotIt,
}: {
  item: SavedRequest;
  payload: UpiPayload | null;
  onBack: () => void;
  onGotIt: (status: SavedRequest["status"]) => void;
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const payPageUrl = `${origin}/pay?${buildPaySearch({
    vpa: item.vpa,
    name: item.name,
    amount: item.amount,
    note: item.note,
    mcc: item.mcc,
    txnRef: item.txnRef,
  })}`;
  const shareText = buildShareText({
    payeeName: item.name,
    amount: item.amount,
    payPageUrl,
  });
  const qrPayload =
    item.source === "bharat-qr" && item.raw.startsWith("0002")
      ? rebuildBharatQr(item.raw, item.amount)
      : payload
        ? buildQrPayload({
            payload,
            amount: item.amount,
            note: item.note,
            txnRef: item.txnRef,
          })
        : buildUpiUri({
            vpa: item.vpa,
            name: item.name,
            amount: item.amount,
            note: item.note,
            mcc: item.mcc,
            txnRef: item.txnRef,
          });

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void qrDataUrl(qrPayload).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const share = async () => {
    const title = `Pay ₹${formatInrPretty(item.amount)} to ${item.name}`;
    try {
      if (qrUrl && navigator.share && navigator.canShare) {
        const blob = await (await fetch(qrUrl)).blob();
        const file = new File([blob], "otherspe-pay.png", { type: "image/png" });
        if (navigator.canShare({ files: [file], url: payPageUrl })) {
          await navigator.share({ title, text: shareText, url: payPageUrl, files: [file] });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url: payPageUrl });
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(payPageUrl);
      toast("Pay link copied");
    } catch {
      toast("Copy the link below");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payPageUrl);
      toast("Pay link copied");
    } catch {
      toast("Could not copy");
    }
  };

  const gotIt = item.status === "got-it";

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:min-h-0 md:flex-1">
      <div className="-mx-2 flex items-center pt-[max(0.5rem,env(safe-area-inset-top))]">
        <BackButton onClick={onBack} />
      </div>
      <div className="flex flex-1 flex-col items-center pt-2 text-center">
        <MerchantAvatar name={item.name} />
        <p className="mt-3 text-lg font-semibold">{item.name}</p>
        <p className="break-all text-sm text-ink-muted">{item.vpa}</p>
        <p className="mt-5 font-display text-5xl font-semibold tabular-nums">
          ₹{formatInrPretty(item.amount)}
        </p>
        {item.note ? <p className="mt-2 text-sm text-ink-muted">{item.note}</p> : null}

        <div className="mt-6 w-full rounded-[1.5rem] bg-paper p-5">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Payment QR"
              data-testid="pay-qr"
              className="mx-auto aspect-square w-full max-w-48"
            />
          ) : (
            <div className="mx-auto aspect-square w-full max-w-48 rounded-xl bg-paper-muted" />
          )}
          <p className="mt-3 text-center text-xs leading-relaxed text-haze">
            Share the link. Your friend opens OthersPe, taps CRED, or scans this QR.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={() => void share()} data-testid="share-request">
          <Share2 />
          Share
        </Button>
        <Button variant="secondary" className="w-full bg-paper" onClick={() => void copy()}>
          Copy pay link
        </Button>
        <button
          type="button"
          onClick={() => onGotIt(gotIt ? "waiting" : "got-it")}
          className="mt-2 flex h-12 items-center justify-center gap-2 text-sm font-medium text-ink-muted"
          data-testid="mark-got-it"
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border border-ink",
              gotIt && "bg-ink text-lime",
            )}
          >
            {gotIt ? <Check className="size-3" /> : null}
          </span>
          {gotIt ? "Marked as received" : "I got the payment"}
        </button>
      </div>
    </div>
  );
}

function HistoryScreen({
  items,
  onBack,
  onOpen,
  onDelete,
}: {
  items: SavedRequest[];
  onBack: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper md:min-h-0 md:flex-1">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <BackButton onClick={onBack} />
        <h1 className="text-center text-base font-semibold">History</h1>
        <span />
      </header>
      <p className="px-6 text-center text-xs text-haze">Payment History</p>
      {items.length === 0 ? (
        <p className="px-6 pt-12 text-sm leading-relaxed text-haze">
          No requests yet. Scan a UPI QR to create one.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-ink/10 px-6" data-testid="history-list">
          {items.map((item) => (
            <li key={item.id}>
              <HistoryRow
                item={item}
                onOpen={() => onOpen(item.id)}
                onDelete={() => onDelete(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryRow({
  item,
  onOpen,
  onDelete,
}: {
  item: SavedRequest;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
          <IndianRupee className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{item.name}</span>
          <span className="block truncate text-xs text-haze">
            {formatWhen(item.createdAt)}
            {item.status === "got-it" ? " · Got it" : " · Waiting"}
          </span>
        </span>
        <span className="shrink-0 font-medium tabular-nums">
          ₹{formatInrPretty(item.amount)}
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${item.name}`}
        data-testid="delete-request"
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-haze hover:text-ink"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function ErrorScreen({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] md:min-h-0 md:flex-1">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BrandMark variant="mark" className="size-16 text-ink" />
        <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>
      <Button size="lg" className="w-full" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="flex size-11 items-center justify-center rounded-full"
    >
      <ChevronLeft className="size-6" />
    </button>
  );
}

function formatWhen(ts: number): string {
  const d = new Date(ts);
  const time = format(d, "h:mmaaa").toLowerCase();
  if (isToday(d)) return `Today, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  return `${format(d, "MMMM d")}, ${time}`;
}
