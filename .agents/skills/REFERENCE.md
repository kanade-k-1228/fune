# fune-data データフォーマット リファレンス

`.agents/skills/` 配下の各スキルが共通で参照するデータ仕様。
ここが**単一の情報源**。スキル本文では要点のみ書き、詳細はこのファイルを読むこと。

正本の zod スキーマは `types/schema.ts`。迷ったら必ずそちらを確認する。

## ディレクトリと命名

- `data/lines/<id>.yaml` — 航路（時刻表・運航会社・寄港地など）
- `data/ports/<id>.yaml` — 港（名称・座標）
- ファイル名（拡張子を除く）が**そのまま航路 ID / 港 ID**になる
- ID は **小文字英数字とハイフン (`a-z`, `0-9`, `-`) のみ**。重複不可
  - 例: `data/lines/sasebo.yaml`, `data/ports/aburatsu.yaml`

## 座標の順序（最重要・間違えやすい）

座標はすべて **`[経度 lon, 緯度 lat]`** の順。GeoJSON と同じで Google Maps（緯度,経度）と逆。
日本付近なら lon ≈ 122〜154、lat ≈ 24〜46 の範囲に収まるはずなので、桁で取り違えに気づける。

## 港 `data/ports/<id>.yaml`

```yaml
name: ["", 油津] # [親エリア, 主名]。親エリアが無い単独港は "" を置く（空文字省略不可）
pos: [131.403192, 31.579824] # [経度, 緯度]
level: minor # 任意: major / minor / local
```

- `name` は必ず 2 要素のタプル。第 2 要素は 1 文字以上必須
- スキーマは `.strict()`。**未定義キーを足すと検証エラー**

## 航路 `data/lines/<id>.yaml`

```yaml
name: 佐世保市営 みつしま # 必須: 運航事業者名
route: 宇久島〜寺島〜小値賀島 # 必須: 航路名
color: "#d926a5" # 任意: 地図表示色 (#RRGGBB の 6 桁。3 桁不可)
mark: anchor # 任意: マーカー名
source: # 必須: 情報源 URL を 1 件以上。http(s) のみ
  - https://www.city.sasebo.lg.jp/...
fare: # 任意: 運賃情報 (1 行 1 価格)。行頭の "タグ::" で修飾 (後述)
  - adult::oneway::500円
  - adult::round::950円
  - child::half::250円
notes: # 任意: メモ・特記事項
  - 1月1日休航
ships: # 任意: 就航船舶
  - みつしま
ports: # 必須: 港ID → [経度, 緯度]
  konoura: [129.094689, 33.254858]
  terashima: [129.06478, 33.251453]
coords: # 任意: 航跡座標 (Polyline の配列)。自動編集対象外、手で触らない
  - - [129.094689, 33.254858]
    - [129.06478, 33.251453]
stops: [konoura, terashima] # 必須: 時刻表の横軸。三角運行では港IDの重複可
timetables: # 任意: 時刻表 (キー = ダイヤ ID)
  normal:
    name: 通常ダイヤ
    voyages:
      - name: 1便 # 任意
        note: 予約制 # 任意
        stops: ["08:10", "08:19"]
schedule: # 任意: ダイヤカレンダー (パターン → timetable ID)
  isHoliday: dia1
  "*": normal
flags: # 任意: 航路属性
  - regional
```

スキーマは `.strict()`。Line / Port / Voyage / Timetable いずれも**未定義キー追加は不可**。

### `fare` のタグ修飾

fare の各行は行頭に `タグ::` を連結して修飾する (例: `child::half::500円` → [小人][半額] 500円)。
タグは**行頭のみ**解釈される。**1 行 1 価格**とし、大人/小人・片道/往復のほか、
車長区分や乗船区間など価格が異なるものはすべて行を分ける。
補足は本文の括弧書きで添える (例: `adult::oneway::500円（中学生以上）`)。
タグなしの行 (注記など) はそのまま表示される。

| タグ       | 表示     | タグ     | 表示   |
| ---------- | -------- | -------- | ------ |
| `adult`    | 大人     | `oneway` | 片道   |
| `child`    | 小人     | `round`  | 往復   |
| `infant`   | 幼児     | `car`    | 乗用車 |
| `student`  | 学生     | `moto`   | 二輪   |
| `disabled` | 障がい者 | `bicycle`| 自転車 |
| `group`    | 団体     | `half`   | 半額   |

