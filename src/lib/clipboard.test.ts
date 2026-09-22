import assert from "node:assert/strict";
import { test } from "node:test";
import { copyText, copyTextNow } from "./clipboard.ts";

test("empty string is not copied", async () => {
  assert.equal(copyTextNow(""), false);
  assert.equal(await copyText(""), false);
});
