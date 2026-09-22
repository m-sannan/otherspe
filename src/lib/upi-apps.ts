export type UpiAppId = "cred" | "gpay" | "phonepe" | "paytm";

export type UpiApp = {
  id: UpiAppId;
  label: string;
  /** Custom URL scheme used on iOS and as a fallback. */
  scheme: string;
  androidPackage: string;
};

export const UPI_APPS: UpiApp[] = [
  {
    id: "gpay",
    label: "Google Pay",
    scheme: "tez://upi/pay",
    androidPackage: "com.google.android.apps.nbu.paisa.user",
  },
  {
    id: "cred",
    label: "CRED",
    scheme: "credpay://upi/pay",
    androidPackage: "com.dreamplug.androidapp",
  },
  {
    id: "phonepe",
    label: "PhonePe",
    scheme: "phonepe://pay",
    androidPackage: "com.phonepe.app",
  },
  {
    id: "paytm",
    label: "Paytm",
    scheme: "paytmmp://pay",
    androidPackage: "net.one97.paytm",
  },
];


export function upiQueryString(upiUri: string): string {
  const i = upiUri.indexOf("?");
  return i >= 0 ? upiUri.slice(i + 1) : "";
}

export function isAndroidUa(ua = ""): boolean {
  return /android/i.test(ua);
}

/** App-specific href. Android uses an intent URL so the OS opens that package, not WhatsApp Pay. */
export function buildAppHref(upiUri: string, app: UpiApp, android = false): string {
  const q = upiQueryString(upiUri);
  if (android) {
    return `intent://pay?${q}#Intent;scheme=upi;package=${app.androidPackage};end`;
  }
  return `${app.scheme}?${q}`;
}

/** Android chooser — any installed UPI app, still not WhatsApp's in-app Pay. */
export function buildChooserHref(upiUri: string): string {
  const q = upiQueryString(upiUri);
  return `intent://pay?${q}#Intent;scheme=upi;end`;
}

export function buildPaySearch(input: {
  vpa: string;
  name: string;
  amount: number;
  note?: string;
  mcc?: string;
  txnRef?: string;
}): string {
  const params = new URLSearchParams();
  params.set("pa", input.vpa.trim());
  if (input.name.trim()) params.set("pn", input.name.trim());
  params.set("am", input.amount.toFixed(2));
  params.set("cu", "INR");
  if (input.note?.trim()) params.set("tn", input.note.trim());
  if (input.mcc?.trim()) params.set("mc", input.mcc.trim());
  if (input.txnRef?.trim()) params.set("tr", input.txnRef.trim());
  return params.toString();
}
