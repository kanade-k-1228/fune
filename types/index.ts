// YAML 入力型 (data/*.yaml 用)

// JSON 出力型 (dist/data/*.json 用)
export type {
  LineJson,
  LinePortJson,
  LinesJson,
  PortJson,
  PortsJson,
} from "./json.js";
// zod スキーマ (YAML をパース・検証)
export { LineSchema, PortSchema } from "./schema.js";
export type {
  Flag,
  Line,
  Port,
  PortLevel,
  SchedulePattern,
  Stop,
  Timetable,
  Voyage,
} from "./yaml.js";
