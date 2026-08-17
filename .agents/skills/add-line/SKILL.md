---
name: add-line
description: 新しい航路を data/lines/<id>.yaml として追加する。運航会社・寄港地・時刻表が分かっている航路を新規登録するときに使う。「○○航路を追加して」「新しい便を登録して」等のときに使用。寄港港が未登録なら add-port も併用する。
---

# 航路データの新規追加

新しい航路を `data/lines/<id>.yaml` として作成するスキル。

データ仕様（全フィールド・スキーマ・flags・時刻形式・schedule DSL・検証ルール）は
**[`../REFERENCE.md`](../REFERENCE.md) を先に読むこと**。本文では追加手順に絞る。

## 手順

1. **ID を決める** — `^[a-z0-9-]+$`、既存 `data/lines/` と重複しない。ローマ字や代表港名など分かりやすい名前にする
2. **情報を集める** — 公式情報源（運航会社・自治体・観光協会）から: 運航事業者名 `name`、航路名 `route`、寄港地、時刻表、運賃、就航船舶、運航日。`source` に公式 URL（http(s) のみ・1 件以上）を必ず入れる
3. **寄港港を確認** — 寄港する各港が `data/ports/<id>.yaml` に存在するか確認する。**無ければ先に `add-port` スキルで港を追加**してから航路を作る（`pnpm validate` が未登録港を弾く）
4. **港座標を記入** — `ports:` に港 ID → `[経度, 緯度]`。座標は港 YAML の `pos` と整合させる（同一地点）。座標順は **[lon, lat]**（REFERENCE.md 参照）
5. **stops を組む** — 時刻表の横軸となる港 ID 列。三角運行・周回は港 ID の重複可
6. **timetables を書く** — 各 voyage の `stops` 配列長は航路トップ `stops` と一致。通過は `null`、着発別なら `["着","発"]`
7. **schedule（任意）** — 平日/休日/季節でダイヤが変わる場合のみ。koyomify v0.2.0 のキーのみ使用（REFERENCE.md の表）
8. **flags（任意）** — 船種・規模・運航頻度を REFERENCE.md の許容値から付ける
9. **coords（任意）** — 航跡を描くなら Polyline 配列。不明なら省略可（後で admin エディタで描ける）
10. **検証** — `pnpm validate` を実行して合格を確認する

## 最小テンプレート

```yaml
name: 運航会社名
route: 航路名
source:
  - https://example.com/
ports:
  port-a: [129.0, 33.2]
  port-b: [129.1, 33.3]
stops: [port-a, port-b]
timetables:
  normal:
    name: 通常ダイヤ
    voyages:
      - stops: ["08:10", "08:40"]
      - stops: ["09:10", "09:40"]
flags: [regional]
```

## 守ること（検証で弾かれる）

- `ports` のキーは `data/ports/<id>.yaml` が存在すること（無ければ `add-port` を先に）
- `stops` の各要素は `ports` のキーであること
- 各 voyage の `stops` 配列長 = 航路トップ `stops` の長さ
- `schedule` の dia 名は `timetables` のキーであること
- スキーマは `.strict()`。**未定義キーを足さない**
- 不明な情報を**捏造しない**。分からない欄は任意項目なら省略する

## 報告フォーマット

```
## 追加
- data/lines/<id>.yaml （航路名 / 運航会社）
- （必要なら）data/ports/<id>.yaml を N 件追加

## 情報源
- https://... (公式)

## validate
- pnpm validate: ✓
```
