export type UpiAppId =
  | "cred"
  | "gpay"
  | "phonepe"
  | "paytm"
  | "bhim"
  | "supermoney"
  | "jupiter"
  | "amazon"
  | "mobikwik"
  | "airtel";

export type UpiApp = {
  id: UpiAppId;
  label: string;
  /** Custom URL scheme used on iOS and as a fallback. */
  scheme: string;
  androidPackage: string;
};

/** CRED is the one named app whose in-app / deep-link pay actually completes. */
export const CRED_APP: UpiApp = {
  id: "cred",
  label: "CRED",
  scheme: "credpay://upi/pay",
  androidPackage: "com.dreamplug.androidapp",
};

/**
 * Package-specific targets so Android does not dump the user into whatever
 * app is set as the default UPI handler (Check UPI, BHIM, …).
 */
export const PICKER_APPS: UpiApp[] = [
  {
    id: "gpay",
    label: "Google Pay",
    scheme: "tez://upi/pay",
    androidPackage: "com.google.android.apps.nbu.paisa.user",
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
  {
    id: "supermoney",
    label: "super.money",
    scheme: "super://pay",
    androidPackage: "money.super.payments",
  },
  {
    id: "jupiter",
    label: "Jupiter",
    scheme: "jupiter://pay",
    androidPackage: "money.jupiter",
  },
  {
    id: "bhim",
    label: "BHIM",
    scheme: "bhim://pay",
    androidPackage: "in.org.npci.upiapp",
  },
  {
    id: "amazon",
    label: "Amazon Pay",
    scheme: "amazonpay://upi/pay",
    androidPackage: "in.amazon.mShop.android.shopping",
  },
  {
    id: "mobikwik",
    label: "Mobikwik",
    scheme: "mobikwik://upi/pay",
    androidPackage: "com.mobikwik_new",
  },
  {
    id: "airtel",
    label: "Airtel Thanks",
    scheme: "myairtel://upi_welcome_screen",
    androidPackage: "com.myairtelapp",
  },
];

export const UPI_APPS: UpiApp[] = [CRED_APP, ...PICKER_APPS];

export function upiQueryString(upiUri: string): string {
  const i = upiUri.indexOf("?");
  return i >= 0 ? upiUri.slice(i + 1) : "";
}

export function isAndroidUa(ua = ""): boolean {
  return /android/i.test(ua);
}

/** App-specific href. Android uses an intent URL so the OS opens that package, not the default UPI app. */
export function buildAppHref(upiUri: string, app: UpiApp, android = false): string {
  const q = upiQueryString(upiUri);
  if (android) {
    const store = encodeURIComponent(
      `https://play.google.com/store/apps/details?id=${app.androidPackage}`,
    );
    return `intent://pay?${q}#Intent;scheme=upi;package=${app.androidPackage};S.browser_fallback_url=${store};end`;
  }
  return `${app.scheme}?${q}`;
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
