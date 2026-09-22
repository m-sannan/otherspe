# OthersPe

Scan a UPI QR. Set an amount. Share a **pay page**. Your friend taps **CRED**, picks **any UPI app**, or scans the QR.

Money never passes through OthersPe. There is no Collect API and no webhook. Mark “I got the payment” yourself. Requests stay on this phone only.

## Live

**https://otherspe.vercel.app**

## Flow

1. Open OthersPe (first visit explains the product).
2. **Scan and Request** — camera, upload, or a sample QR.
3. Enter the amount on the keypad. Optional note. Tap the amount later to edit it — including on requests you’ve already marked received.
4. **Request Payment** saves it locally and shows a QR.
5. **Share** or **Copy** sends the https pay page (and the QR if the phone allows). Never a raw `upi://` link — WhatsApp hijacks those.
6. Friend opens the page → **Pay with CRED**, **Pay with any UPI app** (pick Google Pay, PhonePe, Paytm, super.money, Jupiter…), or scan the QR.

## What actually works

| Path | Result |
| --- | --- |
| Reconstructed QR scanned in **Google Pay** (or any UPI app) | Payment goes through |
| **Pay with CRED** on `/pay` | Deep link / in-app pay completes |
| **Pay with any UPI app** | In-app picker with package-specific intents (does not open the default UPI app) |
| Google Pay / PhonePe / Paytm **in-app link** | Those apps often block this kind of deep link. Scan the QR. |
| Share / copy | https `/pay` page + QR image when the OS allows |
| Sample kirana QR | Fake VPA. Always fails. Use a real QR. |

## Local

```bash
npm install
npm run dev
```

## License

MIT