未知のタグはラベルのみのチップとして表示される (エラーにはならない)。

### `flags` で使える値（このいずれかのみ）

- 船種: `cargo` `container` `roro` `passenger` `ferry` `rapid` `jetfoil`
- 航路規模: `national` `regional` `local`
- 運航頻度: `seasonal` `suspend`

休止を見つけたら `suspend`（休止）を付ける。廃止された航路は flags を付けず **ファイルごと削除**する。

### 時刻フォーマット

- `HH:MM`（24 時間制）
- 翌日以降に跨る便は `D:HH:MM`（例: `1:04:30` = 翌日 04:30）

### `stops`（便の停留所時刻）の各要素

`timetables.<dia>.voyages[].stops` の要素は次のいずれか:

- `null` — 通過（その港に寄らない）
- `"HH:MM"` / `"D:HH:MM"` — 着発同時刻
- `["HH:MM", "HH:MM"]` — `[着, 発]` の片時刻タプル

**各 voyage の `stops` 配列の長さは、航路トップの `stops`（港 ID リスト）の長さと必ず一致**させる。

### Voyage 単位の `schedule`（臨時運行 / 臨時運休）

`voyage.schedule` は `Pattern<boolean>`。`true`=運航、`false`=運休。
選択された dia 内の各 voyage に適用（未指定なら常時運航）。

```yaml
# 特定日のみ運航する臨時便
schedule:
  "2026-05-03..2026-05-06": true
  "*": false

# 特定日のみ運休する便
schedule:
  "2026-08-13..2026-08-15": false
  "*": true
```

### Line の `schedule`（適用ダイヤの DSL）

[koyomify](https://github.com/kanade-k-1228/koyomify) **v0.2.0** の `match` DSL。
キーが日付条件、値が `timetables` のキー（dia 名）または更にネストした条件。
上から評価し最初にマッチした葉の dia を採用。未指定/未マッチなら `timetables` の先頭。

v0.2.0 で**実際に動く**条件キーはこれだけ:

| 形                         | 意味                                       |
| -------------------------- | ------------------------------------------ |
| `YYYY-MM-DD`               | 単一日（例 `"2026-08-15": dia1`）          |
| `YYYY-MM-DD..YYYY-MM-DD`   | 期間（両端含む）                           |
| `isMonday`〜`isSunday`     | 曜日固定                                    |
| `isWeekend` / `isWeekday`  | 土日 / 平日                                 |
| `isHoliday`                | 日本の祝日                                  |
| `nthDay(n)` `nthMonth(n)` `nthWeek(n)` | 日 / 月 / 月内週の固定          |
| `!X`                       | 真偽反転（先頭のみ）                       |
| `day(-1).isHoliday`        | 日付シフト後に評価（前日が祝日 等）        |
| `*`                        | default（必ず真）                          |

```yaml
schedule:
  "2026-07-28..2026-08-31":
    isHoliday: summer-b
    isWeekend: summer-b
    "*": summer-a
  "2025-12-29..2026-01-03": new-year
  isMonday:
    "!isHoliday": closed
  isWeekend: weekend-dia
  "*": weekday-dia
```

⚠️ `monday` / `weekend` / `X.not` / `prev.X` / `dow(...)` は **v0.2.0 未実装**。
上表のキー（`isMonday` 等 / `!X` / `day(-1).X`）だけを使う。

## 参照整合性ルール（`pnpm validate` がチェック）

- `ports` のキーは `data/ports/<id>.yaml` が**存在**しなければならない
- `stops` の各要素は `ports` のキーでなければならない
- 各 `voyage.stops` の要素数は `stops` の要素数と一致
- `schedule` が参照する timetable ID は `timetables` に存在
- ファイル名・ID は `^[a-z0-9-]+$` かつ重複なし

## コマンド

```sh
pnpm install     # 初回のみ
pnpm validate    # 型 + 参照整合性チェック（編集後は必ず実行）
pnpm build       # data/*.yaml → dist/data/{lines,ports}.json (任意)
pnpm check       # biome lint/format チェック
pnpm fix         # biome 自動修正
```

エラーは `ファイル名: パス: メッセージ` 形式。PR では GitHub Actions が `pnpm validate` を自動実行する。

## 情報源の信頼度

公式情報源（**運航会社・自治体・観光協会の公式サイト**）のみを信頼する。
SNS / 個人ブログ / まとめサイトは参考程度に留め、`source` には入れない。
