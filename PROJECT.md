# Manabee Project

家庭教師（Tutor）、生徒（Student）、保護者（Guardian）、管理者（Admin）をつなぐ、自律学習支援プラットフォーム。

## Core Philosophy
1.  **Autonomy**: 子供扱いしすぎず、小6（12歳）としての自律を促す。
2.  **Strict Limits**: 1日3問まで、週1の振り返りなど、「使いすぎ」を防ぐ。
3.  **Safety**: クローズドなSNSではなく、保護者が見守れる透明性を確保。
4.  **No Gamification abuse**: 無限スクロール、過剰な通知、煽るランキングは禁止。

## Current Status (M1)
- ✅ TypeScript ビルドエラー 0
- ✅ ローカルモード完全動作（localStorage）
- ✅ ロール別認証フロー（Admin/Tutor/Guardian: パスワード認証、Student: パスワード不要）
- ✅ 初回パスワード変更フロー
- ✅ Guardian→Student 表示切り替え
- ✅ キャラクター振り返り機能（LessonDetailに統合）
- ✅ 期限カウントダウン（ローカル日付基準、今日/明日/あとN日/期限切れ）
- ⏳ Firebase実装（スタブのみ、未接続）

## Architecture
*   **Frontend**: React 19 + TypeScript + Tailwind CSS (CDN)
*   **Backend (Target)**: Firebase (Auth, Firestore, Storage, Functions)
*   **Backend (Current)**: Local Mock Mode (localStorage)
*   **AI**: Gemini 2.5 Flash (via `@google/genai` SDK)
*   **Routing**: react-router-dom v7 (HashRouter)

## Roles & Permissions
| Role | Access | Note |
| :--- | :--- | :--- |
| **Admin** | Full Access, API Keys, Relations | システム全体の管理者 |
| **Tutor** | Lesson Mgmt, Q&A Review, Exam Data | 生徒の学習指導責任者 |
| **Guardian** | Read Only (Reports, Payments), Student View Toggle | 決済と見守り。「生徒として表示」で子どもの画面確認可 |
| **Student** | Tasks, Q&A Request, Reflection | 保護者端末での利用を想定（単独ログイン不要） |

## Key Features
### 写真で質問（Question Board）
1.  Student uploads Photo → localStorage `question_jobs` (status: `queued`)
2.  (Future) Cloud Function triggers → Calls Gemini → Generates Explanation
3.  Tutor reviews & approves → Status `done` → Student notified

### 期限カウントダウン
- `DateUtils.getDaysRemaining`: ローカルミッドナイト基準で日数計算
- `DateUtils.formatDaysRemaining`: 「期限切れ/今日/明日/あとN日」表示

### キャラクター振り返り
- Student: 気分（happy/neutral/tired）+ 理解度 + 120字コメント
- Tutor/Guardian: テンプレート要約を閲覧

## Cost Management
*   AI呼び出しは全て `audit_logs` に記録される。
*   Gemini API Key はクライアントに露出させない（Build環境では `process.env.API_KEY` 経由）。

## Development
```bash
npm install
npm run dev     # Development server
npm run build   # Production build
```

## Environment Variables
See `.env.example` for required environment variables.
