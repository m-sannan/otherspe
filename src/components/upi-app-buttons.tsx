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

  if (!upiUri || disabled) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {UPI_APPS.map((app) => (
          <Button key={app.id} type="button" variant="secondary" disabled>
            {app.label}
          </Button>
        ))}
        <Button type="button" variant="outline" className="col-span-2" disabled>
          Any UPI app
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {UPI_APPS.map((app) => (
        <Button key={app.id} type="button" variant="secondary" asChild>
          <a href={buildAppHref(upiUri, app, android)} rel="noreferrer">
            {app.label}
          </a>
        </Button>
      ))}
      {android ? (
        <Button type="button" variant="outline" className="col-span-2" asChild>
          <a href={buildChooserHref(upiUri)} rel="noreferrer">
            Any UPI app
          </a>
        </Button>
      ) : (
        <p className="col-span-2 text-center text-xs leading-relaxed text-muted-foreground">
          On iPhone, pick CRED / GPay / PhonePe above. There is no system chooser.
        </p>
      )}
    </div>
  );
}
