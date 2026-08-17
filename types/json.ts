// scripts/build.ts が dist/data/ports.json / dist/data/lines.json として
// 出力する形。YAML 入力 (yaml.ts) を相互参照で解決済み。

import type { Flag, PortLevel, SchedulePattern, Timetable } from "./yaml.js";

// dist/data/ports.json — 港マスタ + 寄港航路 ID
export interface PortJson {
  name: [string, string]; // [area, main]
  pos: [number, number]; // [lon, lat]
  level?: PortLevel;
  lines: string[]; // この港に寄港する航路 ID (昇順)
}

export type PortsJson = Record<string, PortJson>;

// 航路 ports のエントリ。YAML では座標のみだったものに港名を付与。
export interface LinePortJson {
  // [area, main] (data/ports/<id>.yaml から取得)
  name: [string, string];
  // [lon, lat]
  pos: [number, number];
}

// dist/data/lines.json の値
export interface LineJson {
  name: string;
  route: string;
  color?: string;
  mark?: string;
  source: string[];
  fare?: string[];
  notes?: string[];
  ships?: string[];
  // 港 ID → 港名と座標
  ports: Record<string, LinePortJson>;
  coords?: [number, number][][];
  stops: string[];
  timetables?: Record<string, Timetable>;
  schedule?: Record<string, SchedulePattern>;
  flags?: Flag[];
}

export type LinesJson = Record<string, LineJson>;
