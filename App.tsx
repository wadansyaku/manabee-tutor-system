import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MOCK_LESSON, INITIAL_STUDENT_CONTEXT } from './constants';
import { UserRole, Lesson, StudentSchool, AuditLog, User, QuestionJob } from './types';
import { StorageService } from './services/storageService';
import { LessonDetail } from './components/LessonDetail';
import { SchoolList } from './components/SchoolList';
import { QuestionBoard } from './components/QuestionBoard';
import { Dashboard } from './components/Dashboard';
import { HomeworkList } from './components/HomeworkList';
import { ExamScoreManager } from './components/ExamScoreManager';
import { StudentSelector, MOCK_STUDENTS } from './components/StudentSelector';
// Admin Components
import { UserManagement } from './components/admin/UserManagement';
import { SystemSettings } from './components/admin/SystemSettings';
import { UsageMonitor } from './components/admin/UsageMonitor';
import { DatabaseSeeder } from './components/admin/DatabaseSeeder';
// Tutor Components
import { ReviewQueue } from './components/tutor/ReviewQueue';
// Extracted Components
import { LoginScreen } from './components/LoginScreen';
import { AppLayout } from './components/AppLayout';

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [viewAsStudent, setViewAsStudent] = useState(false); // For Guardian preview
  // Multi-child support: persist selected student in localStorage
  const [selectedStudentId, setSelectedStudentId] = useState(
    () => localStorage.getItem('manabee_selected_student') || 's1'
  );
  const [lesson, setLesson] = useState<Lesson>(MOCK_LESSON);
  const [schools, setSchools] = useState<StudentSchool[]>([]);
  const [questions, setQuestions] = useState<QuestionJob[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Data Loading with optional studentId filtering for multi-child support
  const refreshData = (studentId?: string) => {
    const targetStudentId = studentId || selectedStudentId;
    const allSchools = StorageService.loadSchools();
    const allQuestions = StorageService.loadQuestions();

    // For Guardians and Tutors, filter data by selected student
    if (user?.role === UserRole.GUARDIAN || user?.role === UserRole.TUTOR) {
      setSchools(allSchools.filter(s => s.studentId === targetStudentId));
      setQuestions(allQuestions.filter(q => q.studentId === targetStudentId));
    } else {
      setSchools(allSchools);
      setQuestions(allQuestions);
    }
    setLesson(StorageService.loadLesson());
    setLogs(StorageService.loadLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Refresh data when selected student changes (for Guardians and Tutors)
  useEffect(() => {
    if (user?.role === UserRole.GUARDIAN || user?.role === UserRole.TUTOR) {
      refreshData(selectedStudentId);
    }
  }, [selectedStudentId, user?.role]);

  // Handler for student selection with localStorage persistence
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    localStorage.setItem('manabee_selected_student', id);
  };

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setViewAsStudent(false);
    refreshData();
  };

  const handleLogout = async () => {
    if (import.meta.env.VITE_APP_MODE === 'firebase') {
      try {
        const { firebaseLogout } = await import('./services/firebaseService');
        await firebaseLogout();
      } catch (e) {
        console.error('Logout failed', e);
      }
    }
    setUser(null);
    setViewAsStudent(false);
  };

  const handleUpdateLesson = (updated: Lesson) => {
    setLesson(updated);
    StorageService.saveLesson(updated);
    refreshData();
  };

  const handleUpdateSchool = (school: StudentSchool) => {
    const newSchools = schools.map(s => s.id === school.id ? school : s);
    setSchools(newSchools);
    StorageService.saveSchools(newSchools);
    refreshData();
  };

  const handleAddSchool = (school: StudentSchool) => {
    const newSchools = [...schools, school];
    setSchools(newSchools);
    StorageService.saveSchools(newSchools);
    refreshData();
  };

  const handleDeleteSchool = (id: string) => {
    const newSchools = schools.filter(s => s.id !== id);
    setSchools(newSchools);
    StorageService.saveSchools(newSchools);
    refreshData();
  };

  // Main Render
  const [isLoadingAuth, setIsLoadingAuth] = useState(import.meta.env.VITE_APP_MODE === 'firebase');

  useEffect(() => {
    const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
    if (!isFirebaseMode) return;

    // Async import to avoid loading Firebase in local mode
    const initAuth = async () => {
      try {
        const { onAuthChange, getUser } = await import('./services/firebaseService');
        const unsubscribe = await onAuthChange(async (firebaseUser: any) => {
          if (firebaseUser) {
            // User is signed in
            console.log('Firebase User detected:', firebaseUser.uid);
            const userProfile = await getUser(firebaseUser.uid);
            if (userProfile) {
              setUser(userProfile);
              refreshData(); // Fetch initial data
            } else {
              // Fallback if user exists in Auth but not in Firestore (rare race condition)
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: UserRole.STUDENT, // Default
                isInitialPassword: false
              });
            }
          } else {
            // User is signed out
            setUser(null);
          }
          setIsLoadingAuth(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization failed', error);
        setIsLoadingAuth(false);
      }
    };

    initAuth();
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Manabeeを起動中...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Effect: Masquerade as Student if viewAsStudent is true
  const effectiveUser = viewAsStudent
    ? {
      ...user,
      role: UserRole.STUDENT,
      id: INITIAL_STUDENT_CONTEXT.id,
      name: `${user.name} (Preview)`
    }
    : user;

  return (
    <HashRouter>
      <AppLayout
        currentUser={effectiveUser}
        onLogout={handleLogout}
        originalRole={user.role}
        isStudentView={viewAsStudent}
        onToggleStudentView={() => setViewAsStudent(!viewAsStudent)}
      >
        <Routes>
          <Route path="/" element={
            <>
              {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                <StudentSelector
                  students={MOCK_STUDENTS}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  currentUser={user}
                />
              )}
              <Dashboard currentUser={effectiveUser} schools={schools} lesson={lesson} logs={logs} questions={questions} studentId={selectedStudentId} />
            </>
          } />

          <Route path="/questions" element={
            effectiveUser.role === UserRole.TUTOR ? (
              <ReviewQueue currentUser={effectiveUser} questions={questions} onUpdate={refreshData} />
            ) : (
              <QuestionBoard currentUser={effectiveUser} questions={questions} onUpdate={refreshData} />
            )
          } />

          <Route path="/homework" element={
            <>
              {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                <StudentSelector
                  students={MOCK_STUDENTS}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  currentUser={user}
                />
              )}
              <HomeworkList
                lesson={lesson}
                currentUser={effectiveUser}
                onUpdateLesson={handleUpdateLesson}
                onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
                studentId={selectedStudentId}
              />
            </>
          } />

          <Route path="/lessons/:id" element={
            <>
              {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                <StudentSelector
                  students={MOCK_STUDENTS}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  currentUser={user}
                />
              )}
              <LessonDetail
                lesson={lesson}
                currentUser={effectiveUser}
                onUpdateLesson={handleUpdateLesson}
                onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
              />
            </>
          } />

          <Route path="/schools" element={
            <>
              {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                <StudentSelector
                  students={MOCK_STUDENTS}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  currentUser={user}
                />
              )}
              <SchoolList
                schools={schools}
                currentUser={effectiveUser}
                onUpdateSchool={handleUpdateSchool}
                onAddSchool={handleAddSchool}
                onDeleteSchool={handleDeleteSchool}
                permissionMode={effectiveUser.role === UserRole.TUTOR ? 'strict' : 'collaborative'}
              />
            </>
          } />

          <Route path="/scores" element={
            <>
              {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                <StudentSelector
                  students={MOCK_STUDENTS}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  currentUser={user}
                />
              )}
              <ExamScoreManager
                currentUser={effectiveUser}
                schools={schools}
                onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
                studentId={selectedStudentId}
              />
            </>
          } />

          {/* Admin Routes */}
          <Route path="/admin/users" element={
            effectiveUser.role === UserRole.ADMIN ? (
              <UserManagement
                currentUser={effectiveUser}
                onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
              />
            ) : <Navigate to="/" replace />
          } />
          <Route path="/admin/settings" element={
            effectiveUser.role === UserRole.ADMIN ? (
              <SystemSettings
                currentUser={effectiveUser}
                onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
              />
            ) : <Navigate to="/" replace />
          } />
          <Route path="/admin/usage" element={
            effectiveUser.role === UserRole.ADMIN ? (
              <UsageMonitor
                currentUser={effectiveUser}
                logs={logs}
              />
            ) : <Navigate to="/" replace />
          } />
          <Route path="/admin/database" element={
            effectiveUser.role === UserRole.ADMIN ? (
              <DatabaseSeeder
                currentUser={effectiveUser}
                onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
              />
            ) : <Navigate to="/" replace />
          } />

          {/* Fallback for old routes or mis-navigation */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
