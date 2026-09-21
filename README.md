# OthersPe

Pay a merchant or personal UPI QR **on someone else's behalf**.

Drop / paste a UPI QR, set an amount, share a **pay page** (https, not `upi://`) plus a **payment QR**. Your friend opens CRED / GPay / PhonePe from that page, or scans the QR inside their UPI app.

Money never passes through OthersPe. There is no Collect API, no webhook, and no way for this client to know the payment landed. The payee checks their UPI app.

## Live

Vercel: *(set after first deploy)*

GitHub Pages will not work — this is a TanStack Start / Nitro app, not a static site.

## What actually works

| Path | Result |
| --- | --- |
| Scan the generated QR inside **CRED** | Payment went through on a real QR |
| CRED / GPay / PhonePe / Paytm buttons on `/pay` | Android intent with the app's package — not WhatsApp Pay |
| WhatsApp share | Sends the https `/pay` page, never a raw `upi://` (WhatsApp hijacks that into WhatsApp Pay) |
| Sample kirana QR (`guptakirana@okhdfcbank`) | Fake VPA. Always fails. Use a real QR. |

## Local

```bash
npm install
npm run dev
```

## UPI URI we emit

```
upi://pay?pa=<vpa>&pn=<name>&mc=<mcc if present>&tr=<unique>&tn=<note>&am=<amount>&cu=INR
```

- `pa` is left unencoded (`name@handle`) so PSP apps parse the VPA
- Bharat QR sources are rebuilt as EMVCo TLV with amount tag 54 and a fresh CRC-16

## Not in scope

- Confirming the transfer
- Signed merchant (P2M) intents
- A PSP / Pay API / webhook

## License

MIT
