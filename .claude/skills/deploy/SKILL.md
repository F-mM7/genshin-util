---
name: deploy
description: 本リポジトリの GitHub Pages デプロイワークフローを gh CLI で起動する。/deploy と呼ばれたとき、`.github/workflows/deploy.yml` を `gh workflow run` で発火させる。完了の見届けや自動 commit / push は行わない。
disable-model-invocation: true
---

# /deploy

本リポジトリの GitHub Pages デプロイを起動するスキル。

## 前提

- デプロイは `.github/workflows/deploy.yml` で行う。`main` への push で自動デプロイされ、`workflow_dispatch` でも手動起動できる
- 公開対象はリモート `origin/main` の最新コミット。ローカルの未コミット・未 push 変更は反映されない

## 手順

1. デプロイ対象がリモートの現在のコミットである旨を意識する。未コミット変更があってもこのスキルではコミット・push しない。
2. 次のコマンドでワークフローを起動する。

   ```bash
   gh workflow run deploy.yml --ref main
   ```

3. 完了は待たない。直近の実行を1行確認したい場合のみ次を実行する。

   ```bash
   gh run list --workflow=deploy.yml --limit 1
   ```

## やらないこと

- 完了までの `gh run watch`
- 自動 commit / push
- ワークフロー定義の編集
