# fune-data エージェントスキル

`fune-data`（航路・港のオープンデータ）を編集するための [Agent Skills](https://code.claude.com/docs/en/skills)。
Claude Code 等のエージェントが、データ更新作業のときに自動で参照する。

## スキル一覧

| スキル                            | 用途                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| [`update-line`](./update-line/)   | 既存航路 `data/lines/<id>.yaml` を公式情報源から最新化（時刻表・運賃・運休・改廃） |
| [`add-line`](./add-line/)         | 新規航路を `data/lines/<id>.yaml` として追加                          |
| [`add-port`](./add-port/)         | 新規港を `data/ports/<id>.yaml` として追加                            |

## 共有リファレンス

[`REFERENCE.md`](./REFERENCE.md) — データフォーマットの単一情報源。
スキーマ・`flags`・時刻形式・`schedule` DSL（koyomify v0.2.0）・参照整合性ルール・コマンドをまとめている。
各スキルはここを参照する。正本の zod スキーマは `types/schema.ts`。

## 編集後は必ず検証

```sh
pnpm validate    # 型 + 参照整合性チェック（PR でも CI が自動実行）
```

## バッチ更新（SDK ランナー）

多数航路を非対話で一括更新するランナーは `update-line` スキルに同梱:

```sh
pnpm update [--id <line-id>] [--limit N]   # 要 CLAUDE_CODE_OAUTH_TOKEN（.env.local）
```

- 実体: `update-line/update.ts`（Claude Agent SDK）
- 単体エージェント用システムプロンプト: `update-line/batch-prompt.md`
- 対話的な更新は `update-line/SKILL.md`（サブエージェント分割型）。両者は同じ更新ポリシー（REFERENCE.md）を共有

## 関連

- 人間向けの寄稿手順は [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
