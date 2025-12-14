# Implementation Tasks

## 🚧 In Progress (M2)
- [x] Homework List page（期限計算ユーティリティ、宿題トグル、手動追加/削除、監査ログ）
- [x] Homework → Firebase 永続化（Auth/Firestore連携後に移行）※サービス実装完了
- [x] 宿題のリマインド/期限切れ通知（設計）※notificationService.ts実装完了
- [x] main 統合用の小さめPR運用開始（build/lint通過＋TODO更新を必須化）

## ✅ M1: Foundation (This PR)
- [x] **Architecture & Roles**
    - [x] Define Types (Admin, Jobs, Scores)
    - [x] Robust DateUtils (Fix countdown drift, local midnight normalization)
    - [x] App Routing (Login → Role Home)
    - [x] Remove Legacy UI (Old reflections, Private messages)
    - [x] Fix QuickReflection build error
    - [x] Fix Login Logic (Local Auth w/ Password)
    - [x] Add Student View Toggle for Guardians
- [x] **Core Features**
    - [x] Question Board UI (Photo upload stub)
    - [x] Character Reflection UI (Integration in LessonDetail)
    - [x] Firebase Interface Injection (DataStore pattern)
- [x] **Date Display Unification**
    - [x] Add `formatDaysRemaining` helper (期限切れ/今日/明日/あとN日)
    - [x] Apply to Dashboard & SchoolList
- [x] **Documentation**
    - [x] Update PROJECT.md
    - [x] Add .env.example
    - [x] Create next PR roadmap

---

## 🔜 Next PR Roadmap

### PR #2: Firebase Auth Integration ✅
- [x] Firebase project setup
- [x] authContext.tsx (Firebase/Local認証抽象化)
- [x] Email/password sign-in
- [x] Session persistence (onAuthStateChanged)

### PR #3: Firestore Data Layer ✅
- [x] homeworkService.ts実装
- [x] Real-time listeners (準備完了)
- [x] Offline persistence

### PR #4: Cloud Functions for AI ✅
- [x] Move `geminiService` logic to Cloud Functions
- [x] Secure API key handling
- [x] Rate limiting per user

### PR #5: Multi-Student Support ✅
- [x] Guardian → multiple children selector (StudentSelector.tsx)
- [x] Student-specific data isolation
- [x] Dashboard per-child view

### PR #6: Question Flow Complete ✅
- [x] Photo upload to Firebase Storage
- [x] Firestore triggers → AI analysis
- [ ] Tutor review queue (UI enhancement needed)
- [x] Push notifications (FCM)

### PR #7: Exam Score Management ✅
- [x] Score input UI (ExamScoreManager.tsx)
- [x] Subject averages display
- [x] Trend analysis (前回比)

### PR #8: Mobile UX Improvements ✅
- [x] Responsive sidebar (drawer)
- [x] Touch-friendly interactions
- [x] Bottom navigation option

### PR #9: PWA Support ✅
- [x] Service worker (sw.js created)
- [x] manifest.json configured
- [x] Offline mode (background sync implemented)
- [x] Install prompt (InstallPrompt.tsx created)

### PR #10: Admin Dashboard ✅
- [x] API usage monitoring
- [x] Quick action buttons
- [x] System health indicators
- [x] User management links

---

## ⏸️ Deferred (Post-MVP)
- [ ] OpenAI API Fallback option
- [ ] Printing Layout (Mistake Notebook)
- [ ] Video lesson recording
- [ ] AI tutoring chat
