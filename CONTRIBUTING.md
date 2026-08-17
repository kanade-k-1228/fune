# コントリビュートガイド

データの追加・修正をプルリクエストで歓迎します。

## クイックスタート

1. リポジトリを fork してクローン
2. `data/lines/` または `data/ports/` の YAML を追加・編集
3. 手元で `pnpm install && pnpm validate` を実行し、すべてのファイルが合格することを確認
4. プルリクエストを作成 — GitHub Actions が自動で `validate` を実行

## ファイル命名

- 小文字英数字とハイフン (`a-z`, `0-9`, `-`) のみ
- 例: `data/lines/sasebo.yaml`, `data/ports/aburatsu.yaml`
- ファイル名 (拡張子を除く) がそのまま航路 ID / 港 ID になります

## 港 (`data/ports/<id>.yaml`)

```yaml
name: [ "", 油津 ]              # [親エリア, 主名]。親エリアが無い場合は ""
pos: [ 131.403192, 31.579824 ] # [経度, 緯度]
level: minor                   # 任意: major / minor / local
```

## 航路 (`data/lines/<id>.yaml`)

```yaml
name: 佐世保市営 みつしま           # 運航事業者名
route: 宇久島〜寺島〜小値賀島        # 航路名
color: "#d926a5"                # 任意: 地図表示色 (#RRGGBB)
source:                         # 必須: 情報源 URL (1つ以上)
  - https://www.city.sasebo.lg.jp/...
fare:                           # 任意: 運賃情報 (1行1項目)
  - 大人片道500円、小人250円
notes:                          # 任意: メモ
  - 1月1日休航
ships:                          # 任意: 就航船舶
  - みつしま
ports:                          # 港ID → [経度, 緯度]
  konoura: [ 129.094689, 33.254858 ]
  terashima: [ 129.06478, 33.251453 ]
coords:                         # 任意: 航跡座標 (Polyline 配列)
  - - [ 129.094689, 33.254858 ]
    - [ 129.06478, 33.251453 ]
stops: [ konoura, terashima ]   # 時刻表の横軸。三角運行では港IDの重複可
timetables:                     # 任意: 時刻表 (キー = ダイヤID)
  normal:
    name: 通常ダイヤ
    voyages:
      - name: 1便
        stops: [ "08:10", "08:19" ]   # null=通過 / "HH:MM" / [arr, dep]
schedule:                       # 任意: ダイヤカレンダー (パターン → timetable ID)
  isHoliday: dia1
  "*": normal
flags:                          # 任意: 航路属性
  - regional
```

### `flags` で使える値

- 船種: `cargo`, `container`, `roro`, `passenger`, `ferry`, `rapid`, `jetfoil`
- 航路規模: `national`, `regional`, `local`
- 運航頻度: `seasonal`, `suspend`, `abolished`

### 時刻のフォーマット

- `HH:MM` (24 時間制)
- 翌日以降に跨る場合は `D:HH:MM` (例: `1:04:30` = 翌日 04:30)

### 参照整合性ルール

CI が以下を自動でチェックします。

- `ports` のキーは `data/ports/<id>.yaml` が存在しなければならない
- `stops` の各要素は `ports` のキーでなければならない
- 各 `voyage.stops` の要素数は `stops` の要素数と一致しなければならない
- `schedule` で参照する timetable ID は `timetables` に存在しなければならない

## ローカル検証

```sh
pnpm install
pnpm validate    # 型と参照整合性をチェック
pnpm build       # YAML から dist/data/*.json を生成 (任意)
```

エラーは「`ファイル名: パス: メッセージ`」の形式で表示されます。
