import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CRED_APP,
  PICKER_APPS,
  UPI_APPS,
  buildAppHref,
  buildPaySearch,
  upiQueryString,
} from "./upi-apps.ts";

const uri = "upi://pay?pa=sneha@oksbi&pn=Sneha&tr=OP1&am=1.00&cu=INR";

test("CRED is first; picker lists GPay, PhonePe, super.money, Jupiter", () => {
  assert.equal(UPI_APPS[0]?.id, "cred");
  const ids = PICKER_APPS.map((a) => a.id);
  assert.ok(ids.includes("gpay"));
  assert.ok(ids.includes("phonepe"));
  assert.ok(ids.includes("paytm"));
  assert.ok(ids.includes("supermoney"));
  assert.ok(ids.includes("jupiter"));
  assert.ok(!ids.includes("cred"));
  assert.equal(
    PICKER_APPS.some((a) => /whatsapp|check/i.test(a.label + a.androidPackage)),
    false,
  );
});

test("strips the scheme to leave the query", () => {
  assert.equal(upiQueryString(uri), "pa=sneha@oksbi&pn=Sneha&tr=OP1&am=1.00&cu=INR");
});

test("CRED iOS / scheme href uses credpay", () => {
  const href = buildAppHref(uri, CRED_APP, false);
  assert.equal(
    href,
    "credpay://upi/pay?pa=sneha@oksbi&pn=Sneha&tr=OP1&am=1.00&cu=INR",
  );
});

test("CRED Android href targets the CRED package, not WhatsApp", () => {
  const href = buildAppHref(uri, CRED_APP, true);
  assert.match(href, /^intent:\/\/pay\?/);
  assert.match(href, /package=com\.dreamplug\.androidapp/);
  assert.doesNotMatch(href, /whatsapp/i);
});

test("picker Android href targets that app's package so the default UPI app is skipped", () => {
  const gpay = PICKER_APPS.find((a) => a.id === "gpay");
  assert.ok(gpay);
  const href = buildAppHref(uri, gpay, true);
  assert.match(href, /package=com\.google\.android\.apps\.nbu\.paisa\.user/);
  assert.doesNotMatch(href, /package=money\.super/);
});

test("super.money and Jupiter have their real packages", () => {
  const superMoney = PICKER_APPS.find((a) => a.id === "supermoney");
  const jupiter = PICKER_APPS.find((a) => a.id === "jupiter");
  assert.equal(superMoney?.androidPackage, "money.super.payments");
  assert.equal(jupiter?.androidPackage, "money.jupiter");
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
