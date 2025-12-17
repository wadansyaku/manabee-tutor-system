import { StudentSchool, AuditLog, User, Lesson, QuestionJob, UserRole } from '../types';
import { MOCK_SCHOOLS, MOCK_LESSON, MOCK_USERS } from '../constants';

const STORAGE_KEY_SCHOOLS = 'manabee_schools_v2';
const STORAGE_KEY_LOGS = 'manabee_logs_v2';
const STORAGE_KEY_LESSONS = 'manabee_lessons_v2';
const STORAGE_KEY_QUESTIONS = 'manabee_questions_v1';
const STORAGE_KEY_USERS = 'manabee_users_v2';

// --- Configuration ---
const getAppMode = (): 'local' | 'firebase' => {
  try {
    const mode = import.meta.env.VITE_APP_MODE;
    if (mode === 'firebase') return 'firebase';
  } catch { /* ignore */ }
  return 'local';
};
const APP_MODE: 'local' | 'firebase' = getAppMode();

// --- Date Utils (Global) ---
export const DateUtils = {
  getNow: (): Date => new Date(),

  parse: (dateStr: string): Date => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  },

  // Add calendar days to a given date and return ISO string
  addDays: (dateInput: string | Date, days: number): string => {
    const base = new Date(dateInput);
    if (isNaN(base.getTime())) return new Date().toISOString();
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  },

  // Calculate strict calendar days remaining using Local Midnight
  getDaysRemaining: (targetDateStr: string, _isAllDay: boolean, baseDate: Date = new Date()): number => {
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) return -999;

    const current = new Date(baseDate);

    // Normalize to local midnight (00:00:00) to ignore time differences
    const start = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    const diffTime = end.getTime() - start.getTime();
    // Use Math.round to handle potential DST (Daylight Saving Time) shifts safely
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  },

  formatDate: (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
  },

  formatTime: (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--:--';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },

  combineDateTime: (dateInput: string, timeInput: string | undefined): string => {
    if (!timeInput) return `${dateInput}T00:00:00`;
    return `${dateInput}T${timeInput}:00`;
  },

  parseToInputs: (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    };
  },

  // Display helper for deadline countdown
  formatDaysRemaining: (days: number): string => {
    if (days < 0) return '期限切れ';
    if (days === 0) return '今日';
    if (days === 1) return '明日';
    return `あと${days}日`;
  }
};

interface LocalUser extends User {
  password?: string;
}

// --- DataStore Interface ---
interface DataStore {
  generateId(): string;

  // Users
  loadUsers(): LocalUser[];
  saveUsers(users: LocalUser[]): void;
  login(email: string, password?: string): { success: boolean, user?: User, error?: string };
  changePassword(userId: string, newPassword: string): boolean;

  // Schools
  loadSchools(): StudentSchool[];
  saveSchools(schools: StudentSchool[]): void;

  // Lesson
  loadLesson(): Lesson;
  saveLesson(lesson: Lesson): void;

  // Questions
  loadQuestions(): QuestionJob[];
  saveQuestion(question: QuestionJob): void;

  // Logs
  loadLogs(): AuditLog[];
  addLog(user: User, action: string, summary: string): void;

  // Backup
  exportData(): string;
  importData(jsonStr: string): boolean;
  resetData(): void;
}

