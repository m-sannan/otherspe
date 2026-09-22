import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  CRED_APP,
  buildAnyAppHref,
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

  const ready = Boolean(upiUri) && !disabled;
  const credHref = ready ? buildAppHref(upiUri, CRED_APP, android) : undefined;
  const anyHref = ready ? buildAnyAppHref(upiUri, android) : undefined;

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

      {anyHref ? (
        <Button type="button" variant="secondary" className="h-12 w-full bg-paper" asChild>
          <a href={anyHref} rel="noreferrer" data-testid="open-chooser">
            Pay using any other app
          </a>
        </Button>
      ) : (
        <Button type="button" variant="secondary" className="h-12 w-full bg-paper" disabled>
          Pay using any other app
        </Button>
      )}

      <p className="mt-1 text-center text-xs leading-relaxed text-ink-muted">
        Google Pay, PhonePe and Paytm block paying from this page’s buttons — they
        don’t reject the QR. Scan it instead; that works. CRED opens from the
        button. Other UPI apps (super.money, Jupiter, BHIM…) are worth a try.
      </p>
    </div>
  );
}
