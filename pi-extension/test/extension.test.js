import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import freshDataExtension from "../index.js";

function createPiHarness() {
  const events = new Map();
  const commands = new Map();
  const appendedEntries = [];
  const sentUserMessages = [];

  const pi = {
    on(eventName, handler) {
      events.set(eventName, handler);
    },
    registerCommand(name, options) {
      commands.set(name, options);
    },
    appendEntry(customType, data) {
      appendedEntries.push({ customType, data });
    },
    sendUserMessage(text, options) {
      sentUserMessages.push({ text, options });
    },
  };

  freshDataExtension(pi);
  return { pi, events, commands, appendedEntries, sentUserMessages };
}

function createCommandContext(overrides = {}) {
  return {
    isIdle: () => true,
    cwd: "/tmp",
    sessionManager: { getEntries: () => [] },
    ui: { notify() {} },
    ...overrides,
  };
}

function withTempCwd(fn) {
  const tempCwd = mkdtempSync(join(tmpdir(), "fresh-data-test-"));
  return Promise.resolve()
    .then(() => fn(tempCwd))
    .finally(() => rmSync(tempCwd, { recursive: true, force: true }));
}

test("extension registers /fresh-data commands", () => {
  const { commands } = createPiHarness();
  const names = [...commands.keys()];
  assert.ok(names.includes("fresh-data"), `expected fresh-data in ${names}`);
});

test("extension subscribes to required lifecycle events", () => {
  const { events } = createPiHarness();
  assert.ok(events.has("session_start"));
  assert.ok(events.has("agent_start"));
  assert.ok(events.has("agent_end"));
  assert.ok(events.has("before_agent_start"));
  assert.ok(events.has("input"));
});

test("/fresh-data with no args toggles to active and persists entry", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: false } }] },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0; // clear entries from session_start
  await commands.get("fresh-data").handler("", ctx);

  assert.equal(appendedEntries.length, 1);
  assert.equal(appendedEntries[0].customType, "fresh-data-mode");
  assert.deepEqual(appendedEntries[0].data, { active: true });
}));

test("/fresh-data toggles off when already active", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: false } }] },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("", ctx); // on
  await commands.get("fresh-data").handler("", ctx); // off

  const last = appendedEntries.at(-1);
  assert.deepEqual(last, { customType: "fresh-data-mode", data: { active: false } });
}));

test("/fresh-data status reports current mode", async () => withTempCwd(async (cwd) => {
  const { commands, events } = createPiHarness();
  const notifications = [];
  const ctx = createCommandContext({
    cwd,
    ui: { notify: (msg) => notifications.push(msg) },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  await commands.get("fresh-data").handler("status", ctx);

  const lastStatus = notifications.at(-1);
  assert.match(lastStatus, /fresh-data/i);
  assert.match(lastStatus, /on|active/i);
}));

test("/fresh-data install writes rules into project CLAUDE.md", async () => withTempCwd(async (cwd) => {
  const { commands, events } = createPiHarness();
  const notifications = [];
  const ctx = createCommandContext({
    cwd,
    ui: { notify: (msg, level) => notifications.push({ msg, level }) },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  await commands.get("fresh-data").handler("install", ctx);

  const { readFileSync, existsSync } = await import("node:fs");
  const claudePath = join(cwd, "CLAUDE.md");
  assert.ok(existsSync(claudePath));

  const contents = readFileSync(claudePath, "utf8");
  assert.match(contents, /Fresh Data/);
  assert.ok(contents.includes("Live lookup"));
}));

test("/fresh-data install is idempotent", async () => withTempCwd(async (cwd) => {
  const { commands, events } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);
  await commands.get("fresh-data").handler("install", ctx);

  const { readFileSync } = await import("node:fs");
  const first = readFileSync(join(cwd, "CLAUDE.md"), "utf8");

  await commands.get("fresh-data").handler("install", ctx);
  const second = readFileSync(join(cwd, "CLAUDE.md"), "utf8");

  assert.equal(second, first);
}));

test("session_start restores active mode from persisted entries", async () => withTempCwd(async (cwd) => {
  const { events } = createPiHarness();
  const ctx = createCommandContext({
    cwd,
    sessionManager: {
      getEntries: () => [
        { type: "custom", customType: "fresh-data-mode", data: { active: true } },
      ],
    },
  });

  await events.get("session_start")({ reason: "resume" }, ctx);
  const result = await events.get("before_agent_start")({ systemPrompt: "BASE" }, ctx);

  assert.ok(result.systemPrompt.includes("Fresh Data"));
  assert.ok(result.systemPrompt.startsWith("BASE\n\n"));
}));

test("before_agent_start injects rules when active, no-ops when off", async () => withTempCwd(async (cwd) => {
  const { events, commands } = createPiHarness();
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: false } }] },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);

  // After explicit off: no rules injected
  const offResult = await events.get("before_agent_start")({ systemPrompt: "BASE" }, ctx);
  assert.equal(offResult, undefined);

  // After toggle on: rules injected
  await commands.get("fresh-data").handler("", ctx);
  const onResult = await events.get("before_agent_start")({ systemPrompt: "BASE" }, ctx);
  assert.ok(onResult.systemPrompt.includes("Fresh Data"));
}));

