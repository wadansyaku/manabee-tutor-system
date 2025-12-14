# Implementation Tasks

## 🚧 In Progress (M2)
- [x] Homework List page（期限計算ユーティリティ、宿題トグル、手動追加/削除、監査ログ）
- [x] User Relation Management（Guardian→children、Tutor→students紐付け）
- [x] Multi-Student Support（Guardian/Tutor用の生徒切替セレクタ）
- [x] Homework Notifications（期限切れ/当日のトースト通知）
- [ ] Homework → Firebase 永続化（Auth/Firestore連携後に移行）
- [ ] 宿題のリマインド/期限切れ通知（設計）
- [ ] main 統合用の小さめPR運用開始（build/lint通過＋TODO更新を必須化）

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

### PR #2: Firebase Auth Integration
- [x] Firebase project setup
- [x] Firestore security rules deployed
- [x] Database Seeder component created
- [x] AuthService with dual-mode support (local/Firebase)
- [x] Email/password sign-in
- [x] Session persistence (Firebase auth state listener)

### PR #3: Firestore Data Layer
- [x] Firestore CRUD stubs in firebaseService.ts
- [x] getAllUsers & getUserByEmail added
- [ ] Real-time listeners (partial - auth only)
- [ ] Offline persistence

### PR #4: Cloud Functions for AI
- [ ] Move `geminiService` logic to Cloud Functions
- [ ] Secure API key handling
- [ ] Rate limiting per user

### PR #5: Multi-Student Support
- [ ] Guardian → multiple children selector
- [ ] Student-specific data isolation
- [ ] Dashboard per-child view

### PR #6: Question Flow Complete
- [ ] Photo upload to Firebase Storage
- [ ] Firestore triggers → AI analysis
- [ ] Tutor review queue
- [ ] Push notifications (FCM)

### PR #7: Exam Score Management
- [x] Score input UI
- [x] Graph/chart visualization
- [ ] Trend analysis

### PR #8: Mobile UX Improvements
- [ ] Responsive sidebar (drawer)
- [ ] Touch-friendly interactions
- [ ] Bottom navigation option

### PR #9: PWA Support
- [ ] Service worker
- [ ] Offline mode
- [ ] Install prompt

### PR #10: Admin Dashboard
- [ ] API usage monitoring
- [ ] Billing overview
- [ ] User management

---

## ⏸️ Deferred (Post-MVP)
- [ ] OpenAI API Fallback option
- [ ] Printing Layout (Mistake Notebook)
- [ ] Video lesson recording
- [ ] AI tutoring chat
