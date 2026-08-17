# 一次情報での要確認リスト（2026-08-17 調査）

Web 検索によるサブエージェント調査（65 航路）で判明した「変更があると分かったが、
一次情報に到達できず数値を確定できなかった項目」の一覧。

## この調査の制約

実行環境の egress ポリシーにより、**運航会社・自治体・報道の全ドメインへの HTTP
アクセスが遮断されていた**（`WebFetch` は `EGRESS_BLOCKED`、`curl` は CONNECT 拒否。
到達可能なのは github.com 系のみ）。使えたのは `WebSearch` のみで、公式ドメインを
`allowed_domains` に指定して検索要約の確度を上げる方法を採った。

`.agents/skills/REFERENCE.md` が定める「公式情報源のみを信頼する」「確信が持てない
情報は書かない」に従い、**検索要約から推測した時刻・運賃の数値は一切書き込んでいない**。
下記は `pnpm update` 等が使える環境（egress が通る環境）で片付ける前提の残タスク。

---

## A. 時刻表の実数値が必要（最優先）

| 航路 | 内容 | 一次情報 |
| --- | --- | --- |
| `snf-tsuruga-niigata-akita` | **2026年10月1日ダイヤ改正**。敦賀発 09:30→18:30、週1便→週3便（北行 火木日／南行 火木土）、所要 31時間15分→46時間15分。現 `timetables` は改正前。新 dia の追加と `schedule` での日付切替が必要 | <https://www.snf.jp/timetable1001/> |
| `jumbo-ferry` | **2026年7月1日ダイヤ改正**。神戸発朝便 6:00→8:15（土休日も統一）、平日昼便を30分繰上げ。現状は平日/土休日が単一 dia のため `weekday`/`holiday` の2本化が必要 | <https://ferry.co.jp/news/41857/> |
| `nankai-ferry` | **2026年8月より8往復→6往復に減便**。現 `timetables` は減便前 | <https://nankai-ferry.co.jp/> |
| `oki-kisen` | 2026年6月にダイヤ変更。公式時刻表は期間ごとに別ページで、現 `timetables` がどの期間のものか不明。**高速船レインボージェットの便が1本も未収録** | <https://www.oki-kisen.co.jp/timetable/timetable_ferry/> |
| `ocean-tokyu-ferry` | **下り便（東京→徳島→新門司）の voyage が存在しない**。公式月別 PDF によれば 19:00発→翌13:20/14:20→翌々05:35 だが、便と日付の対応は PDF 実物で確認が必要 | <https://www.otf.jp/schedule/> |
| `iki-tsushima-ferry` | `timetables` 自体が未整備。月ごとに時刻料金表 PDF を差し替える方式＋配船A/B/C切替。当月分 PDF が必要 | <https://iki-tsushima.com/price/> |
| `tokai-kisen` / `-hachijo` | 公式時刻表が期間別（4.6〜6.30 / 7.1〜9.30 / 10.1〜翌4.4 ＋GW特別ダイヤ）。単一 dia では表現できていない | <https://www.tokaikisen.co.jp/boarding/timetable/> |
| `tarumizu-ferry` | 2025年2月24日ダイヤ改正の反映状況が未確認 | <https://www.iwasaki-corp.com/t-timetable3/> |
| `maejima-ferry` | 「運航回数および発着時刻変更のお知らせ」（news/98.html）が運賃改定告知より新しい | <https://www.maejima-island.info/> |
| `sunflower-shibushi` | 曜日別4ダイヤの全時刻が未検証（変更情報も無いため据え置き中）。今回の主要航路で唯一裏付けが取れていない | <https://www.ferry-sunflower.co.jp/route/osaka-shibushi/time/> |
| `taiheiyo-ferry` | 全時刻が未検証（公式が PDF 主体で検索要約に出ない） | <https://www.taiheiyo-ferry.co.jp/koro/schedule.html> |
| `hotel-urashima-ferry` | 改修（2026-05-07〜07-24）後のダイヤが現 `timetables` と一致するか未確認 | ホテル浦島公式 |