// --- Local Implementation ---
class LocalDataStore implements DataStore {
  generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  loadUsers(): LocalUser[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) return JSON.parse(stored);
      const initialUsers: LocalUser[] = MOCK_USERS.map(u => ({ ...u, password: '123', isInitialPassword: true }));
      initialUsers.push({ id: 'admin1', name: '管理者', role: UserRole.ADMIN, email: 'admin@manabee.com', password: '123', isInitialPassword: true });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers));
      return initialUsers;
    } catch { return []; }
  }

  saveUsers(users: LocalUser[]): void {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  login(email: string, password?: string): { success: boolean, user?: User, error?: string } {
    const users = this.loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, error: 'ユーザーが見つかりません' };
    if (user.role === UserRole.STUDENT) {
      const { password: _, ...safeUser } = user;
      return { success: true, user: safeUser };
    }
    if (!password) return { success: false, error: 'パスワードを入力してください' };
    if (user.password !== password) return { success: false, error: 'パスワードが違います' };
    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  changePassword(userId: string, newPassword: string): boolean {
    const users = this.loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], password: newPassword, isInitialPassword: false };
    this.saveUsers(users);
    return true;
  }

  loadSchools(): StudentSchool[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SCHOOLS);
      return stored ? JSON.parse(stored) : MOCK_SCHOOLS;
    } catch { return MOCK_SCHOOLS; }
  }

  saveSchools(schools: StudentSchool[]): void {
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
  }

  loadLesson(): Lesson {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LESSONS);
      return stored ? JSON.parse(stored) : MOCK_LESSON;
    } catch { return MOCK_LESSON; }
  }

  saveLesson(lesson: Lesson): void {
    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(lesson));
  }

  loadQuestions(): QuestionJob[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  saveQuestion(question: QuestionJob): void {
    const questions = this.loadQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    let newQuestions = index >= 0
      ? questions.map(q => q.id === question.id ? question : q)
      : [question, ...questions];
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(newQuestions));
  }

  loadLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  addLog(user: User, action: string, summary: string): void {
    const logs = this.loadLogs();
    const newLog: AuditLog = {
      id: this.generateId(),
      at: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      summary
    };
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  }

  exportData(): string {
    return JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      schools: this.loadSchools(),
      logs: this.loadLogs(),
      lesson: this.loadLesson(),
      questions: this.loadQuestions(),
      users: this.loadUsers()
    }, null, 2);
  }

  importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.schools) localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(data.schools));
      if (data.logs) localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(data.logs));
      if (data.lesson) localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(data.lesson));
      if (data.questions) localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(data.questions));
      return true;
    } catch (e) { console.error(e); return false; }
  }

  resetData(): void {
    localStorage.clear();
    window.location.reload();
  }
}

// --- Firebase Implementation with Local Cache ---
// Uses localStorage as cache, syncs with Firestore in background
// This allows the sync API to work while Firebase ops are async
// --- Firebase Implementation with Local Cache ---
// Uses localStorage as cache, syncs with Firestore in background
class FirebaseDataStore implements DataStore {
  private cache = {
    users: null as LocalUser[] | null,
    schools: null as StudentSchool[] | null,
    lesson: null as Lesson | null,
    questions: null as QuestionJob[] | null,
    logs: null as AuditLog[] | null,
  };

  private localStore = new LocalDataStore(); // Fallback to local for caching

  constructor() {
    // Initialize cache from localStorage
    this.cache.users = this.localStore.loadUsers();
    this.cache.schools = this.localStore.loadSchools();
    this.cache.lesson = this.localStore.loadLesson();
    this.cache.questions = this.localStore.loadQuestions();
    this.cache.logs = this.localStore.loadLogs();

    // Listen for auth changes to trigger sync
    this.initAuthListener();
  }

  private async initAuthListener() {
    try {
      const firebaseService = await import('./firebaseService');
      if (!firebaseService.isFirebaseConfigured()) return;

      firebaseService.onAuthChange(async (user) => {
        if (user) {
          console.log('[Firebase] User authenticated, syncing data...');
          // Get full user profile
          const profile = await firebaseService.getUser(user.uid);
          if (profile) {
            await this.syncUserData(profile);
          }
        } else {
          console.log('[Firebase] User signed out');
          // Optional: clear cache on logout? For now, keep it for offline viewing
        }
      });
    } catch (e) {
      console.warn('[Firebase] Auth listener failed', e);
    }
  }

  private async syncUserData(user: User) {
    if (user.role === UserRole.STUDENT) {
      await this.syncStudentData(user.id);
    } else if (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) {
      // For guardians/tutors, we might want to sync all associated students
      // For MVP, we'll brute force sync known mock IDs or implement a real relation later
      // Currently just syncing 's1' and 's2' as a fallback if no specific logic exists
      await this.syncStudentData('s1');
      await this.syncStudentData('s2');
    }

    // Sync global/shared data
    await this.syncSharedData();

    // Notify app that data is fresh
    window.dispatchEvent(new CustomEvent('manabee-data-synced'));
  }

