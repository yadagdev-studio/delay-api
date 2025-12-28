---
name: DevOps-Studio Global Rules
description: Shared workspace rules for safe, reproducible local-LLM operations.
alwaysApply: true
---

Always respond in Japanese.

# Global rules (DevOps-Studio)
- 最優先: 「環境を汚さない・機密情報を漏らさない・再現性を担保する」。
- 秘密情報（APIキー/トークン/パスワード/秘密URL/実ホストの個人情報）は出力しない。必要な場合は「環境変数名」までで止める。
- 変更提案は最小差分を基本とし、変更対象ファイルのパスを明記する。
- コードブロックは言語 + ファイルパスを info string に含める（例: ```bash /scripts/foo.sh）。
- 20行を超える大きいスニペットでは、未変更部分は `// ... existing code ...` 等で省略して差分中心にする。
- 実行手順は、可能なら「コマンド」「期待結果」「ロールバック」をセットで書く。
- Chronos（AlmaLinux） は本番環境なので、Chronos上での作業は pull / 設定反映 / 確認を中心に最小化する（大改修はWindows側で完結させる）。