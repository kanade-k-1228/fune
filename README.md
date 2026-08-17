# fune-data

日本の旅客船・貨物船の航路と港のオープンデータ。誰でもプルリクエストでデータを追加・修正できます。

## ディレクトリ構成

- `data/lines/<id>.yaml` — 航路 (時刻表、運航会社、寄港地など)
- `data/ports/<id>.yaml` — 港 (名称、座標)
- `types/` — TypeScript 型と zod スキーマ
  - `yaml.ts` — YAML 入力型 (data/*.yaml のソース型)
  - `json.ts` — JSON 出力型 (ビルド後の型)
  - `schema.ts` — YAML を検証する zod スキーマ
- `scripts/build.ts` — YAML → JSON ビルド (port-line 相互参照を解決)
- `scripts/validate.ts` — 型・参照整合性チェック
- `dist/` — ビルド成果物 (gitignored)
  - `dist/types/*.js` `*.d.ts` — 型と zod スキーマ (`.d.ts` 付き)
  - `dist/scripts/*.js` — ビルド/検証スクリプト
  - `dist/data/lines.json` — 全航路を統合した JSON
  - `dist/data/ports.json` — 全港を統合した JSON

## データを追加・修正する

[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。プルリクエストは自動で型チェック CI にかかります。

## ライブラリ / データパッケージとしての利用

このリポジトリは npm パッケージとしても利用可能です (npm レジストリには公開していません)。
別プロジェクトから git submodule + `file:` 参照でインストールします。

```sh
# サブモジュール追加
git submodule add https://github.com/<owner>/fune external/fune-data

# pnpm の例
pnpm add file:./external/fune-data
```

インストール時に `prepare` スクリプトが走り、TypeScript ビルドと YAML→JSON 変換が実行され `dist/` が生成されます。

### 型・スキーマを使う

```ts
import { LineSchema, PortSchema } from "fune-data";
import type { Line, Port, LineJson, PortJson } from "fune-data";
import { parse } from "yaml";
import { readFileSync } from "node:fs";

// YAML を読んでスキーマで検証
const port: Port = PortSchema.parse(parse(readFileSync("aburatsu.yaml", "utf8")));
```

zod スキーマだけ欲しい場合: `import { LineSchema } from "fune-data/schema"`

### ビルド済み JSON を使う

```ts
import lines from "fune-data/lines" with { type: "json" };
import ports from "fune-data/ports" with { type: "json" };
import type { LinesJson, PortsJson } from "fune-data";

const typedLines = lines as LinesJson;
const typedPorts = ports as PortsJson;
```

JSON は port-line の相互参照が解決済み:

- `ports.json` の各港に `lines: string[]` (寄港する航路 ID) が付く
- `lines.json` の各航路の `ports` には港名 (`name`) が付く

## 開発

```sh
pnpm install
pnpm build       # types/ と data/*.yaml から dist/ を生成
pnpm validate    # 型・参照整合性チェック
pnpm check       # biome lint/format チェック
pnpm fix         # biome 自動修正
```
