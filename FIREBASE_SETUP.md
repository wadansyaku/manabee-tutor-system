# Firebase Production Setup Guide

## 概要

Manabee Tutor System の Firebase 本番環境をセットアップするためのガイドです。

---

## ✅ 完了済み

| Item | Status |
|------|--------|
| Firebase Hosting | ✅ Deployed |
| Cloud Functions (8) | ✅ Deployed |
| Firestore Database | ✅ Created |
| Firestore Security Rules | ✅ Deployed |
| Storage Security Rules | ✅ Deployed |
| GitHub CI/CD Workflows | ✅ Configured |
| PWA Support | ✅ Enabled |

---

## 🔧 初期セットアップ

### 1. Gemini API キーの設定

Cloud Functions で AI 機能を使用するには、Gemini API キーを設定:

```bash
firebase functions:secrets:set GEMINI_API_KEY
# プロンプトが表示されたら、Google AI Studio で取得したAPIキーを入力
```

**取得方法**: https://aistudio.google.com/apikey

### 2. Firebase Authentication

Firebase Console で認証を有効化:

1. [Firebase Console](https://console.firebase.google.com/project/gen-lang-client-0061164735) にアクセス
2. 「Authentication」→「Sign-in method」
3. 「Email/Password」を有効化
4. 必要に応じて「Google」認証も追加

### 3. GitHub Secrets 設定

GitHubリポジトリの Settings → Secrets and variables → Actions:

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | サービスアカウントJSON |
| `FIREBASE_PROJECT_ID` | `gen-lang-client-0061164735` |
| `GEMINI_API_KEY` | AI機能用APIキー |
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

### 4. GitHub Variables 設定

Settings → Secrets and variables → Actions → Variables:

| Variable Name | Value |
|---------------|-------|
| `ENABLE_FIREBASE_DEPLOY` | `true` |

---

## ☁️ Cloud Functions

| Function | Type | Description |
|----------|------|-------------|
| `generateLessonContent` | Callable | AI授業サマリー生成 |
| `getUsageStats` | Callable | 管理者用API使用統計 |
| `listAllUsers` | Callable | 管理者用ユーザー一覧 |
| `updateUser` | Callable | ユーザー情報更新 |
| `analyzeQuestion` | Trigger | 質問画像のAI分析 |
| `sendNotification` | Callable | FCMプッシュ通知 |
| `registerFcmToken` | Callable | FCMトークン登録 |
| `cleanupRateLimits` | Scheduled | レート制限クリーンアップ |
| `onUserCreated` | Trigger | ユーザープロフィール自動作成 |

---

## 🔄 GitHub Actions CI/CD

### Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | PR, develop push | TypeCheck, Lint, Build, Test |
| `preview.yml` | PR to main | プレビューデプロイ |
| `deploy.yml` | main push | 本番デプロイ |

### 自動デプロイ内容

main ブランチへのプッシュで自動実行:
1. フロントエンドビルド
2. Cloud Functions ビルド & デプロイ
3. Firestore Rules デプロイ
4. Storage Rules デプロイ
5. Hosting デプロイ
6. リリースタグ自動生成

---

## 🌐 本番URL

| Service | URL |
|---------|-----|
| **App** | https://gen-lang-client-0061164735.web.app |
| **Console** | https://console.firebase.google.com/project/gen-lang-client-0061164735 |

---

## 📦 手動デプロイコマンド

```bash
# フロントエンドのみ
npm run build && firebase deploy --only hosting

# Cloud Functions のみ
firebase deploy --only functions

# Firestore Rules のみ
firebase deploy --only firestore:rules

# Storage Rules のみ
firebase deploy --only storage:rules

# 全部まとめて
firebase deploy
```

---

## 🧪 ローカル開発

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm run test

# TypeScript型チェック
npm run typecheck

# Emulator起動
firebase emulators:start
```

### Emulator Ports

| Service | Port |
|---------|------|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Hosting | 5002 |
| Emulator UI | 4000 |

---

## 🔑 認証について

### ローカル開発環境
ローカルモード（`VITE_APP_MODE=local`）では、簡易ログインでテスト可能です。

### 本番環境
Firebase Authentication を使用。新規ユーザーは登録フォームから作成するか、管理者がFirebase Consoleで作成してください。

> **Note**: セキュリティ強化のため、デモアカウントは削除されました。

