# レビュー結果

#### 必須
- **バリデーションの確認**  
  ✓ 400が発生するケースがDesign Note通り（未指定/空/非数値/負数/30,000超）  
  ✓ 30,000上限と`ms=0`許可のロジックが実装済み  
  ✗ **テスト不足**  
  - `ms=0`の検証ケースがない（0は許可範囲だがテスト未実施）  
  - 小数（例: `12.3`）の検証が不足（`Number.isInteger`チェックありながらテスト未実施）  
  *→ 必須のテストカバレッジ不足（Design Noteの受入れ基準で「400系を網羅する」が不十分）*

- **ヘッダ追加の確認**  
  ✓ `X-Delay-MS`が正常系で確実に付与される（200レスポンス時のヘッダ）  
  ✓ 既存レスポンス形式を破壊せず（`delayedMs`と`now`フィールド維持）

- **/healthzへの影響**  
  ✓ 未変更（実装/テストから確認済み）

#### 推奨
- **テストの強化**  
  → `ms=0`を含む**2つの追加テストを実装**  
  ```ts
  it('GET /delay with ms=0 returns 200 and 0 in X-Delay-MS', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=0`);
    expect(res.headers.get('X-Delay-MS')).toBe('0');
  });
  it('GET /delay with non-integer ms (12.3) returns 400', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/delay?ms=12.3`);
    expect(res.status).toBe(400);
  });
  ```  
  （※現行テストでは12.3のケースが未テスト）

- **エラーメッセージの明示性**  
  ✗ 400時のメッセージが`"bad request"`のみで原因不明  
  → 推奨: `error: "Invalid value for ms"` などの具体的な理由を含める

#### 好み
- なし

---

### マージ可否  
**NG**  
*必須のテストカバレッジが不足（`ms=0`/非整数の検証が未実施）。PRの受け入れ基準を完全に満たしていないためマージ不可。*

## Review: delay-validate-ms-and-header

 指摘

 - 必須
   - テストで /delay?ms=-1 のケースが実装されていない。設計書で定義されている "負の数"
 への400応答の検証が不足しています。

 - 推奨
   - /delay?ms=30000 のような最大値での200応答を検証するテストを追加すること。

 - 好み
   - 400応答時のエラーメッセージを "Invalid ms value" に簡潔化すること（現状のメッセージ "must be integer between 0
 and 30000" は情報量が多い）。

 マージ可否
 NG