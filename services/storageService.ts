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

// --- Firebase Stub Implementation ---
class FirebaseDataStore implements DataStore {
  generateId(): string { throw new Error("Firebase Not Implemented"); }

  loadUsers(): LocalUser[] { throw new Error("Firebase Not Implemented"); }
  saveUsers(users: LocalUser[]): void { throw new Error("Firebase Not Implemented"); }
  login(email: string, password?: string): { success: boolean, user?: User, error?: string } { throw new Error("Firebase Not Implemented"); }
  changePassword(userId: string, newPassword: string): boolean { throw new Error("Firebase Not Implemented"); }

  loadSchools(): StudentSchool[] { throw new Error("Firebase Not Implemented"); }
  saveSchools(schools: StudentSchool[]): void { throw new Error("Firebase Not Implemented"); }

  loadLesson(): Lesson { throw new Error("Firebase Not Implemented"); }
  saveLesson(lesson: Lesson): void { throw new Error("Firebase Not Implemented"); }

  loadQuestions(): QuestionJob[] { throw new Error("Firebase Not Implemented"); }
  saveQuestion(question: QuestionJob): void { throw new Error("Firebase Not Implemented"); }

  loadLogs(): AuditLog[] { throw new Error("Firebase Not Implemented"); }
  addLog(user: User, action: string, summary: string): void { throw new Error("Firebase Not Implemented"); }

  exportData(): string { throw new Error("Firebase Not Implemented"); }
  importData(jsonStr: string): boolean { throw new Error("Firebase Not Implemented"); }
  resetData(): void { throw new Error("Firebase Not Implemented"); }
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