## B. 運賃の実数値が必要

| 航路 | 内容 | 一次情報 |
| --- | --- | --- |
| `oki-kisen` | **現 YAML の運賃が公式掲載値のちょうど 1.10 倍**。税抜/税込の取り違えか改定前の値の残存。2026年6月1日改定運賃表で税込額を確認するまで書き換え不可 | <https://www.oki-kisen.co.jp/fare/790> |
| `sealine-miyajima` | **2026年9月1日運賃改定が確定済**（残りわずか）。現 fare の 1,450/730/2,300/1,150 は 8月31日で旧運賃になる。新額は YAML の notes に既記載 | <https://setonaikaikisen.co.jp/kouro/highspeedship/> |
| `seto-ikeshima` | fare が「2024年10月1日改定」の1行のみで**実額ゼロ**。瀬戸〜池島 大人500/小人250円、神浦〜池島 470円 が候補。**松島〜瀬戸は不明**（検索で出た280円は別事業者「New松島」の値で流用不可） | 長崎市・西海市の公式 PDF |
| `anei-kohama-ohara` / `anei-ishigaki-kohama` / `-kuroshima` | 2026年4月1日の燃料油価格変動調整金 第4段階引き上げは確定。現 fare が改定後の額かは運賃表 PDF で要確認 | <https://aneikankou.co.jp/files/manager/pdf/price/price20260401.pdf> |
| `tokyo-kyushu-ferry` | 2026年6月1日出航便より**オートバイの運賃区分変更**（750cc以下統合・値上げ）との情報。二次情報のみで公式ドメインでは裏が取れず | <https://tqf.co.jp/fare/> |
| `tokai-kisen-jet-inatori` | fare キーが無い。ただし東海汽船は運賃表を**月別発行**しており固定額の記載自体が不適。実額を入れる場合は適用月を明記すること | <https://www.tokaikisen.co.jp/boarding/fare/> |
| `saiki-onyujima-marinbus` | fare キーが無い。守後150円／久保浦・堀切・片神200円が候補（確信度 medium のため未記載） | <https://www.visit-saiki.jp/spots/detail/9ac23c50-7734-4577-950f-5de0feda6f1b> |
| `meimon-taiyo-cityline` | 燃調が月次改定。運賃額の再取得が必要 | <https://www.cityline.co.jp/fare> |
| `nankai-ferry` | 2025年10月から乗用車が「軽自動車／普通車」2区分に一本化。現 fare に残る 5〜6m/6〜7m/7〜8m の刻みが大型車用として妥当か要確認 | <https://nankai-ferry.co.jp/price/> |
| `boukyomaru-tozando` | 現 fare（大人1,000円/こども500円）が割引運賃で、一般運賃は1,200円/600円との情報。**電話でしか決着しない** | TEL 0598-31-3661 |
| `taiheiyo-ferry` | fare が A期間の2等3行のみ。B/C期間が未記載 | <https://www.taiheiyo-ferry.co.jp/> |

## C. 運航ステータスの確定が必要

