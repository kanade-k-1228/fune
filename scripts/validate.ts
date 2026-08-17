import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import { LineSchema, PortSchema } from "../types/index.js";

// 起動: tsx scripts/validate.ts --root .
// root 配下の data/{lines,ports} を検証する (既定はこのパッケージのルート)
const { values: args } = parseArgs({
  options: {
    root: {
      type: "string",
      short: "r",
      default: fileURLToPath(new URL("..", import.meta.url)),
    },
  },
});

const PORTS_DIR = join(args.root, "data", "ports");
const LINES_DIR = join(args.root, "data", "lines");

type Issue = { file: string; message: string };

const listYaml = (dir: string): string[] =>
  readdirSync(dir)
    .filter((f) => extname(f) === ".yaml")
    .sort();

const idOf = (file: string): string => basename(file, ".yaml");

const formatZodError = (err: z.ZodError): string =>
  err.issues
    .map((i) => {
      const path = i.path.length === 0 ? "(root)" : i.path.join(".");
      return `  - ${path}: ${i.message}`;
    })
    .join("\n");

const loadYaml = (path: string): unknown =>
  parseYaml(readFileSync(path, "utf8"));

const validatePorts = (): { ids: Set<string>; issues: Issue[] } => {
  const issues: Issue[] = [];
  const ids = new Set<string>();
  for (const f of listYaml(PORTS_DIR)) {
    const id = idOf(f);
    const rel = `data/ports/${f}`;
    if (!/^[a-z0-9-]+$/.test(id)) {
      issues.push({
        file: rel,
        message: `ファイル名は小文字英数字とハイフンのみ使用可能: "${id}"`,
      });
    }
    if (ids.has(id)) {
      issues.push({ file: rel, message: `港 ID が重複: "${id}"` });
    }
    ids.add(id);

    let raw: unknown;
    try {
      raw = loadYaml(join(PORTS_DIR, f));
    } catch (e) {
      issues.push({
        file: rel,
        message: `YAML 解析失敗: ${(e as Error).message}`,
      });
      continue;
    }
    const parsed = PortSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ file: rel, message: `\n${formatZodError(parsed.error)}` });
    }
  }
  return { ids, issues };
};

const validateLines = (portIds: Set<string>): Issue[] => {
  const issues: Issue[] = [];
  const lineIds = new Set<string>();
  for (const f of listYaml(LINES_DIR)) {
    const id = idOf(f);
    const rel = `data/lines/${f}`;
    if (!/^[a-z0-9-]+$/.test(id)) {
      issues.push({
        file: rel,
        message: `ファイル名は小文字英数字とハイフンのみ使用可能: "${id}"`,
      });
    }
    if (lineIds.has(id)) {
      issues.push({ file: rel, message: `航路 ID が重複: "${id}"` });
    }
    lineIds.add(id);

    let raw: unknown;
    try {
      raw = loadYaml(join(LINES_DIR, f));
    } catch (e) {
      issues.push({
        file: rel,
        message: `YAML 解析失敗: ${(e as Error).message}`,
      });
      continue;
    }
    const parsed = LineSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ file: rel, message: `\n${formatZodError(parsed.error)}` });
      continue;
    }

    const line = parsed.data;

    // ports に挙がっている ID は data/ports/ に存在しなければならない
    for (const pid of Object.keys(line.ports)) {
      if (!portIds.has(pid)) {
        issues.push({
          file: rel,
          message: `ports.${pid} は data/ports/${pid}.yaml に存在しません`,
        });
      }
    }

    // stops の各要素は ports のキーに存在しなければならない
    for (const [i, sid] of line.stops.entries()) {
      if (!(sid in line.ports)) {
        issues.push({
          file: rel,
          message: `stops[${i}] "${sid}" が ports に定義されていません`,
        });
      }
    }

    // timetable の voyage.stops 長さが line.stops と一致しなければならない
    if (line.timetables) {
      for (const [ttId, tt] of Object.entries(line.timetables)) {
        for (const [vi, v] of tt.voyages.entries()) {
          if (v.stops.length !== line.stops.length) {
            issues.push({
              file: rel,
              message: `timetables.${ttId}.voyages[${vi}].stops の要素数 (${v.stops.length}) が line.stops の要素数 (${line.stops.length}) と一致しません`,
            });
          }
        }
      }
    }

    // schedule の string 葉ノードはすべて timetables のキーでなければならない
    if (line.schedule) {
      const ttKeys = new Set(Object.keys(line.timetables ?? {}));
      const walk = (node: unknown, path: string[]): void => {
        if (typeof node === "string") {
          if (!ttKeys.has(node)) {
            issues.push({
              file: rel,
              message: `schedule.${path.join(".")} が参照する timetable "${node}" は定義されていません`,
            });
          }
          return;
        }
        if (node && typeof node === "object") {
          for (const [k, v] of Object.entries(node)) {
            walk(v, [...path, k]);
          }
        }
      };
      walk(line.schedule, []);
    }
  }
  return issues;
};

const main = (): void => {
  console.log("data/ports を検証中...");
  const { ids: portIds, issues: portIssues } = validatePorts();
  console.log(`  → ${portIds.size} 件読込`);

  console.log("data/lines を検証中...");
  const lineIssues = validateLines(portIds);

  const all = [...portIssues, ...lineIssues];
  if (all.length === 0) {
    console.log("\n✓ すべてのデータが型・参照整合性チェックに合格しました");
    return;
  }

  console.error(`\n✗ ${all.length} 件のエラーが見つかりました:\n`);
  for (const { file, message } of all) {
    console.error(`${file}: ${message}`);
  }
  process.exit(1);
};

main();
