// User Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  TUTOR = 'TUTOR',
  STUDENT = 'STUDENT',
  GUARDIAN = 'GUARDIAN'
}

// User Profile
export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  isInitialPassword?: boolean; // Forcing password change

  // Gamification (for students)
  xp?: number;
  level?: number;
  streak?: number;
  badges?: string[];
  lastActiveAt?: string; // ISO Date for streak calculation

  // Relationships
  linkedStudentIds?: string[];  // For guardians: their children
  tutorId?: string;             // For students: assigned tutor
  guardianIds?: string[];       // For students: their guardians

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// --- AI Job & Question Types ---

export type JobStatus = 'queued' | 'processing' | 'needs_review' | 'done' | 'error';

export interface QuestionJob {
  id: string;
  studentId: string;
  subject: string;
  createdAt: string; // ISO Date

  // Images (Base64 or URL)
  questionImageUrl: string;
  answerImageUrl?: string;

  // AI & Review
  status: JobStatus;
  aiExplanation?: string;
  tutorComment?: string;

  // Interaction
  studentUnderstanding?: 'good' | 'bad'; // "わかった" check
}

// --- Exam Data Types ---

export interface ExamScore {
  id: string;
  studentId: string;
  schoolId: string;
  year: number;
  examType: string; // e.g. "第1回"
  subjectScores: Record<string, number>; // { "算数": 80, "国語": 60 }
  totalScore: number;
  passScore?: number; // 合格最低点
  averageScore?: number; // 受験者平均
  status: 'verified' | 'draft';
}

// --- Existing Types Below ---

// AI JSON Schemas
export interface SummaryJson {
  lesson_goal: string;
  what_we_did: string[];
  what_went_well: string[];
  issues: string[];
  next_actions: string[];
  parent_message: string;
  quiz_focus: string[];
}

export interface HomeworkItem {
  id?: string;
  title: string;
  due_days_from_now: number;
  type: 'practice' | 'review' | 'challenge';
  estimated_minutes: number;
  isCompleted?: boolean;
  // Optional metadata to support scheduling and history
  dueDate?: string;
  assignedAt?: string;
  completedAt?: string;
}

export interface HomeworkJson {
  items: HomeworkItem[];
}

export interface QuizQuestion {
  type: 'mcq' | 'short';
  q: string;
  choices?: string[];
  answer: string;
  explain: string;
}

export interface QuizJson {
  questions: QuizQuestion[];
}

// Structured Reflections (New: Character based)
export interface ReflectionInputs {
  mood: 'happy' | 'neutral' | 'tired';
  understanding: 'perfect' | 'good' | 'hard';
  comment: string;
}

export interface CharacterReflection {
  characterId: string; // 'cat_sensei' etc.
  inputs: ReflectionInputs;
  summaryForTutor: string; // Template generated summary
  updatedAt: string;
  isSubmitted: boolean;
}

// Lesson Data Model
export interface Lesson {
  id: string;
  studentId: string;
  scheduledAt: string; // ISO Date
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  hourlyRate: number;

  // Audio & Transcript
  audioUrl?: string;
  transcript: string;

  // AI Generated Content
  aiSummary?: SummaryJson;
  aiHomework?: HomeworkJson;
  aiQuiz?: QuizJson;

  // New Reflection
  characterReflection?: CharacterReflection;

  // Legacy (Removed for P0, keep optional for compatibility if needed)
  reflections?: any;
  quickReflection?: any;
  privateStudentMessage?: any;
  tutorPublicReply?: any;

  // Tags
  tags: string[];
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  targetSchool: string;
  subjects: string[];
  notes: string;
}

// School Management Types
export type SchoolEventType = 'application_start' | 'application_end' | 'exam' | 'result' | 'procedure' | 'other';

export interface SchoolEvent {
  id: string;
  type: SchoolEventType;
  title: string;
  date: string; // ISO Date
  isAllDay: boolean;
  isCompleted?: boolean;
  note?: string;
  sourceUrl?: string;
}

export interface StudentSchool {
  id: string;
  studentId: string;
  name: string;
  priority: number;
  status: 'considering' | 'applied' | 'done';
  subjects: string[];
  events: SchoolEvent[];
  memo: string;
  sourceUrl?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  at: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  summary: string;
}

// ===== NEW TYPES FOR PRODUCTION =====

// Attendance (勤怠管理)
export type AttendanceStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Attendance {
  id: string;
  lessonId: string;
  tutorId: string;
  studentId: string;
  date: string; // ISO Date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  status: AttendanceStatus;
  hourlyRate: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice (請求)
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceItem {
  attendanceId: string;
  date: string;
  durationMinutes: number;
  amount: number;
  description: string;
}

export interface Invoice {
  id: string;
  tutorId: string;
  guardianId: string;
  studentId: string;
  month: string; // YYYY-MM
  items: InvoiceItem[];
  totalHours: number;
  totalAmount: number;
  status: InvoiceStatus;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Message (メッセージ)
export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  studentId?: string; // Related student (optional)
  subject?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// Study Log (学習ログ)
export type StudyType = 'homework' | 'review' | 'self_study' | 'exam_prep' | 'lesson';

export interface StudyLog {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  subject: string;
  durationMinutes: number;
  type: StudyType;
  notes?: string;
  lessonId?: string;
  homeworkId?: string;
  createdAt: string;
}

// Goal (目標)
export type GoalType = 'exam' | 'score' | 'habit' | 'study_time';
export type GoalStatus = 'active' | 'completed' | 'failed' | 'paused';

export interface Goal {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  targetDate: string;
  type: GoalType;
  target: number; // Target value
  current: number; // Current progress
  unit: string; // e.g., '点', '時間', '日'
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Analytics Event (分析イベント)
export type AnalyticsEventType =
  | 'page_view'
  | 'lesson_start'
  | 'lesson_end'
  | 'homework_complete'
  | 'question_submit'
  | 'login'
  | 'logout'
  | 'feature_use';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  userRole: UserRole;
  eventType: AnalyticsEventType;
  eventData?: Record<string, any>;
  pageUrl?: string;
  sessionId: string;
  createdAt: string;
  userAgent?: string;
}

// Dashboard Stats (for analytics)
export interface DashboardStats {
  totalStudents: number;
  totalTutors: number;
  totalGuardians: number;
  totalLessons: number;
  totalLessonHours: number;
  activeStudentsThisWeek: number;
  questionsThisWeek: number;
  homeworkCompletionRate: number;
  averageStudyMinutesPerDay: number;
}

// Monthly Report (for tutor/guardian)
export interface MonthlyReport {
  month: string;
  studentId: string;
  studentName: string;
  totalLessons: number;
  totalHours: number;
  totalAmount: number;
  homeworkAssigned: number;
  homeworkCompleted: number;
  questionsAsked: number;
  questionsResolved: number;
  studyLogMinutes: number;
  highlights: string[];
  areasToImprove: string[];
}
