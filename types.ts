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
