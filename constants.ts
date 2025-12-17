import { User, UserRole, Lesson, StudentProfile, StudentSchool } from './types';

// Current date - use actual date in production
export const CURRENT_DATE = new Date();

// Initial student profile - empty/placeholder
export const INITIAL_STUDENT_CONTEXT: StudentProfile = {
  id: '',
  name: '',
  grade: '',
  targetSchool: '',
  subjects: [],
  notes: ''
};

// Demo users for local development mode only
// In Firebase mode, users come from Firestore
export const MOCK_USERS: User[] = [
  { id: 't1', name: '講師', role: UserRole.TUTOR, email: 'tutor@manabee.com' },
  { id: 's1', name: '生徒', role: UserRole.STUDENT, email: 'student@manabee.com' },
  { id: 'g1', name: '保護者', role: UserRole.GUARDIAN, email: 'parent@manabee.com' },
  { id: 'a1', name: '管理者', role: UserRole.ADMIN, email: 'admin@manabee.com' },
];

// Empty initial schools - real data comes from Firestore
export const MOCK_SCHOOLS: StudentSchool[] = [];

// Empty initial lesson - real data comes from Firestore
export const MOCK_LESSON: Lesson = {
  id: '',
  studentId: '',
  scheduledAt: '',
  durationMinutes: 0,
  status: 'scheduled',
  hourlyRate: 0,
  transcript: '',
  aiSummary: undefined,
  aiHomework: {
    items: []
  },
  aiQuiz: {
    questions: []
  },
  reflections: undefined,
  tags: []
};

// Colors associated with roles for UI hints
export const ROLE_COLORS = {
  [UserRole.TUTOR]: 'indigo',
  [UserRole.STUDENT]: 'blue',
  [UserRole.GUARDIAN]: 'teal',
  [UserRole.ADMIN]: 'gray',
};