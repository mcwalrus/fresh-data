import assert from "node:assert/strict";
import test from "node:test";

import { resolveSessionMode } from "../session.js";

test("resolveSessionMode returns fallback when entries is empty", () => {
  assert.equal(resolveSessionMode([], "off"), "off");
});

test("resolveSessionMode returns fallback when entries is not an array", () => {
  assert.equal(resolveSessionMode(null, "off"), "off");
  assert.equal(resolveSessionMode(undefined, "on"), "on");
  assert.equal(resolveSessionMode({}, "off"), "off");
  assert.equal(resolveSessionMode("not an array", "off"), "off");
});

test("resolveSessionMode reads the latest fresh-data-mode entry", () => {
  const entries = [
    { type: "custom", customType: "fresh-data-mode", data: { active: true } },
  ];
  assert.equal(resolveSessionMode(entries, "off"), "on");
});

test("resolveSessionMode reads deactivation entries", () => {
  const entries = [
    { type: "custom", customType: "fresh-data-mode", data: { active: false } },
  ];
  assert.equal(resolveSessionMode(entries, "on"), "off");
});

test("resolveSessionMode prefers the latest entry over earlier ones", () => {
  const entries = [
    { type: "custom", customType: "fresh-data-mode", data: { active: true } },
    { type: "message", role: "user" },
    { type: "custom", customType: "fresh-data-mode", data: { active: false } },
  ];
  assert.equal(resolveSessionMode(entries, "off"), "off");
});

test("resolveSessionMode ignores other custom types", () => {
  const entries = [
    { type: "custom", customType: "some-other-mode", data: { active: true } },
  ];
  assert.equal(resolveSessionMode(entries, "off"), "off");
});

test("resolveSessionMode ignores malformed entries", () => {
  const entries = [
    null,
    undefined,
    { type: "custom", customType: "fresh-data-mode" },
    { type: "custom", customType: "fresh-data-mode", data: null },
    { type: "custom", customType: "fresh-data-mode", data: {} },
  ];
  assert.equal(resolveSessionMode(entries, "off"), "off");
});