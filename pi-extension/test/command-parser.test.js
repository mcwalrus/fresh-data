import assert from "node:assert/strict";
import test from "node:test";

import {
  isDeactivationCommand,
  parseFreshDataCommand,
} from "../command-parser.js";

test("parseFreshDataCommand empty input returns toggle", () => {
  assert.deepEqual(parseFreshDataCommand(""), { type: "toggle" });
  assert.deepEqual(parseFreshDataCommand("   "), { type: "toggle" });
  assert.deepEqual(parseFreshDataCommand(null), { type: "toggle" });
});

test("parseFreshDataCommand status keyword", () => {
  assert.deepEqual(parseFreshDataCommand("status"), { type: "status" });
  assert.deepEqual(parseFreshDataCommand("STATUS"), { type: "status" });
});

test("parseFreshDataCommand install keyword", () => {
  assert.deepEqual(parseFreshDataCommand("install"), { type: "install" });
  assert.deepEqual(parseFreshDataCommand("INSTALL"), { type: "install" });
});

test("parseFreshDataCommand garbage returns invalid", () => {
  const result = parseFreshDataCommand("frobnicate");
  assert.equal(result.type, "invalid");
  assert.ok(result.reason);
});

test("parseFreshDataCommand ignores args after keyword", () => {
  // status/install take no args; trailing words are ignored.
  assert.deepEqual(parseFreshDataCommand("status please"), { type: "status" });
  assert.deepEqual(parseFreshDataCommand("install now"), { type: "install" });
});

test("isDeactivationCommand matches stop fresh-data", () => {
  assert.equal(isDeactivationCommand("stop fresh-data"), true);
  assert.equal(isDeactivationCommand("Stop Fresh-Data"), true);
  assert.equal(isDeactivationCommand("please stop fresh-data now"), true);
});

test("isDeactivationCommand matches normal mode", () => {
  assert.equal(isDeactivationCommand("normal mode"), true);
  assert.equal(isDeactivationCommand("NORMAL MODE"), true);
});

test("isDeactivationCommand ignores casual mentions of normal mode", () => {
  // Must not false-positive on a request mentioning "normal mode" as a phrase.
  assert.equal(isDeactivationCommand("add a normal mode toggle next to dark mode"), false);
  assert.equal(isDeactivationCommand("compare normal mode and strict mode"), false);
});

test("isDeactivationCommand ignores empty input", () => {
  assert.equal(isDeactivationCommand(""), false);
  assert.equal(isDeactivationCommand(null), false);
  assert.equal(isDeactivationCommand(undefined), false);
});