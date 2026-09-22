import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CRED_APP,
  PICKER_APPS,
  buildAppHref,
  isAndroidUa,
} from "@/lib/upi-apps";

export function UpiAppButtons({
  upiUri,
  disabled,
}: {
  upiUri: string;
  disabled?: boolean;
}) {
  const android = useMemo(
    () => (typeof navigator === "undefined" ? false : isAndroidUa(navigator.userAgent)),
    [],
  );
  const [open, setOpen] = useState(false);

  const ready = Boolean(upiUri) && !disabled;
  const credHref = ready ? buildAppHref(upiUri, CRED_APP, android) : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      {credHref ? (
        <Button size="lg" className="w-full" asChild>
          <a href={credHref} rel="noreferrer" data-testid="open-cred">
            Pay with CRED
          </a>
        </Button>
      ) : (
        <Button size="lg" className="w-full" disabled>
          Pay with CRED
        </Button>
      )}

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full bg-paper"
        disabled={!ready}
        onClick={() => setOpen(true)}
        data-testid="open-chooser"
      >
        Pay with any UPI app
      </Button>

      <p className="mt-1 text-center text-xs leading-relaxed text-ink-muted">
        Pick the app you actually use — not whichever one is set as default.
        Google Pay, PhonePe and Paytm often block this kind of in-app link; if
        they open but won’t pay, scan the QR. That works.
      </p>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 md:items-center md:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upi-picker-title"
            className="flex max-h-[min(36rem,90dvh)] w-full max-w-md flex-col rounded-t-xl bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-ink md:rounded-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="upi-picker-title" className="text-base font-semibold">
                Pay with any UPI app
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-11 items-center justify-center rounded-full text-haze hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-haze">
              Each row opens that app directly. Your default UPI app (Check UPI
              and the like) is skipped.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 overflow-y-auto pb-2">
              {PICKER_APPS.map((app) =>
                ready ? (
                  <li key={app.id}>
                    <Button
                      variant="outline"
                      className="h-12 w-full bg-paper-muted/60 text-sm font-medium"
                      asChild
                    >
                      <a
                        href={buildAppHref(upiUri, app, android)}
                        rel="noreferrer"
                        data-testid={`open-${app.id}`}
                      >
                        {app.label}
                      </a>
                    </Button>
                  </li>
                ) : (
                  <li key={app.id}>
                    <Button variant="outline" className="h-12 w-full text-sm" disabled>
                      {app.label}
                    </Button>
                  </li>
                ),
              )}
            </ul>
            <p className="pt-1 text-center text-xs leading-relaxed text-haze">
              App not listed, or it won’t complete? Scan the QR on this page.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
