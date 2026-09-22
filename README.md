# OthersPe

Scan a UPI QR. Set an amount. Share a **pay page**. Your friend taps **Google Pay** (or CRED / PhonePe / Paytm) — or scans the QR.

Money never passes through OthersPe. There is no Collect API and no webhook. Mark “I got the payment” yourself. Requests stay on this phone only.

## Live

**https://otherspe.vercel.app**

## Flow

1. Open OthersPe (first visit explains the product).
2. **Scan and Request** — camera, upload, or a sample QR.
3. Enter the amount on the keypad. Optional note.
4. **Request Payment** saves it locally and shows a QR.
5. **Share** sends the https pay page (and the QR if the phone allows). Never a raw `upi://` link — WhatsApp hijacks those into WhatsApp Pay.
6. Friend opens the page → **Google Pay** first, then CRED, PhonePe, Paytm, any other UPI app. Or they scan the QR.

## What actually works

| Path | Result |
| --- | --- |
| Reconstructed QR inside **CRED** | Payment went through on a real QR |
| Google Pay / CRED / PhonePe / Paytm on `/pay` | Android intent with that app’s package |
| Share | https `/pay` page + QR image when the OS allows |
| Sample kirana QR | Fake VPA. Always fails. Use a real QR. |

## Local

```bash
npm install
npm run dev
```

## License

MIT
