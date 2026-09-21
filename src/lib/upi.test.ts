import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQrPayload,
  buildShareText,
  buildUpiUri,
  crc16ccitt,
  parseUpi,
  rebuildBharatQr,
} from "./upi.ts";

test("parses a full UPI intent URI", () => {
  const result = parseUpi(
    "upi://pay?pa=merchant@okhdfcbank&pn=Super%20Mart&am=1250.50&cu=INR&tn=Invoice",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.vpa, "merchant@okhdfcbank");
  assert.equal(result.payload.name, "Super Mart");
  assert.equal(result.payload.amount, 1250.5);
});

test("parses a plain VPA", () => {
  const result = parseUpi("9876543210@ybl");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.vpa, "9876543210@ybl");
});

test("rejects a random https link", () => {
  const result = parseUpi("https://example.com");
  assert.equal(result.ok, false);
});

test("parses Bharat QR TLV with a VPA", () => {
  const nested = "0015in.org.npci.upi0122guptakirana@okhdfcbank";
  const nestedLen = String(nested.length).padStart(2, "0");
  const raw = `00020101021126${nestedLen}${nested}5204581253033565802IN5912Gupta Kirana6010Bengaluru`;
  const result = parseUpi(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.vpa, "guptakirana@okhdfcbank");
  assert.equal(result.payload.name, "Gupta Kirana");
  assert.equal(result.payload.source, "bharat-qr");
});

test("builds a shareable UPI URI without encoding @ in pa", () => {
  const uri = buildUpiUri({
    vpa: "guptakirana@okhdfcbank",
    name: "Gupta Kirana",
    amount: 430,
    note: "Paid for Rohit",
    txnRef: "OPTEST1",
  });
  assert.match(uri, /^upi:\/\/pay\?/);
  assert.match(uri, /pa=guptakirana@okhdfcbank/);
  assert.doesNotMatch(uri, /pa=guptakirana%40/);
  assert.match(uri, /am=430.00/);
  assert.match(uri, /tn=Paid%20for%20Rohit/);
  assert.match(uri, /tr=OPTEST1/);
  const text = buildShareText({
    friendName: "Rohit",
    payeeName: "Gupta Kirana",
    vpa: "guptakirana@okhdfcbank",
    amount: 430,
    upiUri: uri,
  });
  assert.match(text, /Hey Rohit/);
  assert.match(text, /₹430.00/);
  assert.match(text, /Scan QR/);
  assert.match(text, /upi:\/\/pay\?pa=guptakirana@okhdfcbank/);
});

test("rebuilds Bharat QR with amount and a valid CRC", () => {
  const nested = "0015in.org.npci.upi0122guptakirana@okhdfcbank";
  const nestedLen = String(nested.length).padStart(2, "0");
  const raw = `00020101021126${nestedLen}${nested}5204581253033565802IN5912Gupta Kirana6010Bengaluru`;
  const rebuilt = rebuildBharatQr(raw, 1);
  assert.match(rebuilt, /54041\.00/);
  assert.equal(rebuilt.slice(-8, -4), "6304");
  const crc = rebuilt.slice(-4);
  assert.equal(crc, crc16ccitt(rebuilt.slice(0, -4)));
  const parsed = parseUpi(rebuilt);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.payload.amount, 1);
  assert.equal(parsed.payload.vpa, "guptakirana@okhdfcbank");
});

test("QR payload for a UPI URI keeps the VPA and amount", () => {
  const parsed = parseUpi(
    "upi://pay?pa=sneha@oksbi&pn=Sneha%20Rao&cu=INR",
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const qr = buildQrPayload({
    payload: parsed.payload,
    amount: 1,
    note: "Test",
    txnRef: "OP1",
  });
  assert.match(qr, /^upi:\/\/pay\?pa=sneha@oksbi/);
  assert.match(qr, /am=1.00/);
});
