import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import pstackRouter from "../extensions/pstack-router/index.ts";

const rpcBridge = process.env.PSTACK_SUBAGENTS_RPC_MODULE
  ? await import(process.env.PSTACK_SUBAGENTS_RPC_MODULE)
  : undefined;

function createHost(runId = "pstack-run-1", spawnError, followupRunId = `${runId}-followup`, statusReply) {
  const eventHandlers = new Map();
  const extensionHandlers = new Map();
  const tools = new Map();
  const commands = new Map();
  const entries = [];
  const messages = [];
  const requests = [];

  const events = {
    on(channel, handler) {
      const handlers = eventHandlers.get(channel) ?? [];
      handlers.push(handler);
      eventHandlers.set(channel, handlers);
      return () => {
        eventHandlers.set(channel, (eventHandlers.get(channel) ?? []).filter((entry) => entry !== handler));
      };
    },
    emit(channel, data) {
      requests.push({ channel, data });
      for (const handler of eventHandlers.get(channel) ?? []) handler(data);
    },
  };

  const pi = {
    on(channel, handler) {
      const handlers = extensionHandlers.get(channel) ?? [];
      handlers.push(handler);
      extensionHandlers.set(channel, handlers);
    },
    events,
    registerTool(tool) {
      tools.set(tool.name, tool);
    },
    registerCommand(name, command) {
      commands.set(name, command);
    },
    appendEntry(customType, data) {
      entries.push({ customType, data });
    },
    sendMessage(message, options) {
      messages.push({ message, options });
    },
  };

  if (rpcBridge) {
    rpcBridge.registerSubagentRpcBridge({
      events,
      getContext: () => context(process.cwd(), []),
      async execute(_id, params) {
        if (spawnError) return { isError: true, content: [{ type: "text", text: spawnError.message }] };
        if (params.action === "status" && statusReply) return { content: [], ...statusReply };
        return {
          content: [],
          details: { runId: params.action === "resume" || params.workflowScript?.includes('"resume"') ? followupRunId : runId },
        };
      },
    });
  } else events.on("subagents:rpc:v1:request", (request) => {
    if (request.method === "spawn") {
      assert.equal(Object.hasOwn(request.params, "workflowScript"), false, "RPC spawn must not send the removed workflowScript parameter");
      assert.equal(typeof request.params.script, "string");
      assert.notEqual(request.params.script.trim(), "");
    }
    if (request.method === "spawn" && spawnError) {
      events.emit(`subagents:rpc:v1:reply:${request.requestId}`, {
        version: 1,
        requestId: request.requestId,
        success: false,
        error: spawnError,
      });
      return;
    }
    events.emit(`subagents:rpc:v1:reply:${request.requestId}`, {
      version: 1,
      requestId: request.requestId,
      success: true,
      data: request.method === "ping"
        ? { version: 1, methods: ["ping", "spawn", "resume"] }
        : request.method === "status" && statusReply ? statusReply
        : { details: { runId: request.method === "resume" || request.params.script?.includes('"resume"') ? followupRunId : runId } },
    });
  });

  pstackRouter(pi);
  return { pi, tools, commands, entries, messages, requests, extensionHandlers };
}

function context(cwd, models, sessionId = "session-a", branch = []) {
  return {
    cwd,
    model: {
      provider: "openai-codex",
      id: "gpt-5.6-sol",
    },
    thinkingLevel: "medium",
    scopedModels: [],
    modelRegistry: {
      getAvailable() {
        return models.map((model) => {
          const slash = model.indexOf("/");
          return {
            provider: model.slice(0, slash),
            id: model.slice(slash + 1),
            reasoning: true,
          };
        });
      },
    },
    sessionManager: {
      getSessionId() {
        return sessionId;
      },
      getSessionFile() {
        return undefined;
      },
      getBranch() {
        return branch;
      },
    },
    ui: {
      notify() {},
    },
    signal: undefined,
  };
}

