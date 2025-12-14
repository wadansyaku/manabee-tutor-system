import { StudentSchool, AuditLog, User, Lesson, QuestionJob, UserRole } from '../types';
import { MOCK_SCHOOLS, MOCK_LESSON, MOCK_USERS } from '../constants';

const STORAGE_KEY_SCHOOLS = 'manabee_schools_v2';
const STORAGE_KEY_LOGS = 'manabee_logs_v2';
const STORAGE_KEY_LESSONS = 'manabee_lessons_v2';
const STORAGE_KEY_QUESTIONS = 'manabee_questions_v1';
const STORAGE_KEY_USERS = 'manabee_users_v2';

// --- Configuration ---
const APP_MODE: 'local' | 'firebase' =
  (import.meta.env.VITE_APP_MODE as 'local' | 'firebase') || 'local';

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

// --- Firebase Implementation ---
// Note: Firebase operations are async, but we need to maintain sync API for compatibility.
// This uses a cache pattern with async refresh.
import firebaseService, { firebaseLogin, firebaseLogout, isFirebaseConfigured } from './firebaseService';

class FirebaseDataStore implements DataStore {
  private usersCache: LocalUser[] = [];
  private schoolsCache: StudentSchool[] = [];
  private lessonCache: Lesson | null = null;
  private questionsCache: QuestionJob[] = [];
  private logsCache: AuditLog[] = [];
  private isInitialized = false;

  generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  // Async initialization - call this early in app lifecycle
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, falling back behavior may occur');
      return;
    }
    this.isInitialized = true;
  }

  loadUsers(): LocalUser[] {
    // Return cached users; actual loading is async
    return this.usersCache;
  }

  saveUsers(_users: LocalUser[]): void {
    console.warn('saveUsers: Firebase mode uses individual user updates');
  }

  login(email: string, password?: string): { success: boolean, user?: User, error?: string } {
    // Synchronous stub - actual login should use loginAsync
    return { success: false, error: 'Use loginAsync for Firebase mode' };
  }

  async loginAsync(email: string, password?: string): Promise<{ success: boolean, user?: User, error?: string }> {
    if (!password) {
      return { success: false, error: 'パスワードを入力してください' };
    }
    const result = await firebaseLogin(email, password);
    return result;
  }

  changePassword(_userId: string, _newPassword: string): boolean {
    console.warn('changePassword not implemented for Firebase yet');
    return false;
  }

  loadSchools(): StudentSchool[] {
    return this.schoolsCache;
  }

  async loadSchoolsAsync(studentId: string): Promise<StudentSchool[]> {
    this.schoolsCache = await firebaseService.getSchools(studentId);
    return this.schoolsCache;
  }

  saveSchools(schools: StudentSchool[]): void {
    this.schoolsCache = schools;
    // Persist each school
    schools.forEach(school => {
      firebaseService.saveSchool(school).catch(console.error);
    });
  }

  loadLesson(): Lesson {
    return this.lessonCache || MOCK_LESSON;
  }

  async loadLessonAsync(lessonId: string): Promise<Lesson | null> {
    this.lessonCache = await firebaseService.getLesson(lessonId);
    return this.lessonCache;
  }

  saveLesson(lesson: Lesson): void {
    this.lessonCache = lesson;
    firebaseService.saveLesson(lesson).catch(console.error);
  }

  loadQuestions(): QuestionJob[] {
    return this.questionsCache;
  }

  async loadQuestionsAsync(studentId?: string): Promise<QuestionJob[]> {
    this.questionsCache = await firebaseService.getQuestions(studentId);
    return this.questionsCache;
  }

  saveQuestion(question: QuestionJob): void {
    const index = this.questionsCache.findIndex(q => q.id === question.id);
    if (index >= 0) {
      this.questionsCache[index] = question;
    } else {
      this.questionsCache.unshift(question);
    }
    firebaseService.saveQuestion(question).catch(console.error);
  }

  loadLogs(): AuditLog[] {
    return this.logsCache;
  }

  async loadLogsAsync(limit: number = 100): Promise<AuditLog[]> {
    this.logsCache = await firebaseService.getAuditLogs(limit);
    return this.logsCache;
  }

  addLog(user: User, action: string, summary: string): void {
    const newLog: AuditLog = {
      id: this.generateId(),
      at: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      summary
    };
    this.logsCache.unshift(newLog);
    firebaseService.addAuditLog(newLog).catch(console.error);
  }

  exportData(): string {
    return JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      schools: this.schoolsCache,
      logs: this.logsCache,
      lesson: this.lessonCache,
      questions: this.questionsCache,
      note: 'Firebase export - cached data only'
    }, null, 2);
  }

  importData(_jsonStr: string): boolean {
    console.warn('importData not implemented for Firebase mode');
    return false;
  }

  resetData(): void {
    console.warn('resetData not implemented for Firebase mode - clear Firestore manually');
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

// --- Firebase Async Operations (for use in Firebase mode) ---
export const FirebaseAsyncService = {
  isFirebaseMode: () => APP_MODE === 'firebase',
  loginAsync: async (email: string, password?: string) => {
    if (APP_MODE === 'firebase' && currentStore instanceof FirebaseDataStore) {
      return (currentStore as FirebaseDataStore).loginAsync(email, password);
    }
    return StorageService.login(email, password);
  },
  loadSchoolsAsync: async (studentId: string) => {
    if (APP_MODE === 'firebase' && currentStore instanceof FirebaseDataStore) {
      return (currentStore as FirebaseDataStore).loadSchoolsAsync(studentId);
    }
    return StorageService.loadSchools();
  },
  loadLessonAsync: async (lessonId: string) => {
    if (APP_MODE === 'firebase' && currentStore instanceof FirebaseDataStore) {
      return (currentStore as FirebaseDataStore).loadLessonAsync(lessonId);
    }
    return StorageService.loadLesson();
  },
  loadQuestionsAsync: async (studentId?: string) => {
    if (APP_MODE === 'firebase' && currentStore instanceof FirebaseDataStore) {
      return (currentStore as FirebaseDataStore).loadQuestionsAsync(studentId);
    }
    return StorageService.loadQuestions();
  },
  loadLogsAsync: async (limit?: number) => {
    if (APP_MODE === 'firebase' && currentStore instanceof FirebaseDataStore) {
      return (currentStore as FirebaseDataStore).loadLogsAsync(limit);
    }
    return StorageService.loadLogs();
  }
};
