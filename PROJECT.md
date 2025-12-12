# Manabee Project

家庭教師（Tutor）、生徒（Student）、保護者（Guardian）、管理者（Admin）をつなぐ、自律学習支援プラットフォーム。

## Core Philosophy
1.  **Autonomy**: 子供扱いしすぎず、小6（12歳）としての自律を促す。
2.  **Strict Limits**: 1日3問まで、週1の振り返りなど、「使いすぎ」を防ぐ。
3.  **Safety**: クローズドなSNSではなく、保護者が見守れる透明性を確保。
4.  **No Gamification abuse**: 無限スクロール、過剰な通知、煽るランキングは禁止。

## Architecture
*   **Frontend**: React 19 + TypeScript + Tailwind CSS
*   **Backend (Target)**: Firebase (Auth, Firestore, Storage, Functions)
*   **Backend (Current)**: Local Mock Mode (localStorage mimicry)
*   **AI**: Gemini 2.5/3.0 (via Cloud Functions architecture)

## Roles & Permissions
| Role | Access | Note |
| :--- | :--- | :--- |
| **Admin** | Full Access, API Keys, Relations | システム全体の管理者 |
| **Tutor** | Lesson Mgmt, Q&A Review, Exam Data | 生徒の学習指導責任者 |
| **Guardian** | Read Only (Reports, Payments) | 決済と見守り。学習には介入しない |
| **Student** | Tasks, Q&A Request, Reflection | 保護者端末での利用を想定 |

## Data Flow (Photo Question)
1.  Student uploads Photo -> Firestore `question_jobs` (status: `queued`)
2.  Cloud Function triggers -> Calls Gemini 3 Pro -> Generates Explanation & Quiz
3.  Self-Correction Loop -> AI verifies its own answer
4.  Status updates to `needs_review`
5.  Tutor reviews & approves -> Status `done` -> Student notified

## Cost Management
*   AI呼び出しは全て `audit_logs` と `api_usage` に記録される。
*   Gemini API Key はクライアントに露出させない（Build環境ではMockService経由）。
