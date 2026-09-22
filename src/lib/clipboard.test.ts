import assert from "node:assert/strict";
import { test } from "node:test";
import { copyText } from "./clipboard.ts";

test("empty string is not copied", async () => {
  assert.equal(await copyText(""), false);
});
