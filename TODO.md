# 📋 Manabee Development Roadmap

## ✅ 完了済み (2025-12)

### Phase 1: Foundation
- [x] React 19 + TypeScript + Vite セットアップ
- [x] Firebase Auth / Firestore / Storage 統合
- [x] ロール別認証 (Admin/Tutor/Guardian/Student)
- [x] HashRouter ルーティング
- [x] PWA対応（オフライン、インストール）

### Phase 2: Core Features
- [x] 宿題管理システム（HomeworkPage統合）
- [x] 質問ボード（写真アップロード対応）
- [x] 授業録音・文字起こし
- [x] 成績管理・推移グラフ

### Phase 3: AI Integration
- [x] AIアシスタント（チャット + 写真質問統合）
- [x] キャラクター選択（マナビー、はかせ、ともちゃん）
- [x] Cloud Functions経由のGemini API呼び出し

### Phase 4: Gamification
- [x] XPシステム（リアルタイム同期）
- [x] レベルアップ通知
- [x] バッジシステム
- [x] アニメーション演出

### Phase 5: Admin Enhancements
- [x] ユーザー管理
- [x] APIコスト管理ダッシュボード
- [x] アプリ内レポート閲覧
- [x] 監査ログ
- [x] ロール切り替えプレビュー

### Phase 6: Production
- [x] デモアカウント削除
- [x] モックデータ削除
- [x] エラーログサービス
- [x] フィードバック収集機能

---

## 🔜 今後の予定

### 最近の改善 (2025-02)
- [x] 生徒通知センターを全面刷新（データモデル/サービス責務整理、深い導線、既読Undo、カテゴリフィルタ、アクセシビリティ強化、通知タイミング編集）

### 次の改善（PR2/PR3 予定）
- [ ] 宿題・タスク：期限優先の並び替え、進捗＋残日数表示、明確なCTA、フィルタの視覚的状態
- [ ] AI先生/目標/ダッシュボード：空状態のガイド、次アクション提示、意味のない数値の抑制と説明追加
- [ ] 通知データを実データと接続したE2Eカバレッジ強化（設定保存と深いリンク遷移の確認）

### Near Term
- [ ] E2Eテスト拡充
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ改善
- [ ] 多言語対応（英語）

### Future
- [ ] OpenAI API フォールバック
- [ ] 印刷レイアウト（間違いノート）
- [ ] ビデオレッスン録画
- [ ] リアルタイムコラボレーション

---

## 📊 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フロントエンド | React 19, TypeScript, Vite |
| スタイリング | Tailwind CSS (CDN) |
| バックエンド | Firebase (Auth, Firestore, Storage, Functions) |
| AI | Google Gemini 2.5 Flash |
| ホスティング | Firebase Hosting |
| CI/CD | GitHub Actions |

---

## 🔗 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase設定
- [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) - GitHub設定
