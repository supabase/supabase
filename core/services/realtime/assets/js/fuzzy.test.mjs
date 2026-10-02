import { test } from "node:test";
import assert from "node:assert/strict";

import { matches, positions, segments } from "./fuzzy.mjs";

test("matches characters in order without needing them adjacent", () => {
  assert.ok(matches("Joining room_a", "join"));
  assert.ok(matches("Joining room_a", "jnrm"));
  assert.ok(matches("realtime:room_a phx_join (6, 6)", "phxjoin"));
  assert.ok(!matches("Joining room_a", "zzz"));
});

test("respects the order the characters were typed", () => {
  assert.ok(matches("cursor-move", "crmv"));
  assert.ok(!matches("cursor-move", "vmrc"));
});

test("ignores case and whitespace in the query", () => {
  assert.ok(matches("Joining room_a", "JN RM"));
  assert.ok(matches("Joining room_a", "  "));
});

test("an empty query matches everything", () => {
  assert.deepEqual(positions("anything", ""), []);
  assert.ok(matches("anything", ""));
});

test("positions point at the matched characters", () => {
  assert.deepEqual(positions("abcabc", "ab"), [0, 1]);
  assert.deepEqual(positions("abcabc", "cb"), [2, 4]);
  assert.equal(positions("abc", "abd"), null);
});

test("segments split the text without losing or duplicating any of it", () => {
  const parts = segments("Joining room_a", "jrm");

  assert.equal(parts.map((p) => p.text).join(""), "Joining room_a");
  assert.equal(
    parts
      .filter((p) => p.matched)
      .map((p) => p.text)
      .join(""),
    "Jrm",
  );
});

test("segments return the text untouched when nothing matches", () => {
  assert.deepEqual(segments("Joined room_a", "zzz"), [{ matched: false, text: "Joined room_a" }]);
  assert.deepEqual(segments("Joined room_a", ""), [{ matched: false, text: "Joined room_a" }]);
});

test("segments keep emojis and surrogate pairs intact", () => {
  assert.deepEqual(segments("Joining room_🔥", "🔥"), [
    { matched: false, text: "Joining room_" },
    { matched: true, text: "🔥" },
  ]);
  assert.deepEqual(segments("User 😃 joined with 😆", "😃 😆"), [
    { matched: false, text: "User " },
    { matched: true, text: "😃" },
    { matched: false, text: " joined with " },
    { matched: true, text: "😆" },
  ]);
});
