import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MOCK_LESSON, INITIAL_STUDENT_CONTEXT } from './constants';
import { UserRole, Lesson, StudentSchool, AuditLog, User, QuestionJob } from './types';
import { StorageService } from './services/storageService';
import { LessonDetail } from './components/LessonDetail';
import { SchoolList } from './components/SchoolList';
import { QuestionBoard } from './components/QuestionBoard';
import { Dashboard } from './components/Dashboard';
import { HomeworkList } from './components/HomeworkList';
import { ExamScoreManager } from './components/ExamScoreManager';
import { StudentSelector } from './components/StudentSelector';
// Admin Components
import { UserManagement } from './components/admin/UserManagement';
import { SystemSettings } from './components/admin/SystemSettings';
import { UsageMonitor } from './components/admin/UsageMonitor';
import { DatabaseSeeder } from './components/admin/DatabaseSeeder';
// Tutor Components
import { ReviewQueue } from './components/tutor/ReviewQueue';
import { LessonRecorder } from './components/tutor/LessonRecorder';
// Student Components
import { HomeworkCalendar } from './components/student/HomeworkCalendar';
import { GoalTracker } from './components/student/GoalTracker';
import { HomeworkPage } from './components/student/HomeworkPage';
import { AIAssistant } from './components/student/AIAssistant';
// Common Components
import { ReportExport } from './components/common/ReportExport';
import { NotificationCenter } from './components/common/NotificationCenter';
// Extracted Components
import { LoginScreen } from './components/LoginScreen';
import { AppLayout } from './components/AppLayout';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [viewAsStudent, setViewAsStudent] = useState(false); // For Guardian preview
  const [masqueradeUser, setMasqueradeUser] = useState<User | null>(null); // For Admin masquerade
  // Multi-child support: persist selected student in localStorage
  const [selectedStudentId, setSelectedStudentId] = useState(
    () => localStorage.getItem('manabee_selected_student') || 's1'
  );
  const [lesson, setLesson] = useState<Lesson>(MOCK_LESSON);
  const [schools, setSchools] = useState<StudentSchool[]>([]);
  const [questions, setQuestions] = useState<QuestionJob[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);

  // Data Loading with optional studentId and user filtering for multi-child support
  // Use provided user for role-based filtering to avoid crashes during masquerade
  const refreshData = useCallback(async (studentId?: string, targetUser?: User) => {
    const targetStudentId = studentId || selectedStudentId;
    const currentUserForFetch = targetUser || user;

    // Skip if no user available
    if (!currentUserForFetch) return;

    // Load static data (Schools, Questions)
    if (import.meta.env.VITE_APP_MODE === 'firebase') {
      try {
        const { firestoreOperations } = await import('./services/firebaseService');

        // Fetch students list for Tutors and Guardians only
        if (currentUserForFetch.role === UserRole.GUARDIAN || currentUserForFetch.role === UserRole.TUTOR) {
          const linked = await firestoreOperations.getLinkedStudents(currentUserForFetch.id, currentUserForFetch.role);
          setStudentsList(linked);

          // If current selected student is not in the list (and list is not empty), select first
          if (linked.length > 0 && !linked.find(s => s.id === targetStudentId)) {
            setSelectedStudentId(linked[0].id);
            localStorage.setItem('manabee_selected_student', linked[0].id);
          }
        }

        // Fetch Real Data
        const [fbSchools, fbLesson, fbQuestions] = await Promise.all([
          firestoreOperations.getSchools(targetStudentId),
          firestoreOperations.getLesson('l1'),
          firestoreOperations.getQuestions(currentUserForFetch.role, currentUserForFetch.id)
        ]);

        if (fbSchools) setSchools(fbSchools);
        if (fbLesson) setLesson(fbLesson);
        if (fbQuestions) setQuestions(fbQuestions);

        const fbLogs = await firestoreOperations.getAuditLogs();
        setLogs(fbLogs);

        return; // Exit early to avoid overwriting with local data
      } catch (error) {
        console.error('Firebase data fetch failed:', error);
      }
    }

    // Existing StorageService fallback / hybrid
    const allSchools = StorageService.loadSchools();
    const allQuestions = StorageService.loadQuestions();

    // For Guardians and Tutors, filter data by selected student
    if (currentUserForFetch.role === UserRole.GUARDIAN || currentUserForFetch.role === UserRole.TUTOR) {
      setSchools(allSchools.filter(s => s.studentId === targetStudentId));
      setQuestions(allQuestions.filter(q => q.studentId === targetStudentId));
    } else {
      setSchools(allSchools);
      setQuestions(allQuestions);
    }
    setLesson(StorageService.loadLesson());
    setLogs(StorageService.loadLogs());
  }, [selectedStudentId, user]);

  // Handler for student selection with localStorage persistence
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    localStorage.setItem('manabee_selected_student', id);
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

  // Real-time user updates (XP, Level, Badges)
  useEffect(() => {
    if (!user) return;

    // Use dynamic import to avoid circular dependencies if any, 
    // or just import it at top level if clean. 
    // For now, let's assume top level import is fine, but I'll add it to the file.
    import('./services/gamificationService').then((module) => {
      const gamificationService = module.default;
      const unsubscribe = gamificationService.subscribeToUpdates(user.id, (stats) => {
        setUser(prev => prev ? { ...prev, ...stats } : null);
      });
      return () => unsubscribe();
    });
  }, [user?.id]);

  // Listen for background data sync events (e.g. from Firebase)
  useEffect(() => {
    const handleSync = () => {
      console.log('Data synced event received, refreshing...');
      refreshData();
    };
    window.addEventListener('manabee-data-synced', handleSync);
    return () => window.removeEventListener('manabee-data-synced', handleSync);
  }, [selectedStudentId, user?.role, refreshData]);

  const handleLoginSuccess = async (u: User) => {
    setUser(u);
    setViewAsStudent(false);
    setMasqueradeUser(null);
    refreshData();

    // Update activity streak
    if (import.meta.env.VITE_APP_MODE === 'firebase') {
      try {
        const { firestoreOperations } = await import('./services/firebaseService');
        const { streak, xp, level } = await firestoreOperations.updateUserActivity(u.id);
        // Update local user state with new stats immediately
        setUser(prev => prev ? { ...prev, streak, xp, level } : null);
      } catch (e) {
        console.error('Failed to update activity', e);
      }
    }
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
    setMasqueradeUser(null);
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
  // Effect: Masquerade has priority, then Student View
  const effectiveUser = masqueradeUser || (viewAsStudent
    ? {
      ...user,
      role: UserRole.STUDENT,
      id: INITIAL_STUDENT_CONTEXT.id,
      name: `${user.name} (Preview)`
    }
    : user);

  return (
    <HashRouter>
      <GlobalErrorBoundary currentUser={user}>
        <AppLayout
          currentUser={effectiveUser}
          onLogout={handleLogout}
          originalRole={user.role}
          isStudentView={viewAsStudent}
          onToggleStudentView={() => setViewAsStudent(!viewAsStudent)}
          isMasquerading={!!masqueradeUser}
          onExitMasquerade={() => setMasqueradeUser(null)}
        >
          <Routes>
            <Route path="/" element={
              <>
                {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                  <StudentSelector
                    students={studentsList}
                    selectedStudentId={selectedStudentId}
                    onSelectStudent={handleSelectStudent}
                    currentUser={user}
                  />
                )}
                <Dashboard
                  currentUser={effectiveUser}
                  schools={schools}
                  lesson={lesson}
                  logs={logs}
                  questions={questions}
                  studentId={selectedStudentId}
                  students={studentsList}
                />
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
                    students={studentsList}
                    selectedStudentId={selectedStudentId}
                    onSelectStudent={handleSelectStudent}
                    currentUser={user}
                  />
                )}
                <HomeworkPage
                  lesson={lesson}
                  currentUser={effectiveUser}
                  onUpdateLesson={handleUpdateLesson}
                />
              </>
            } />

            {/* /chat is now redirected to unified AI Assistant */}
            <Route path="/chat" element={<Navigate to="/ai-assistant" replace />} />

            {/* Unified AI Assistant - combines Chat and Photo Questions */}
            <Route path="/ai-assistant" element={
              <AIAssistant currentUser={effectiveUser} questions={questions} onUpdate={refreshData} />
            } />

            <Route path="/goals" element={<GoalTracker currentUser={effectiveUser} />} />

            <Route path="/calendar" element={<HomeworkCalendar currentUser={effectiveUser} />} />

            <Route path="/lessons/:id" element={
              <LessonDetail
                lesson={lesson}
                currentUser={effectiveUser}
                onUpdate={handleUpdateLesson}
              />
            } />

            <Route path="/schools" element={
              <SchoolList
                schools={schools}
                currentUser={effectiveUser}
                onUpdate={handleUpdateSchool}
                onAdd={handleAddSchool}
                onDelete={handleDeleteSchool}
              />
            } />

            <Route path="/scores" element={
              <>
                {user && (user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) && (
                  <StudentSelector
                    students={studentsList}
                    selectedStudentId={selectedStudentId}
                    onSelectStudent={handleSelectStudent}
                    currentUser={user}
                  />
                )}
                <ExamScoreManager currentUser={effectiveUser} studentId={selectedStudentId} />
              </>
            } />

            {/* Admin Routes */}
            <Route path="/admin/users" element={
              effectiveUser.role === UserRole.ADMIN ? (
                <UserManagement
                  currentUser={effectiveUser}
                  onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
                  onMasquerade={(target) => {
                    setMasqueradeUser(target);
                    // Refresh data for the masqueraded user and navigate home
                    setTimeout(() => {
                      refreshData(undefined, target);
                      window.location.hash = '/';
                    }, 100);
                  }}
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
                  onReset={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                />
              ) : <Navigate to="/" replace />
            } />

            <Route path="/reports" element={
              <ReportExport currentUser={effectiveUser} studentId={selectedStudentId} />
            } />

            <Route path="/recording" element={
              effectiveUser.role === UserRole.TUTOR || effectiveUser.role === UserRole.ADMIN ? (
                <LessonRecorder currentUser={effectiveUser} studentId={selectedStudentId} />
              ) : <Navigate to="/" replace />
            } />

            <Route path="/notifications" element={<NotificationCenter currentUser={effectiveUser} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AppLayout>
      </GlobalErrorBoundary>
    </HashRouter>
  );
}