| 航路 | 内容 |
| --- | --- |
| `miike-shimabara` | **最優先**。「1年の休止期間内に譲渡先が現れなければ正式廃止」の枠組みで、その1年が**2026年6月末に満了**。2026年に入ってからの動きが一切検出できず、実質廃止済みの可能性。島原市／大牟田市／九州運輸局の告示で確認が必要（廃止なら REFERENCE の規定によりファイル削除） |
| `boukyomaru-tozando` | 「2021年8月〜臨時休業」と、現行の公式・大台町観光協会の「通常運航」案内が**真っ向から矛盾**。問い合わせ先も 0598-31-3661 と 0598-82-1770（エスパール交通）で不一致。電話確認が必要 |
| `anei-kohama-ohara` | 大原⇔小浜直行便が休止中か運航中かが未決着（`NEW2026.6.20-9.30.pdf` の実物確認が必要）。notes の「八重山観光フェリーが継続運航」も裏付けが取れず、記述を緩和済み |
| `blue-ferry-harumi-hinode` | 公式で確認できる運航スケジュールが 2026年3月5日までの公開分のみ。**それ以降の運航有無が不明**。加えて `schedule` に `2026-08-11..2026-08-20` の臨時運休がハードコードされており、8/20 を過ぎると自動的に通常ダイヤ表示に戻る構造的リスクがある。公式は「晴芝Route（晴海⇔日の出・芝浦）」と案内しており**芝浦寄港の有無**も要確認（`stops` に影響） |
| `hotel-urashima-ferry` | 2026年の再開日そのものは特定できていない（休止予定期間の満了と公式の再開告知ページの存在から `suspend` を外した） |
| `keihin-ferry-seabus` | 休止開始日が2026年1月19日で正しいか、再開目標時期の見通し |
| `takashima-hirado` | 平戸市公式 fe03.html の本文が未読。同一覧の他フェリーページは時刻表 PDF を持つため、少数便の定期ダイヤがある可能性が残る |
| `tokai-kisen-jet-inatori` | 稲取発ジェット船の2026年の運航実態（季節運航期間・寄港有無、`suspend` の要否） |
| `kizugawa-tosen` | 2024年3月19日以降に更なる時刻表改正・一部運休が入っていないか（公式に後発の告知ページ `port/page/0000658602`、`0000682432` が存在） |

## D. 「航路ではない」疑いのあるファイル（維持者の判断が必要）

調査の結果、定期客船航路ではなく**桟橋・ターミナルの所在情報**をファイル化したものと
判明した。REFERENCE の趣旨からはファイル削除が筋だが、不可逆な判断のため未実施。

| 航路 | 根拠 |
| --- | --- |
| `sasebo-kouro` | notes 自身が「独立した定期航路ではない」と明記。佐世保市公式では新みなとターミナル／鯨瀬ターミナル／市営相浦桟橋はそれぞれ別の離島航路の発着地で、これらを結ぶ港内連絡船は存在しない。`stops` の4港は佐世保港中心部と相浦（約8km離）を1航路として並べており実在しない運航形態 |
| `hitsushima-tosen` | 櫃島への定期船は**就航した記録が確認できない**（萩海運の定期航路は見島・大島・相島の3島のみ）。`suspend`＝「かつて運航していたものが止まっている」という語義に合わない。時刻表も運賃も無く情報価値が低い |
| `imabari-kouro` | 今治市公式を当たっても今治桟橋〜第3桟橋を結ぶ旅客船・渡船は存在せず、掲載されているのは離島航路のみ |

## E. ID・命名の横断的な修正（他ファイルに影響）

| 対象 | 内容 |
| --- | --- |
| 港ID `gombara` | 厳原港のローマ字が誤り。`izuhara` が正。`iki-tsushima-ferry` / `taishu-kaiun` / `kyushu-yusen-iki` の3航路が参照しているため横断リネームが必要 |
| 航路ID `tsrue-watashi` | `tsurue-watashi` の誤記（route は「鶴江の渡し」、港IDは `tsurue-gawa` と正しい）。他ファイルからの参照はないため単独リネーム可 |
| `name` の不統一 | `sunflower-beppu` / `-oita` / `-shibushi` が `さんふらわあ`、`sunflower-hokkaido` が `商船三井さんふらわあ`。正式社名への統一を推奨 |
| `onomichi-tosen` の `name` | `尾道渡船` は航路の通称で、運航事業者は「おのみち渡し船株式会社」との情報（公式ドメインでの裏取りができず未変更）。最終便時刻も現 YAML「向島発22:25/尾道発22:30」と検索要約「〜22:10」で食い違い |
| `tokai-kisen-jet-inatori` の `ships` | `セブンアイランド愛` が含まれるが、同船は引退済との公式告知がある（<https://www.tokaikisen.co.jp/news/681999/>）。要確認 |
| `tsugaru-kaikyo-ferry-muroran` の `ships` | ブルーグレイス就航（2025-08-08）以降、本航路の通常就航船は同船1隻で、ブルーマーメイドは函館〜青森や他社への代船に回っている。`ships` から外すべきか要確認 |
| `flags` の `ferry` 不統一 | 車両搭載可の幹線でも付与済みは一部のみ（`sunflower-hokkaido` / `-shibushi` / `taiheiyo-ferry` / `tsugaru-kaikyo-ferry-muroran` / `ocean-tokyu-ferry` 等）。全件付与するか方針決定が必要 |

