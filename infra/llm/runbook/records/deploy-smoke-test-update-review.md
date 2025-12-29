<!-- Review: deploy-smoke-test changed -->

## 変更点
- devops‑proxy での 401 チェックを別ステップに切り出し
- `continue-on-error: true` を追加して認証ポリシー失敗でデプロイを止めないように

## 検証項目
- devops‑proxy への到達性は保たれているか
- 8081 / localhost の依存は残っていないか
- 401 チェックが optional になっているか
- debug 情報は秘密漏れなく十分か
- workflow 以外は変更されていないか

## コメント
- 必須: 合否条件は devops‑proxy → delay‑api 到達性に合わせてリトライ実装されている。
- 必須: 8081 / localhost は全て取り除かれている。
- 推奨: `continue-on-error` は適切に設定されており、ポリシー変更でデプロイが止まらない。
- 推奨: debug 情報は <details> タグで囲み、秘密漏れはない。
- 推奨: 変更範囲は workflow に限定されている。

## マージ可否
**OK**
