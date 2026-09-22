import assert from "node:assert/strict";
import { test } from "node:test";
import { amountFromDigits, applyAmountKey, formatAmountDigits } from "./amount.ts";

test("appends digits and a single decimal", () => {
  assert.equal(applyAmountKey("", "5"), "5");
  assert.equal(applyAmountKey("5", "0"), "50");
  assert.equal(applyAmountKey("50", "."), "50.");
  assert.equal(applyAmountKey("50.", "5"), "50.5");
  assert.equal(applyAmountKey("50.5", "0"), "50.50");
  assert.equal(applyAmountKey("50.50", "1"), "50.50");
  assert.equal(applyAmountKey("50.", "."), "50.");
});

test("backspace and leading zero", () => {
  assert.equal(applyAmountKey("50", "back"), "5");
  assert.equal(applyAmountKey("0", "7"), "7");
});

test("rejects amounts over the UPI cap", () => {
  assert.equal(applyAmountKey("500000", "1"), "500000");
});

test("pretty-prints grouped rupees while typing", () => {
  assert.equal(formatAmountDigits("50000"), "50,000");
  assert.equal(formatAmountDigits("50."), "50.");
  assert.equal(formatAmountDigits(""), "0");
});

test("parses a payable amount", () => {
  assert.equal(amountFromDigits("5"), 5);
  assert.equal(amountFromDigits("50.5"), 50.5);
  assert.equal(amountFromDigits(""), null);
  assert.equal(amountFromDigits("0."), null);
});
