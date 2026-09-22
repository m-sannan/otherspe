import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  FALLBACK_APPS,
  PRIMARY_APP,
  buildAppHref,
  buildChooserHref,
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

  if (!PRIMARY_APP) return null;

  const ready = Boolean(upiUri) && !disabled;
  const credHref = ready ? buildAppHref(upiUri, PRIMARY_APP, android) : undefined;

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

      {android && ready ? (
        <Button type="button" variant="secondary" className="h-12 w-full bg-paper" asChild>
          <a href={buildChooserHref(upiUri)} rel="noreferrer" data-testid="open-chooser">
            Any other UPI app
          </a>
        </Button>
      ) : (
        <p className="rounded-full bg-paper/70 px-4 py-3 text-center text-sm leading-relaxed text-ink-muted">
          Any other UPI app — scan the QR above
        </p>
      )}

      <p className="mt-2 text-center text-xs leading-relaxed text-ink-muted">
        Google Pay, PhonePe and Paytm often reject this kind of QR. If they fail,
        don’t retry the button — open the app and scan the QR instead.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {FALLBACK_APPS.map((app) =>
          ready ? (
            <Button
              key={app.id}
              type="button"
              variant="outline"
              className="h-11 whitespace-normal bg-paper/40 px-1 text-xs font-medium leading-tight"
              asChild
            >
              <a href={buildAppHref(upiUri, app, android)} rel="noreferrer">
                {app.label}
              </a>
            </Button>
          ) : (
            <Button
              key={app.id}
              type="button"
              variant="outline"
              className="h-11 whitespace-normal px-1 text-xs"
              disabled
            >
              {app.label}
            </Button>
          ),
        )}
      </div>
    </div>
  );
}
