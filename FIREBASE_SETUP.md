# Firebase Production Setup Guide

## 概要

Manabee Tutor System の Firebase 本番環境をセットアップするためのガイドです。

---

## ✅ 完了済み

| Item | Status |
|------|--------|
| Firebase Hosting | ✅ Deployed |
| Cloud Functions (4) | ✅ Deployed |
| Firestore Database | ✅ Created |
| Security Rules | ✅ Deployed |
| GitHub main | ✅ Updated |

---

## 🔧 残りのセットアップ

### 1. Gemini API キーの設定

Cloud Functions で AI 機能を使用するには、Gemini API キーを設定する必要があります。

```bash
# Firebase Functions の環境変数として設定
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

### 3. Firestore 初期データ投入

**方法A: Web UI（推奨）**
1. 本番サイトに管理者としてログイン
2. サイドバーの「DB初期化」をクリック
3. 「データベース初期化を実行」ボタンを押す

**方法B: CLI**
```bash
# サービスアカウントキーを取得
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# 保存したファイルを `serviceAccountKey.json` として配置

export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
npx ts-node scripts/seedFirestore.ts
```

---

## 🌐 本番URL

| Service | URL |
|---------|-----|
| **App** | https://gen-lang-client-0061164735.web.app |
| **Console** | https://console.firebase.google.com/project/gen-lang-client-0061164735 |

---

## 📦 デプロイコマンド

```bash
# フロントエンドのみ
npm run build && firebase deploy --only hosting

# Cloud Functions のみ
firebase deploy --only functions

# Firestore Rules のみ
firebase deploy --only firestore:rules

# 全部まとめて
firebase deploy
```

---

## 🔄 GitHub Actions (CI/CD)

`.github/workflows/deploy.yml` が設定済みです。

**必要な GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT`: Firebase サービスアカウント JSON
- `VITE_FIREBASE_API_KEY`: Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Firebase App ID

---

## 🔑 テストログイン情報

ローカル開発環境での初期ログイン情報:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@manabee.com | 1234 |
| Tutor | sensei@manabee.com | 1234 |
| Guardian | mom@manabee.com | 1234 |
| Student | taro@manabee.com | 1234 |

> **Note**: 本番環境では Firebase Authentication を使用するため、別途ユーザー登録が必要です。
