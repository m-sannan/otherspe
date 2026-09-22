import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  UPI_APPS,
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
  const [primary, ...rest] = UPI_APPS;

  if (!primary) return null;

  const ready = Boolean(upiUri) && !disabled;

  return (
    <div className="flex flex-col gap-2">
      {ready ? (
        <Button size="lg" className="w-full" asChild>
          <a href={buildAppHref(upiUri, primary, android)} rel="noreferrer" data-testid="open-gpay">
            {primary.label}
          </a>
        </Button>
      ) : (
        <Button size="lg" className="w-full" disabled>
          {primary.label}
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2">
        {rest.map((app) =>
          ready ? (
            <Button key={app.id} type="button" variant="secondary" className="h-12" asChild>
              <a href={buildAppHref(upiUri, app, android)} rel="noreferrer">
                {app.label}
              </a>
            </Button>
          ) : (
            <Button key={app.id} type="button" variant="secondary" className="h-12" disabled>
              {app.label}
            </Button>
          ),
        )}
        {android ? (
          ready ? (
            <Button type="button" variant="outline" className="col-span-2 h-12 bg-paper/40" asChild>
              <a href={buildChooserHref(upiUri)} rel="noreferrer">
                Any other UPI app
              </a>
            </Button>
          ) : (
            <Button type="button" variant="outline" className="col-span-2 h-12" disabled>
              Any other UPI app
            </Button>
          )
        ) : (
          <p className="col-span-2 text-center text-xs leading-relaxed text-ink-muted">
            If a button does nothing, scan the QR from Google Pay or your camera.
          </p>
        )}
      </div>
    </div>
  );
}