## F. `fare` タグ形式への移行（別タスク推奨）

REFERENCE は `adult::oneway::500円` 形式・1行1価格を定めているが、**`fare` を持つ
424 ファイル中で準拠しているのは 20 ファイル程度**。今回 7 ファイル
（`uraga-watashi` `takashima-hirado` `jinoshima-tosen` `niemonjima-ferry`
`onomichi-tosen` `yakiri-watashi` `hirizo-hama-watashi`）を移行した。

レンジ表記や1行複数価格が特に多いのは `tokai-kisen` `tokai-kisen-hachijo`
`tokyo-kyushu-ferry` `orange-ferry-toyo-osaka` `hankyu-izumiotsu-shinmoji`
`anei-ishigaki-kuroshima` `osakikamijima-ferry` `kokura-maru`
`kasaoka-ferry-daifuku` `maejima-ferry` `tarumizu-ferry` `fukuyama-tosen` など。
運賃額の更新とは独立した大規模マイグレーションなので、別タスクとして切り出すのが妥当。

## G. 期間別・平日休日別ダイヤの構造化（別タスク推奨）

単一 `normal` dia で表現されているが、実際には複数ダイヤを持つ航路。
`timetables` の複数化＋`schedule` 化が本質的な改善になる。

- `jumbo-ferry`（平日/土休日）
- `oki-kisen`（期間別多数）
- `tokai-kisen`（4期間＋GW特別）
- `tokai-kisen-hachijo`（2期間）
- `meimon-taiyo-cityline`（年末年始特別ダイヤが notes 止まり）
- `miyazaki-car-ferry`（繁忙期を `schedule` で表現可能）

## 参考: 調査して「変更なし・現状で最新」と確認できた航路

`chidori-numazu-osezaki`（notes の鮮度が最も高い）、`daiichi-marine`、
`shimanami-kaiun`、`yumba-kisen`、`kanko-kisen-nihonbashi-toyosu`、
`sunflower-hokkaido`（時刻表を公式ドメイン検索で3四半期分一致）、
`silver-ferry`（全8便一致）、`snf-tsuruga-tomakomai`、`snf-niigata-otaru`、
`orange-ferry-toyo-osaka`、`ogasawara-maru`、`mitsu-watashi`、`nagahara-watashi`、
`osakikamijima-ferry`、`kokura-maru`、`kasaoka-ferry-daifuku`、`maejima-ferry`、
`fukuyama-tosen`、`yakiri-watashi`（運賃300円は現 YAML が正しく、
公式観光ページ側の200円が古い）

### 除外した誤情報（記録）

- `snf.jp` の「敦賀発苫小牧東港行き(直行便) 8月1日よりダイヤ改正」は**2020年**の告知。
  2026年の新日本海フェリーの改正は**10月1日のみ**、かつ寄港便が対象
- 中国新聞「しまなみ海運、フェリー航路の廃止届け出」は `shimanami-kaiun`
  （竹原〜大崎下島の**高速船**）ではなく、大崎上島〜大崎下島の**フェリー**の記事。
  混同してファイル削除しないこと
- `seto-ikeshima` の松島〜瀬戸 280円は西海市の市営交通船「New松島」の運賃
- `iki-tsushima-ferry` の「那の津00:05→厳原04:45」は九州郵船（博多〜壱岐〜対馬）
  との混線が濃厚
- 横浜の「シーバス」（横浜駅東口発着・ポートサービス運航）は平常運航中の別事業者。
  `keihin-ferry-seabus`（京浜フェリーボート）とは別航路
