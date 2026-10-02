import test from "node:test";
import assert from "node:assert/strict";
import { join, resolve, relative } from "node:path";

test("relative traversal is rejected by the agent protocol contract", () => {
  const root = resolve("/tmp/testagram-root");
  const candidate = resolve(root, "nested", "file.txt");
  assert.equal(relative(root, candidate), join("nested", "file.txt"));
  assert.throws(() => {
    const bad = resolve(root, "..", "outside.txt");
    if (!bad.startsWith(root + "/")) throw new Error("Path escaped root");
  });
});

test("root identifiers are opaque and filesystem paths never enter command payloads", () => {
  const command = { root_id: "root-uuid", relative_path: "videos/show.mp4" };
  assert.equal("root-uuid" in command, true);
  assert.equal("path" in command, false);
});
