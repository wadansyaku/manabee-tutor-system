<div align="center">
<img width="120" height="120" alt="Manabee Logo" src="public/icon-192.png" />
<h1>🐝 Manabee Tutor System</h1>
<p><strong>自律学習支援プラットフォーム</strong></p>
<p>家庭教師・生徒・保護者・管理者をつなぐ統合学習管理システム</p>

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## ✨ 特徴

- 🎮 **ゲーミフィケーション** - XP・レベル・バッジでモチベーションUP
- 🤖 **AIアシスタント** - 写真で質問、キャラクターとチャット学習
- 📊 **リアルタイム同期** - Firebase Firestoreで即座にデータ反映
- 📱 **PWA対応** - オフラインでも動作、インストール可能
- 👥 **マルチロール** - 生徒・保護者・講師・管理者の4つのロール
- 📈 **学習分析** - 成績推移、学習時間、宿題完了率をグラフ表示

---

## 🚀 クイックスタート

### 必要条件
- Node.js 22.23.4 (see `.nvmrc` and `.node-version`)
- npm または yarn


### ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:5173 を開く

### 本番ビルド

```bash
npm run build
```

---

## 🔧 環境変数

`.env` ファイルを作成:

```env
VITE_APP_MODE=firebase

# Firebase設定
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI機能
VITE_GEMINI_API_KEY=your_gemini_api_key
```

詳細は [.env.example](.env.example) を参照

---

## 📁 プロジェクト構成

```
├── components/           # Reactコンポーネント
│   ├── admin/           # 管理者用
│   ├── student/         # 生徒用
│   ├── tutor/           # 講師用
│   ├── guardian/        # 保護者用
│   ├── common/          # 共通コンポーネント
│   └── ui/              # UIプリミティブ
├── services/            # ビジネスロジック
│   ├── firebaseService.ts
│   ├── gamificationService.ts
│   ├── notificationService.ts
│   └── ...
├── functions/           # Cloud Functions
├── docs/                # ドキュメント
└── tests/               # テストファイル
```

---

## 👥 ロールと権限

| ロール | アクセス範囲 |
|--------|-------------|
| **管理者** | システム全体、API設定、ユーザー管理 |
| **講師** | 授業管理、質問レビュー、レポート作成 |
| **保護者** | レポート閲覧、子供の学習状況確認 |
| **生徒** | 宿題、AIアシスタント、学習記録 |

---

## 📚 ドキュメント

- [Firebase設定ガイド](./FIREBASE_SETUP.md)
- [GitHub Actions設定](./docs/GITHUB_SETUP.md)
- [カスタムドメイン設定](./docs/CUSTOM_DOMAIN.md)

---

## 🌐 本番環境

| サービス | URL |
|----------|-----|
| **Webアプリ** | https://gen-lang-client-0061164735.web.app |
| **Firebase Console** | [Console](https://console.firebase.google.com/project/gen-lang-client-0061164735) |

---

## 📝 ライセンス

Private - All rights reserved

---

<div align="center">
<p>Made with 💛 for better education</p>
</div>