test("before_agent_start defaults to on after install when no prior entry exists", async () => withTempCwd(async (cwd) => {
  const { events } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);

  // Fresh session with no prior fresh-data-mode entry -> default on -> rules injected.
  const onResult = await events.get("before_agent_start")({ systemPrompt: "BASE" }, ctx);
  assert.ok(onResult?.systemPrompt.includes("Fresh Data"));
}));

test("before_agent_start guards missing event and missing systemPrompt", async () => withTempCwd(async (cwd) => {
  const { events } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);

  // null/undefined event must not crash
  for (const bad of [undefined, null]) {
    const r = await events.get("before_agent_start")(bad, ctx);
    assert.ok(r.systemPrompt.includes("Fresh Data"));
    assert.ok(!r.systemPrompt.includes("undefined"));
  }

  // event without systemPrompt: must not start with "undefined"
  const empty = await events.get("before_agent_start")({}, ctx);
  assert.ok(empty.systemPrompt.includes("Fresh Data"));
  assert.ok(!empty.systemPrompt.startsWith("undefined"));
}));

test("deactivation phrase in input toggles off", async () => withTempCwd(async (cwd) => {
  const { events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await events.get("input")({ text: "stop fresh-data", source: "interactive" }, ctx);
  assert.equal(appendedEntries.at(-1).data.active, false);
}));

test("a request mentioning 'normal mode' as a phrase stays active", async () => withTempCwd(async (cwd) => {
  const { events } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);

  await events.get("input")({ text: "add a normal mode toggle next to dark mode", source: "interactive" }, ctx);
  const result = await events.get("before_agent_start")({ systemPrompt: "BASE" }, ctx);
  assert.ok(result.systemPrompt.includes("Fresh Data"));
}));

test("extension-injected input is ignored for deactivation", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("", ctx); // on
  const before = appendedEntries.length;

  await events.get("input")({ text: "stop fresh-data", source: "extension" }, ctx);
  assert.equal(appendedEntries.length, before, "extension-source input must not deactivate");
}));

test("status indicator renders OFF when not active, ACTIVE when agent is running", async () => withTempCwd(async (cwd) => {
  const { events } = createPiHarness();
  const statusWrites = [];
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: true } }] },
    ui: { notify() {}, setStatus: (key, text) => statusWrites.push({ key, text }), theme: { fg: (_c, t) => t } },
  });

  await events.get("session_start")({ reason: "resume" }, ctx);
  await events.get("agent_start")({}, ctx);

  // The last write should be the ACTIVE indicator
  const last = statusWrites.at(-1);
  assert.equal(last.key, "fresh-data");
  assert.match(last.text, /●/);
  assert.match(last.text, /ACTIVE|ON/i);
}));

test("status indicator stays silent when ui lacks a theme", async () => withTempCwd(async (cwd) => {
  const { events } = createPiHarness();
  const calls = [];
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: true } }] },
    ui: { notify() {}, setStatus: (_key, text) => calls.push(text) }, // no theme
  });

  await events.get("session_start")({ reason: "resume" }, ctx);
  await events.get("agent_start")({}, ctx);

  assert.deepEqual(calls, []);
}));

test("/fresh-data enable activates when off", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: false } }] },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("enable", ctx);
  const last = appendedEntries.at(-1);
  assert.deepEqual(last, { customType: "fresh-data-mode", data: { active: true } });
}));

test("/fresh-data disable deactivates when on", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({ cwd });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("disable", ctx);
  const last = appendedEntries.at(-1);
  assert.deepEqual(last, { customType: "fresh-data-mode", data: { active: false } });
}));

test("/fresh-data enable is idempotent when already on", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const notifications = [];
  const ctx = createCommandContext({
    cwd,
    ui: { notify: (msg) => notifications.push(msg) },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("enable", ctx);
  assert.equal(appendedEntries.length, 0);
  assert.match(notifications.at(-1), /already ACTIVE/i);
}));

test("/fresh-data disable is idempotent when already off", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const notifications = [];
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: false } }] },
    ui: { notify: (msg) => notifications.push(msg) },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("disable", ctx);
  assert.equal(appendedEntries.length, 0);
  assert.match(notifications.at(-1), /already OFF/i);
}));

test("/fresh-data on / off are aliases for enable / disable", async () => withTempCwd(async (cwd) => {
  const { commands, events, appendedEntries } = createPiHarness();
  const ctx = createCommandContext({
    cwd,
    sessionManager: { getEntries: () => [{ type: "custom", customType: "fresh-data-mode", data: { active: false } }] },
  });

  await events.get("session_start")({ reason: "startup" }, ctx);
  appendedEntries.length = 0;

  await commands.get("fresh-data").handler("on", ctx);
  assert.deepEqual(appendedEntries.at(-1).data, { active: true });

  await commands.get("fresh-data").handler("off", ctx);
  assert.deepEqual(appendedEntries.at(-1).data, { active: false });
}));