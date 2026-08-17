// 港情報レベル
export type PortLevel = "major" | "minor" | "local";

// 港: data/ports/<id>.yaml
export interface Port {
  name: [string, string]; // [area, main]
  pos: [number, number]; // [lon, lat]
  level?: PortLevel;
}

// 航路規模・船種を表すフラグ
export type Flag =
  // 船種
  | "cargo"
  | "container"
  | "roro"
  | "passenger"
  | "ferry"
  | "rapid"
  | "jetfoil"
  // 航路規模
  | "national"
  | "regional"
  | "local"
  // 運航頻度
  | "seasonal"
  | "suspend";

// 時刻表の停留所通過情報
// null: 通過、string: 着発同時刻、[string, string]: [arrival, departure]
export type Stop = null | string | [string, string];

export interface Voyage {
  name?: string;
  note?: string;
  stops: Stop[];
  schedule?: Record<string, boolean>;
}

export interface Timetable {
  name: string;
  voyages: Voyage[];
}

// koyomify Pattern<string>: 文字列、または更にネストしたパターン
export type SchedulePattern = string | { [key: string]: SchedulePattern };

// 航路: data/lines/<id>.yaml
export interface Line {
  name: string;
  route: string;
  color?: string;
  mark?: string;
  source: string[];
  fare?: string[];
  notes?: string[];
  ships?: string[];
  // 港 ID → [lon, lat]
  ports: Record<string, [number, number]>;
  // 航跡座標 (Polyline の配列)
  coords?: [number, number][][];
  // 時刻表横軸 (港 ID。三角運行で重複可)
  stops: string[];
  timetables?: Record<string, Timetable>;
  // ダイヤカレンダー (パターン → timetable ID)
  schedule?: Record<string, SchedulePattern>;
  flags?: Flag[];
}
