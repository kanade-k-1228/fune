// pnpm run update [--id <line-id>] [--limit N] [--model <id>] [--root <dir>]

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { parse as parseYaml } from "yaml";
import { LineSchema } from "../types/index.js";

// state.json / logs / batch-prompt.md はスクリプト同梱物 (HERE 基準・--root に紐付けない)
const HERE = dirname(fileURLToPath(import.meta.url));
const SYSTEM = readFileSync(join(HERE, "update.md"), "utf8");
const STATE = join(HERE, "state.json");
const LOGS = join(HERE, "logs");

if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
  console.error("Undefined Env var: CLAUDE_CODE_OAUTH_TOKEN");
  process.exit(1);
}

const { values: args } = parseArgs({
  options: {
    id: { type: "string", short: "i" },
    limit: { type: "string", short: "n" },
    model: { type: "string", short: "m", default: "claude-sonnet-4-6" },
    root: { type: "string", short: "r", default: process.cwd() },
  },
});
const limit = args.limit ? Number(args.limit) : Number.POSITIVE_INFINITY;
const LINES_DIR = join(args.root, "data/lines");

mkdirSync(LOGS, { recursive: true });

const done = new Set<string>(
  existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")).done : [],
);
const saveState = () =>
  writeFileSync(STATE, `${JSON.stringify({ done: [...done] }, null, 2)}\n`);

const allIds = readdirSync(LINES_DIR)
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .sort();

const targets = (
  args.id ? [args.id] : allIds.filter((id) => !done.has(id))
).slice(0, limit);

console.log(`対象: ${targets.length} 件 (全 ${allIds.length} 件中)`);

let ok = 0;
let failed = 0;
let totalCost = 0;
const t0 = Date.now();

for (const id of targets) {
  const yamlPath = join(LINES_DIR, `${id}.yaml`);
  if (!existsSync(yamlPath)) {
    console.error(`  ✗ ${id}: ファイルが存在しません`);
    failed++;
    continue;
  }

  let line: ReturnType<typeof LineSchema.parse>;
  try {
    line = LineSchema.parse(parseYaml(readFileSync(yamlPath, "utf8")));
  } catch (e) {
    console.error(`  ✗ ${id}: 既存 YAML が schema 違反`, e);
    failed++;
    continue;
  }

  const today = new Date().toISOString().slice(0, 10);
  const prompt =
    `対象: data/lines/${id}.yaml\n` +
    `航路: ${line.route} (運航: ${line.name})\n` +
    `情報源:\n${line.source.map((u) => `- ${u}`).join("\n")}\n\n` +
    `今日の日付: ${today}\n\n` +
    `上記情報源を確認して時刻表を最新化してください。`;

  const log: string[] = [];
  log.push(JSON.stringify({ type: "_start", id, prompt }));

  const start = Date.now();
  let cost = 0;
  let success = false;
  try {
    const stream = query({
      prompt,
      options: {
        cwd: args.root,
        model: args.model,
        systemPrompt: SYSTEM,
        allowedTools: ["WebSearch", "WebFetch", "Read", "Edit", "Bash"],
        disallowedTools: ["Write"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    });
    for await (const ev of stream) {
      log.push(JSON.stringify(ev));
      if (ev.type === "result") {
        cost = ev.total_cost_usd ?? 0;
        if (ev.subtype === "success") success = true;
      }
    }
  } catch (e) {
    log.push(JSON.stringify({ type: "_error", error: String(e) }));
  }

  // post-validate. 壊れていたら git restore で巻き戻し
  let valid = false;
  try {
    LineSchema.parse(parseYaml(readFileSync(yamlPath, "utf8")));
    valid = true;
  } catch (e) {
    log.push(JSON.stringify({ type: "_schema_violation", error: String(e) }));
    try {
      execSync(`git restore ${JSON.stringify(yamlPath)}`, { cwd: args.root });
      log.push(JSON.stringify({ type: "_reverted" }));
    } catch (re) {
      log.push(JSON.stringify({ type: "_revert_failed", error: String(re) }));
    }
  }

  writeFileSync(join(LOGS, `${id}.jsonl`), `${log.join("\n")}\n`);
  done.add(id);
  saveState();

  totalCost += cost;
  const dur = ((Date.now() - start) / 1000).toFixed(1);
  const okOrFail = success && valid;
  if (okOrFail) ok++;
  else failed++;
  console.log(
    `  ${okOrFail ? "✓" : "✗"} [${ok + failed}/${targets.length}] ${id} (${dur}s, $${cost.toFixed(3)})`,
  );
}

const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
console.log(
  `\n完了: ok=${ok} failed=${failed} / 累積 $${totalCost.toFixed(2)} / ${totalSec}s`,
);
