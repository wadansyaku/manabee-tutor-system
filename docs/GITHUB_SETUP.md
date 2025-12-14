# ユーザー様が行う必要のある設定

GitHubへのプッシュは成功しました！🎉  
しかし、自動デプロイを有効にするには、以下の設定が必要です。

---

## ⚠️ ユーザー様が行う設定（ブラウザ操作が必要）

以下は私（AI）には実行できないため、ユーザー様にお願いする必要があります。

### Step 1: GitHub Variables の設定

1. ブラウザで開く: https://github.com/wadansyaku/manabee-tutor-system/settings/variables/actions

2. 「New repository variable」をクリック

3. 以下を入力:
   - **Name**: `ENABLE_FIREBASE_DEPLOY`
   - **Value**: `true`

4. 「Add variable」をクリック

---

### Step 2: GitHub Secrets の設定

1. ブラウザで開く: https://github.com/wadansyaku/manabee-tutor-system/settings/secrets/actions

2. 「New repository secret」をクリックして、以下を順に追加:

| Secret Name | 取得方法 |
|-------------|----------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service Accounts → 「Generate new private key」→ ダウンロードしたJSONの中身を貼り付け |
| `FIREBASE_PROJECT_ID` | `gen-lang-client-0061164735` |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey で取得 |
| `VITE_FIREBASE_API_KEY` | .envファイルの値をコピー |
| `VITE_FIREBASE_AUTH_DOMAIN` | .envファイルの値をコピー |
| `VITE_FIREBASE_PROJECT_ID` | .envファイルの値をコピー |
| `VITE_FIREBASE_STORAGE_BUCKET` | .envファイルの値をコピー |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | .envファイルの値をコピー |
| `VITE_FIREBASE_APP_ID` | .envファイルの値をコピー |

---

### Step 3: ワークフローの再実行

1. https://github.com/wadansyaku/manabee-tutor-system/actions を開く

2. 「Deploy to Firebase」ワークフローを選択

3. 「Re-run all jobs」をクリック

---

## 📝 .envファイルの値（参考）

現在の `.env` ファイルにある値:

```
VITE_FIREBASE_API_KEY=AIzaSyBb9Tul5kkPu_-u-8rKeZ9mkqmeveVjvJg
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0061164735.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0061164735
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0061164735.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=520915754646
VITE_FIREBASE_APP_ID=1:520915754646:web:c4e834ab553ab18274ecb7
```

---

## ✅ 設定完了後

設定が完了すると：
- `main` ブランチへの push で自動デプロイ
- PRを作成するとプレビューURL生成
- https://gen-lang-client-0061164735.web.app でアクセス可能