  private async syncStudentData(studentId: string) {
    try {
      const firebaseService = await import('./firebaseService');

      // Sync schools
      const schools = await firebaseService.firestoreOperations.getSchools(studentId);
      if (schools.length > 0) {
        // Merge with existing cache to avoid overwriting other students' data
        const currentSchools = this.cache.schools || [];
        const otherSchools = currentSchools.filter(s => s.studentId !== studentId);
        const newSchools = [...otherSchools, ...schools];
        this.cache.schools = newSchools;
        localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(newSchools));
      }

      // Sync questions
      const questions = await firebaseService.firestoreOperations.getQuestions(studentId);
      if (questions.length > 0) {
        const currentQuestions = this.cache.questions || [];
        const otherQuestions = currentQuestions.filter(q => q.studentId !== studentId);
        const newQuestions = [...otherQuestions, ...questions];
        this.cache.questions = newQuestions;
        localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(newQuestions));
      }

    } catch (err) {
      console.warn(`[Firebase] Sync failed for student ${studentId}:`, err);
    }
  }

  private async syncSharedData() {
    try {
      const firebaseService = await import('./firebaseService');

      // Sync lesson (Global for MVP? Or per student?)
      // Assuming 'l1' is the main lesson for now
      const lesson = await firebaseService.firestoreOperations.getLesson('l1');
      if (lesson) {
        this.cache.lesson = lesson;
        localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(lesson));
      }

      // Sync logs
      const logs = await firebaseService.firestoreOperations.getAuditLogs(100);
      if (logs.length > 0) {
        this.cache.logs = logs;
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      }
    } catch (err) {
      console.warn('[Firebase] Shared data sync failed:', err);
    }
  }


  generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  // Users
  loadUsers(): LocalUser[] {
    return this.cache.users || this.localStore.loadUsers();
  }

  saveUsers(users: LocalUser[]): void {
    this.cache.users = users;
    this.localStore.saveUsers(users);
  }

  // LOGIN: Now uses Real Firebase Auth
  login(email: string, password?: string): { success: boolean, user?: User, error?: string } {
    // NOTE: This synchronous method cannot await Firebase Auth.
    // In App.tsx, we have a specific handling for Firebase mode that calls firebaseService directly.
    // This method is kept for interface compatibility and Local mode fallback.
    return this.localStore.login(email, password);
  }

  // CHANGE PASSWORD: Real Firebase Auth handled elsewhere, this is for local state
  changePassword(userId: string, newPassword: string): boolean {
    const result = this.localStore.changePassword(userId, newPassword);
    this.cache.users = this.localStore.loadUsers();
    return result;
  }

  // Schools
  loadSchools(): StudentSchool[] {
    return this.cache.schools || this.localStore.loadSchools();
  }

  saveSchools(schools: StudentSchool[]): void {
    this.cache.schools = schools;
    this.localStore.saveSchools(schools);

    // Async sync to Firestore
    this.syncSchoolsToFirestore(schools).catch(console.error);
  }

  private async syncSchoolsToFirestore(schools: StudentSchool[]) {
    try {
      const firebaseService = await import('./firebaseService');
      if (!firebaseService.isFirebaseConfigured()) return;

      for (const school of schools) {
        await firebaseService.firestoreOperations.saveSchool(school);
      }
      console.log('[Firebase] Schools synced to Firestore');
    } catch (err) {
      console.warn('[Firebase] School sync failed:', err);
    }
  }

  // Lesson
  loadLesson(): Lesson {
    return this.cache.lesson || this.localStore.loadLesson();
  }

  saveLesson(lesson: Lesson): void {
    this.cache.lesson = lesson;
    this.localStore.saveLesson(lesson);

    // Async sync to Firestore
    this.syncLessonToFirestore(lesson).catch(console.error);
  }

  private async syncLessonToFirestore(lesson: Lesson) {
    try {
      const firebaseService = await import('./firebaseService');
      if (!firebaseService.isFirebaseConfigured()) return;

      await firebaseService.firestoreOperations.saveLesson(lesson);
      console.log('[Firebase] Lesson synced to Firestore');
    } catch (err) {
      console.warn('[Firebase] Lesson sync failed:', err);
    }
  }

  // Questions
  loadQuestions(): QuestionJob[] {
    return this.cache.questions || this.localStore.loadQuestions();
  }

  saveQuestion(question: QuestionJob): void {
    const questions = this.loadQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    const updated = index >= 0
      ? questions.map(q => q.id === question.id ? question : q)
      : [question, ...questions];

    this.cache.questions = updated;
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(updated));

    // Async sync to Firestore
    this.syncQuestionToFirestore(question).catch(console.error);
  }

  private async syncQuestionToFirestore(question: QuestionJob) {
    try {
      const firebaseService = await import('./firebaseService');
      if (!firebaseService.isFirebaseConfigured()) return;

      await firebaseService.firestoreOperations.saveQuestion(question);
      console.log('[Firebase] Question synced to Firestore');
    } catch (err) {
      console.warn('[Firebase] Question sync failed:', err);
    }
  }

  // Logs
  loadLogs(): AuditLog[] {
    return this.cache.logs || this.localStore.loadLogs();
  }

  addLog(user: User, action: string, summary: string): void {
    const log: AuditLog = {
      id: this.generateId(),
      at: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      summary
    };

    const logs = this.loadLogs();
    const updated = [log, ...logs].slice(0, 100);
    this.cache.logs = updated;
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));

    // Async sync to Firestore
    this.syncLogToFirestore(log).catch(console.error);
  }

  private async syncLogToFirestore(log: AuditLog) {
    try {
      const firebaseService = await import('./firebaseService');
      if (!firebaseService.isFirebaseConfigured()) return;

      await firebaseService.firestoreOperations.addAuditLog(log);
    } catch (err) {
      console.warn('[Firebase] Log sync failed:', err);
    }
  }

  // Backup operations
  exportData(): string {
    return JSON.stringify({
      version: 2,
      mode: 'firebase',
      exportedAt: new Date().toISOString(),
      schools: this.loadSchools(),
      logs: this.loadLogs(),
      lesson: this.loadLesson(),
      questions: this.loadQuestions(),
      users: this.loadUsers()
    }, null, 2);
  }

  importData(jsonStr: string): boolean {
    return this.localStore.importData(jsonStr);
  }

  resetData(): void {
    localStorage.clear();
    window.location.reload();
  }
}

// --- Injection Logic ---
const currentStore: DataStore = APP_MODE === 'local' ? new LocalDataStore() : new FirebaseDataStore();

// --- Export Wrapper (Maintains existing API) ---
export const StorageService = {
  generateId: () => currentStore.generateId(),

  loadUsers: () => currentStore.loadUsers(),
  saveUsers: (users: LocalUser[]) => currentStore.saveUsers(users),
  login: (email: string, password?: string) => currentStore.login(email, password),
  changePassword: (uid: string, pw: string) => currentStore.changePassword(uid, pw),

  loadSchools: () => currentStore.loadSchools(),
  saveSchools: (schools: StudentSchool[]) => currentStore.saveSchools(schools),

  loadLesson: () => currentStore.loadLesson(),
  saveLesson: (lesson: Lesson) => currentStore.saveLesson(lesson),

  loadQuestions: () => currentStore.loadQuestions(),
  saveQuestion: (q: QuestionJob) => currentStore.saveQuestion(q),

  loadLogs: () => currentStore.loadLogs(),
  addLog: (u: User, a: string, s: string) => currentStore.addLog(u, a, s),

  exportData: () => currentStore.exportData(),
  importData: (json: string) => currentStore.importData(json),
  resetData: () => currentStore.resetData()
};
