import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UPI_APPS,
  buildAppHref,
  buildChooserHref,
  buildPaySearch,
  upiQueryString,
} from "./upi-apps.ts";

const uri =
  "upi://pay?pa=sneha@oksbi&pn=Sneha&tr=OP1&am=1.00&cu=INR";

test("CRED is the first suggested app", () => {
  assert.equal(UPI_APPS[0]?.id, "cred");
  assert.equal(UPI_APPS[1]?.id, "gpay");
});

test("strips the scheme to leave the query", () => {
  assert.equal(upiQueryString(uri), "pa=sneha@oksbi&pn=Sneha&tr=OP1&am=1.00&cu=INR");
});

test("CRED iOS / scheme href uses credpay", () => {
  const cred = UPI_APPS.find((a) => a.id === "cred");
  assert.ok(cred);
  const href = buildAppHref(uri, cred, false);
  assert.equal(
    href,
    "credpay://upi/pay?pa=sneha@oksbi&pn=Sneha&tr=OP1&am=1.00&cu=INR",
  );
});

test("CRED Android href targets the CRED package, not WhatsApp", () => {
  const cred = UPI_APPS.find((a) => a.id === "cred");
  assert.ok(cred);
  const href = buildAppHref(uri, cred, true);
  assert.match(href, /^intent:\/\/pay\?/);
  assert.match(href, /package=com\.dreamplug\.androidapp/);
  assert.doesNotMatch(href, /whatsapp/i);
});

test("chooser intent has no package so the OS picks", () => {
  const href = buildChooserHref(uri);
  assert.match(href, /^intent:\/\/pay\?pa=sneha@oksbi/);
  assert.doesNotMatch(href, /package=/);
});

test("pay page search keeps the VPA unencoded", () => {
  const q = buildPaySearch({
    vpa: "sneha@oksbi",
    name: "Sneha Rao",
    amount: 1,
    txnRef: "OP1",
  });
  assert.match(q, /pa=sneha%40oksbi|pa=sneha@oksbi/);
  assert.match(q, /am=1.00/);
});
