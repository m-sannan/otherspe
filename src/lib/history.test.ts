import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HISTORY_KEY,
  ONBOARDED_KEY,
  isOnboarded,
  loadRequests,
  setOnboarded,
  setRequestStatus,
  upsertRequest,
  type SavedRequest,
} from "./history.ts";

function memory() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

const sample = (id: string): SavedRequest => ({
  id,
  createdAt: 1,
  vpa: "gupta@oksbi",
  name: "Gupta Kirana",
  amount: 430,
  note: "",
  mcc: "",
  txnRef: id,
  source: "upi-uri",
  raw: "upi://pay?pa=gupta@oksbi",
  status: "waiting",
});

test("onboarding flag persists on the provided storage", () => {
  const s = memory();
  assert.equal(isOnboarded(s), false);
  setOnboarded(s);
  assert.equal(s.getItem(ONBOARDED_KEY), "1");
  assert.equal(isOnboarded(s), true);
});

test("upsert puts the newest request first and can mark it paid", () => {
  const s = memory();
  upsertRequest(sample("a"), s);
  upsertRequest(sample("b"), s);
  const loaded = loadRequests(s);
  assert.equal(loaded[0]?.id, "b");
  assert.equal(loaded[1]?.id, "a");
  const paid = setRequestStatus("b", "got-it", s);
  assert.equal(paid[0]?.status, "got-it");
  assert.ok(s.getItem(HISTORY_KEY)?.includes("got-it"));
});
