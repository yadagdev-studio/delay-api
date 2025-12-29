# Design Note: deploy.yml smoke-test を現状運用に整合させる

- Date: 2025-12-29
- Repo: delay-api
- Change type: CI/CD（smoke-testの到達先修正）
- Risk: Low（URL/到達方式の変更のみ。ロールバック容易）

## 背景 / 問題
- 現在の `.github/workflows/deploy.yml` の smoke-test が `http://localhost:8081/...` を参照している。
- しかし現状:
  - delay-api は 8081 を使用していない
  - Chronos でも 8081 を Listen していない
  - HTTP は HTTPS にリダイレクトする運用
  - 公開パス `/delay-api/*` は Basic 認証等により 401 になり得る
- その結果、デプロイ自体は成功しても smoke-test が誤って失敗する。

## 目的
- “現状の運用ポリシー” で成立する smoke-test に修正し、デプロイの判定を正しくする。
- Chronos（本番ホスト）を汚さず、再現性の高い到達確認を行う。

## 何を保証するか（合否条件）
### 必須（smoke-testの合否）
- `devops-proxy -> delay-api` の到達性が成立していること。
- 具体的には、devops-edge ネットワーク上から `http://devops-proxy/_internal/upstream/delay-api` が成功すること。

### 任意（合否にしない）
- 公開パス `http(s)://<public>/delay-api/healthz` が 401 になる等の認証ポリシーは変化し得るため、
  「確認はするがデプロイ失敗の条件にはしない」扱いにする。

## 実装方針
- `localhost:8081` 参照を廃止し、`docker run --network devops-edge curlimages/curl` を用いて
  devops-edge 内から devops-proxy を叩く。
- 失敗時は原因追跡のために:
  - devops-proxy 経由の verbose 出力
  - delay-api 直叩き（delay-api:3101/healthz）の verbose 出力
  - `docker compose logs`（tail）を出す

## 受け入れ基準
- main への push 後の deploy workflow で smoke-test が成功する
- 失敗時にログだけで原因（proxy到達/上流/コンテナ起動）を切り分けられる
- 変更範囲は `.github/workflows/deploy.yml` に限定される（機能コードは触らない）

## ロールバック
- この変更を含むPRを revert し、再デプロイする