async function projectWithConfig(source) {
  const cwd = join(tmpdir(), `pstack-extension-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(join(cwd, ".pstack"), { recursive: true });
  await writeFile(join(cwd, ".pstack", "config.md"), source);
  return cwd;
}

function rpcRequest(requests, method) {
  return requests.find((entry) => entry.channel === "subagents:rpc:v1:request" && entry.data.method === method)?.data;
}

function spawnRequest(requests) {
  return rpcRequest(requests, "spawn");
}

test("MCP evidence is opt-in and cannot be requested for a writer", async (t) => {
  const cwd = await projectWithConfig("why investigators: openai-codex/gpt-5.6-sol:high\n");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const params = { modelRole: "why investigators", executionRole: "researcher", task: "Investigate." };
  const ctx = context(cwd, ["openai-codex/gpt-5.6-sol"]);
  for (const mcp of [false, true]) {
    const host = createHost();
    const result = await host.tools.get("pstack_launch").execute("research", { ...params, mcp }, undefined, undefined, ctx);
    assert.equal(result.details.agent, mcp ? "pstack-runtime-evidence-mcp" : "pstack-runtime-evidence");
  }
  const host = createHost();
  await assert.rejects(host.tools.get("pstack_launch").execute("invalid", { ...params, executionRole: "implementer", mcp: true }, undefined, undefined, ctx), /requires execution role researcher/);
  assert.equal(spawnRequest(host.requests), undefined);
});

test("writer panels reject shared-cwd launch and isolate each child when requested", async (t) => {
  const cwd = await projectWithConfig("arena runners: openai-codex/gpt-5.6-sol, openai-codex/gpt-5.6-luna\n");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost();
  const ctx = context(cwd, ["openai-codex/gpt-5.6-sol", "openai-codex/gpt-5.6-luna"]);
  const params = { modelRole: "arena runners", executionRole: "implementer", tasks: ["A", "B"] };
  await assert.rejects(host.tools.get("pstack_panel").execute("unsafe", params, undefined, undefined, ctx), /require worktree: true/);
  assert.equal(spawnRequest(host.requests), undefined);
  const result = await host.tools.get("pstack_panel").execute("safe", { ...params, worktree: true }, undefined, undefined, ctx);
  const script = spawnRequest(host.requests).params.script;
  assert.equal([...script.matchAll(/"worktree":true/g)].length, 2);
  assert.equal(result.details.worktree, true);
});

test("status recovers a missed completion in a fresh extension instance", async (t) => {
  const cwd = await projectWithConfig("feature: openai-codex/gpt-5.6-sol:high\n");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const old = createHost("recover-1");
  const ctx = context(cwd, ["openai-codex/gpt-5.6-sol"]);
  await old.tools.get("pstack_launch").execute("start", { modelRole: "feature", executionRole: "owner", task: "Build." }, undefined, undefined, ctx);
  const entries = old.entries.map(entry => ({ type: "custom", ...entry }));
  for (const handler of old.extensionHandlers.get("session_shutdown")) await handler({}, ctx);
  const fresh = createHost("recover-1", undefined, undefined, { details: { workflowChildren: {
    workflowRunId: "recover-1", inventoryComplete: true, workflowState: "completed",
    children: [{ runId: "child-1", agent: "poteto-agent", model: "openai-codex/gpt-5.6-sol:high", state: "completed" }],
  } } });
  ctx.sessionManager.getBranch = () => [...entries, ...fresh.entries.map(entry => ({ type: "custom", ...entry }))];
  await fresh.extensionHandlers.get("session_start")[0]({}, ctx);
  const result = await fresh.tools.get("pstack_status").execute("status", { runId: "recover-1" }, undefined, undefined, ctx);
  assert.equal(result.details.kind, "completion");
  assert.equal(result.details.success, true);
  assert.equal(rpcRequest(fresh.requests, "status").params.id, "recover-1");
  assert.equal(old.entries.length, 1);
});

for (const defect of ["missing status", "extra child", "missing agent"]) {
  test(`completion fails closed on ${defect}`, async (t) => {
    const cwd = await projectWithConfig("feature: openai-codex/gpt-5.6-sol:high\n");
    t.after(() => rm(cwd, { recursive: true, force: true }));
    const host = createHost("bad-evidence");
    await host.tools.get("pstack_launch").execute("start", { modelRole: "feature", executionRole: "owner", task: "Build." }, undefined, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"]));
    const child = { agent: "poteto-agent", model: "openai-codex/gpt-5.6-sol:high", status: "completed" };
    if (defect === "missing status") delete child.status;
    if (defect === "missing agent") delete child.agent;
    host.pi.events.emit("subagent:async-complete", { runId: "bad-evidence", success: true, results: defect === "extra child" ? [child, child] : [child] });
    assert.equal(host.entries.at(-1).data.success, false);
  });
}

test("pstack_launch resolves model, thinking, fast, agent, and route ledger", async (testContext) => {
  const cwd = await projectWithConfig("how explorer: openai-codex/gpt-5.6-luna:xhigh [fast]\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost();
  const tool = host.tools.get("pstack_launch");
  const result = await tool.execute("call-1", {
    modelRole: "how explorer",
    executionRole: "explorer",
    task: "Trace the request flow.",
    worktree: true,
  }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-luna"]));

  const request = spawnRequest(host.requests);
  assert.equal(request.params.agent, undefined);
  assert.equal(request.params.context, "fresh");
  assert.match(request.params.script, /runs\.run\("how-explorer"/u);
  assert.match(request.params.script, /"label":"how explorer"/u);
  assert.match(request.params.script, /"agent":"pstack-runtime-read"/u);
  assert.match(request.params.script, /"model":"openai-codex\/gpt-5\.6-luna:xhigh"/u);
  assert.match(request.params.script, /"fast":true/u);
  assert.match(request.params.script, /"worktree":true/u);
  assert.match(request.params.script, /PSTACK WORKFLOW IDENTITY\\nhow explorer/u);
  assert.match(request.params.script, /EXECUTION ROLE\\nexplorer/u);
  assert.match(result.content[0].text, /Pstack model role: how explorer/u);
  assert.match(result.content[0].text, /Run: pstack-run-1/u);
  assert.doesNotMatch(result.content[0].text, /Pi agent|pstack-runtime-read/u);
  assert.equal(host.entries[0].customType, "pstack-route");
  assert.equal(host.entries[0].data.choices[0].thinking, "xhigh");
  assert.equal(host.entries[0].data.worktree, true);
});

test("pstack_followup continues a completed scalar owner with the same route", async (testContext) => {
  const cwd = await projectWithConfig("feature: openai-codex/gpt-5.6-sol:high\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("owner-1", undefined, "owner-2");
  const ownerContext = context(cwd, ["openai-codex/gpt-5.6-sol"]);
  await host.tools.get("pstack_launch").execute("owner-start", {
    modelRole: "feature",
    executionRole: "owner",
    task: "Build the feature.",
    worktree: true,
  }, new AbortController().signal, undefined, ownerContext);

  const ownerSpawn = spawnRequest(host.requests);
  assert.match(ownerSpawn.params.script, /runs\.run\("feature"/u);
  assert.match(ownerSpawn.params.script, /"label":"feature"/u);
  assert.match(ownerSpawn.params.script, /"agent":"poteto-agent"/u);

  host.pi.events.emit("subagent:async-complete", {
    runId: "owner-1",
    success: true,
    state: "completed",
    workflowChildren: {
      children: [{
        runId: "owner-child-1",
        agent: "poteto-agent",
        model: "openai-codex/gpt-5.6-sol:high",
        thinking: "high",
        state: "completed",
      }],
    },
  });

  const branch = host.entries.map((entry) => ({
    type: "custom",
    customType: entry.customType,
    data: entry.data,
  }));
  const result = await host.tools.get("pstack_followup").execute("owner-followup", {
    runId: "owner-1",
    task: "Apply the accepted review findings.",
  }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"], "session-a", branch));

  const requests = host.requests.filter((entry) => entry.channel === "subagents:rpc:v1:request" && entry.data.method === "spawn");
  const request = requests.at(-1).data;
  assert.match(request.params.script, /runs\.run\("feature"/u);
  assert.match(request.params.script, /"resume":"owner-child-1"/u);
  assert.match(request.params.script, /"label":"feature"/u);
  assert.match(request.params.script, /Apply the accepted review findings\./u);
  assert.equal(result.details.runId, "owner-2");
  assert.equal(result.details.previousRunId, "owner-1");
  assert.equal(result.details.modelRole, "feature");
  assert.equal(result.details.executionRole, "owner");
  assert.equal(result.details.worktree, true);
  assert.equal(result.details.choices[0].model, "openai-codex/gpt-5.6-sol");
  const latestBranch = host.entries.map(entry => ({ type: "custom", ...entry }));
  await assert.rejects(host.tools.get("pstack_followup").execute("stale-followup", {
    runId: "owner-1", task: "Do not fork the old owner.",
  }, undefined, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"], "session-a", latestBranch)), /already been continued/);
});

test("pstack_panel launches all configured models through one workflow", async (testContext) => {
  const cwd = await projectWithConfig("how critics: openai-codex/gpt-5.6-sol:medium, anthropic/claude-opus-5:xhigh\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("panel-1");
  const tool = host.tools.get("pstack_panel");
  await tool.execute("call-2", {
    modelRole: "how critics",
    executionRole: "reviewer",
    tasks: ["Check the runtime flow.", "Check the architecture."],
  }, new AbortController().signal, undefined, context(cwd, [
    "openai-codex/gpt-5.6-sol",
    "anthropic/claude-opus-5",
  ]));

  const request = spawnRequest(host.requests);
  assert.equal(request.params.context, "fresh");
  assert.match(request.params.script, /"agent":"pstack-runtime-read"/u);
  assert.match(request.params.script, /"label":"how critics 1\/2"/u);
  assert.match(request.params.script, /openai-codex\/gpt-5\.6-sol:medium/u);
  assert.match(request.params.script, /anthropic\/claude-opus-5:xhigh/u);
  assert.equal(host.entries[0].data.choices.length, 2);
});

test("panel completion correlates stable child keys rather than result order", async (t) => {
  const cwd = await projectWithConfig("arena runners: openai-codex/gpt-5.6-sol:high, openai-codex/gpt-5.6-luna:low\n");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("reordered");
  await host.tools.get("pstack_panel").execute("start", {
    modelRole: "arena runners", executionRole: "reviewer", tasks: ["A", "B"],
  }, undefined, undefined, context(cwd, ["openai-codex/gpt-5.6-sol", "openai-codex/gpt-5.6-luna"]));
  host.pi.events.emit("subagent:async-complete", { runId: "reordered", success: true, state: "completed", workflowChildren: { children: [
    { childId: "arena-runners-2", agent: "pstack-runtime-read", model: "openai-codex/gpt-5.6-luna:low", state: "completed" },
    { childId: "arena-runners-1", agent: "pstack-runtime-read", model: "openai-codex/gpt-5.6-sol:high", state: "completed" },
  ] } });
  assert.equal(host.entries.at(-1).data.success, true);
  assert.deepEqual(host.entries.at(-1).data.routingFailures, []);
});

test("pstack_launch rejects unavailable configured models before delegation", async (testContext) => {
  const cwd = await projectWithConfig("bug-fix: oopenai-codex/gpt-5.6-sol:high\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost();
  const tool = host.tools.get("pstack_launch");
  await assert.rejects(
    tool.execute("call-3", {
      modelRole: "bug-fix",
      executionRole: "implementer",
      task: "Fix the defect.",
    }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"])),
    /unavailable model 'oopenai-codex\/gpt-5\.6-sol'/u,
  );
  assert.equal(spawnRequest(host.requests), undefined);
});

test("pstack_launch exposes the public RPC error", async (testContext) => {
  const cwd = await projectWithConfig("bug-fix: openai-codex/gpt-5.6-sol:high\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("unused", {
    code: "execution_failed",
    message: "The child launch failed.",
  });
  const tool = host.tools.get("pstack_launch");
  await assert.rejects(
    tool.execute("call-error", {
      modelRole: "bug-fix",
      executionRole: "implementer",
      task: "Fix the defect.",
    }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"])),
    /execution_failed: The child launch failed\./u,
  );
  assert.equal(host.entries.length, 0);
});

test("completion events append observed route evidence", async (testContext) => {
  const cwd = await projectWithConfig("bug-fix: openai-codex/gpt-5.6-sol:high\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("complete-1");
  const tool = host.tools.get("pstack_launch");
  await tool.execute("call-4", {
    modelRole: "bug-fix",
    executionRole: "implementer",
    task: "Fix the defect.",
  }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"]));

  host.pi.events.emit("subagent:async-complete", {
    runId: "complete-1",
    success: true,
    state: "completed",
    results: [{
      index: 0,
      agent: "poteto-agent",
      model: "openai-codex/gpt-5.6-sol",
      thinking: "high",
      status: "completed",
    }],
  });

  assert.equal(host.entries.length, 2);
  assert.equal(host.entries[1].data.kind, "completion");
  assert.equal(host.entries[1].data.state, "completed");
  assert.equal(host.entries[1].data.observed[0].model, "openai-codex/gpt-5.6-sol");
  assert.equal(host.entries[1].data.observed[0].thinking, "high");
  assert.deepEqual(host.entries[1].data.routingFailures, []);
  assert.deepEqual(host.entries[1].data.childFailures, []);
  assert.equal(host.messages.length, 0);
  const branch = host.entries.map((entry) => ({
    type: "custom",
    customType: entry.customType,
    data: entry.data,
  }));
  const status = await host.tools.get("pstack_status").execute("status-1", {
    runId: "complete-1",
  }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"], "session-a", branch));
  assert.match(status.content[0].text, /Pstack model role: bug-fix/u);
  assert.match(status.content[0].text, /Execution role: implementer/u);
  assert.match(status.content[0].text, /Success: true/u);
  assert.match(status.content[0].text, /Routing failures: none/u);
  assert.match(status.content[0].text, /Child failures: none/u);
});

test("completion events reject an observed model mismatch", async (testContext) => {
  const cwd = await projectWithConfig("bug-fix: openai-codex/gpt-5.6-sol:high\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("mismatch-1");
  const tool = host.tools.get("pstack_launch");
  await tool.execute("call-5", {
    modelRole: "bug-fix",
    executionRole: "implementer",
    task: "Fix the defect.",
  }, new AbortController().signal, undefined, context(cwd, ["openai-codex/gpt-5.6-sol"]));

  host.pi.events.emit("subagent:async-complete", {
    runId: "mismatch-1",
    success: true,
    state: "completed",
    results: [{
      agent: "poteto-agent",
      model: "openai-codex/gpt-5.6-luna:xhigh",
      thinking: "xhigh",
      status: "completed",
    }],
  });

  assert.equal(host.entries[1].data.state, "routing_failed");
  assert.equal(host.entries[1].data.success, false);
  assert.match(host.entries[1].data.routingFailures[0], /expected model/u);
  assert.match(host.messages[0].message.content, /Pstack rejected route mismatch-1/u);
});

test("completion events expose failed panel children", async (testContext) => {
  const cwd = await projectWithConfig("how critics: openai-codex/gpt-5.6-luna:minimal, openai-codex/gpt-5.6-sol:minimal\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("child-failure-1");
  const tool = host.tools.get("pstack_panel");
  await tool.execute("call-6", {
    modelRole: "how critics",
    executionRole: "reviewer",
    tasks: ["Review one.", "Review two."],
  }, new AbortController().signal, undefined, context(cwd, [
    "openai-codex/gpt-5.6-luna",
    "openai-codex/gpt-5.6-sol",
  ]));

  host.pi.events.emit("subagent:async-complete", {
    runId: "child-failure-1",
    success: true,
    state: "complete",
    workflowChildren: {
      children: [
        {
          agent: "pstack-runtime-read",
          model: "openai-codex/gpt-5.6-luna:minimal",
          thinking: "minimal",
          state: "rejected",
        },
        {
          agent: "pstack-runtime-read",
          model: "openai-codex/gpt-5.6-sol:minimal",
          thinking: "minimal",
          state: "completed",
        },
      ],
    },
  });

  assert.equal(host.entries[1].data.state, "child_failed");
  assert.equal(host.entries[1].data.success, false);
  assert.deepEqual(host.entries[1].data.routingFailures, []);
  assert.match(host.entries[1].data.childFailures[0], /rejected/u);
  assert.match(host.messages[0].message.content, /contains a failed child/u);
});

test("completion waits for the launch session after a session switch", async (testContext) => {
  const cwd = await projectWithConfig("bug-fix: openai-codex/gpt-5.6-sol:high\n");
  testContext.after(() => rm(cwd, { recursive: true, force: true }));
  const host = createHost("switched-1");
  const sessionStart = host.extensionHandlers.get("session_start")[0];
  const firstContext = context(cwd, ["openai-codex/gpt-5.6-sol"], "session-a");
  await sessionStart({}, firstContext);
  const tool = host.tools.get("pstack_launch");
  await tool.execute("call-7", {
    modelRole: "bug-fix",
    executionRole: "implementer",
    task: "Fix the defect.",
  }, new AbortController().signal, undefined, firstContext);
  const launchEntry = {
    type: "custom",
    customType: "pstack-route",
    data: host.entries[0].data,
  };

  await sessionStart({}, context(cwd, ["openai-codex/gpt-5.6-sol"], "session-b"));
  host.pi.events.emit("subagent:async-complete", {
    runId: "switched-1",
    success: true,
    state: "completed",
    results: [{
      agent: "poteto-agent",
      model: "openai-codex/gpt-5.6-sol:high",
      status: "completed",
    }],
  });
  assert.equal(host.entries.length, 1);

  await sessionStart({}, context(cwd, ["openai-codex/gpt-5.6-sol"], "session-a", [launchEntry]));
  assert.equal(host.entries.length, 2);
  assert.equal(host.entries[1].data.kind, "completion");
  assert.equal(host.entries[1].data.sessionId, "session-a");
  assert.equal(host.entries[1].data.success, true);
});
