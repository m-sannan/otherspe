# OthersPe

Pay a merchant or personal UPI QR **on someone else's behalf**.

Drop / paste a UPI QR, set an amount, get:

1. A **payment QR** the payer scans inside CRED / GPay / PhonePe
2. A **WhatsApp note** with the raw `upi://pay?…` deep link

Money never passes through OthersPe. There is no Collect API, no webhook, and no way for this client to know the payment landed. The payee checks their UPI app, same as always.

## What actually works (Sep 2026)

| Path | Result |
| --- | --- |
| Scan the generated QR inside **CRED** | Payment went through |
| Scan the generated QR inside GPay / PhonePe | Usually works for personal VPAs |
| Tap the `upi://` link from Chrome or WhatsApp | Hit-or-miss. GPay often shows “Payment couldn’t be completed.” CRED is worth trying. |
| Sample kirana QR (`guptakirana@okhdfcbank`) | Fake VPA. Always fails. |

This is the same primitive SplitPe uses (parse QR → rewrite `am` → new QR / intent). SplitPe adds tranching and a local “Simulate paid” button. OthersPe does not.

## This repo

Extracted prototype logic from the browser app:

```
src/lib/upi.ts              parse / rebuild UPI URI + Bharat QR (with CRC)
src/lib/upi.test.ts         parser + URI + CRC tests
src/lib/decode-qr.ts        jsQR + QR encode
src/components/otherspe-app.tsx   the one-screen UI
```

The live UI is a TanStack Start + Tailwind app. These files are the product; they are not a standalone `npm start` tree.

## Run the unit tests

```bash
node --experimental-strip-types --test src/lib/upi.test.ts
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
