// data/ports/*.yaml と data/lines/*.yaml を読み込み、相互参照を解決した
// JSON を dist/data/ports.json / dist/data/lines.json に出力する。

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { parseArgs } from "node:util";
import { parse as parseYaml } from "yaml";
import type {
  Line,
  LinePortJson,
  LinesJson,
  Port,
  PortJson,
  PortsJson,
} from "../types/index.js";
import { LineSchema, PortSchema } from "../types/index.js";

const { values: args } = parseArgs({
  options: {
    root: { type: "string", short: "r", default: process.cwd() },
    out: { type: "string", short: "o", default: "dist/data" },
  },
});

const PORTS_DIR = join(args.root, "data", "ports");
const LINES_DIR = join(args.root, "data", "lines");
const OUT_DIR = join(args.root, args.out);

const listYaml = (dir: string): string[] =>
  readdirSync(dir)
    .filter((f) => extname(f) === ".yaml")
    .sort();

const idOf = (file: string): string => basename(file, ".yaml");

const readPorts = (): Record<string, Port> => {
  const out: Record<string, Port> = {};
  for (const f of listYaml(PORTS_DIR)) {
    const raw = parseYaml(readFileSync(join(PORTS_DIR, f), "utf8"));
    out[idOf(f)] = PortSchema.parse(raw);
  }
  return out;
};

const readLines = (): Record<string, Line> => {
  const out: Record<string, Line> = {};
  for (const f of listYaml(LINES_DIR)) {
    const raw = parseYaml(readFileSync(join(LINES_DIR, f), "utf8"));
    out[idOf(f)] = LineSchema.parse(raw);
  }
  return out;
};

const buildPortsJson = (
  ports: Record<string, Port>,
  lines: Record<string, Line>,
): PortsJson => {
  // port → 寄港 line ID 集合
  const portToLines: Record<string, Set<string>> = {};
  for (const [lid, l] of Object.entries(lines)) {
    for (const pid of Object.keys(l.ports)) {
      portToLines[pid] ??= new Set();
      portToLines[pid].add(lid);
    }
  }

  const out: PortsJson = {};
  for (const [pid, p] of Object.entries(ports)) {
    const entry: PortJson = {
      name: p.name,
      pos: p.pos,
      lines: [...(portToLines[pid] ?? [])].sort(),
    };
    if (p.level) entry.level = p.level;
    out[pid] = entry;
  }
  return out;
};

const buildLinesJson = (
  lines: Record<string, Line>,
  ports: Record<string, Port>,
): LinesJson => {
  const out: LinesJson = {};
  for (const [lid, l] of Object.entries(lines)) {
    const linePorts: Record<string, LinePortJson> = {};
    for (const [pid, pos] of Object.entries(l.ports)) {
      const port = ports[pid];
      if (!port) {
        throw new Error(`line "${lid}" references unknown port "${pid}"`);
      }
      linePorts[pid] = { name: port.name, pos };
    }
    out[lid] = { ...l, ports: linePorts };
  }
  return out;
};

const main = (): void => {
  console.log("Reading data/ports ...");
  const ports = readPorts();
  console.log(`  → #${Object.keys(ports).length}`);

  console.log("Reading data/lines ...");
  const lines = readLines();
  console.log(`  → #${Object.keys(lines).length}`);

  const portsJson = buildPortsJson(ports, lines);
  const linesJson = buildLinesJson(lines, ports);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "ports.json"),
    `${JSON.stringify(portsJson, null, 2)}\n`,
  );
  writeFileSync(
    join(OUT_DIR, "lines.json"),
    `${JSON.stringify(linesJson, null, 2)}\n`,
  );

  console.log(`✓ dist/data/ports.json (#${Object.keys(portsJson).length})`);
  console.log(`✓ dist/data/lines.json (#${Object.keys(linesJson).length})`);
};

main();
