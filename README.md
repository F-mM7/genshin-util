# 原神ユーティリティ

Excel で管理していた原神まわりの計算をブラウザで使えるようにしたツール集です。

公開URL: **https://F-mM7.github.io/genshin-util/**

## できること

3 つの機能を切り替えて使えます。入力値はブラウザの localStorage に自動保存されるので、次回開いたときも続きから使えます。

### 樹脂キャパ（`/resin`）

「次に原神を開く時刻」までに樹脂がどれだけ回復し、保有上限（200）からどれだけあふれるかを計算します。

- 入力: アクセス予定日時／現在樹脂／濃縮樹脂／消費予定
- 「次の 5 時」「次の水曜 5 時」などのワンクリックプリセット
- 結果: 残り時間、回復量、キャパ余裕、あふれ、可処分樹脂

### 天賦素材（`/talent`）

複数キャラ分の「天賦現在 Lv → 目標 Lv」に必要な ★2 / ★3 / ★4 天賦本の総数と、所持数との差分を計算します。

- 行の追加・削除でキャラ数を可変
- 余った下位素材を上位に繰り上げる 3 シナリオを併記
  - 最低（×1 繰上）
  - 最高（×2 繰上、週ボスドロップ想定）
  - 期待値（×1.1 倍）

### 武器突破素材（`/weapon`）

★2 〜 ★5 の武器突破素材について、必要数と所持数から余りを計算します。

- 「通常（×1 繰上）」と「ベドさん（×2 繰上）」の 2 シナリオを比較
- ベドさん側はラベル・倍率係数をカスタマイズ可能

## 技術スタック

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/) (HashRouter)
- ホスティング: GitHub Pages（GitHub Actions でビルド・デプロイ）

## ローカル開発

```bash
cd app
npm install
npm run dev      # 開発サーバ (http://localhost:5173/)
npm run build    # 本番ビルド (app/dist/)
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint
```

## デプロイ

`main` ブランチへの push をトリガに、`.github/workflows/deploy.yml` が自動でビルドして GitHub Pages に公開します。手動実行は GitHub の Actions タブから `Deploy to GitHub Pages` ワークフローを `Run workflow` で起動できます。
