import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { MOCK_LESSON, INITIAL_STUDENT_CONTEXT } from './constants';
import { UserRole, Lesson, StudentSchool, AuditLog, User, QuestionJob } from './types';
import { StorageService, DateUtils } from './services/storageService';
import { LessonDetail } from './components/LessonDetail';
import { SchoolList } from './components/SchoolList';
import { RoleBadge } from './components/RoleBadge';
import { QuestionBoard } from './components/QuestionBoard';
import { Dashboard } from './components/Dashboard';
import { HomeworkList } from './components/HomeworkList';
import { ExamScoreManager } from './components/ExamScoreManager';
import { StudentSelector, StudentSelectorCompact, MOCK_STUDENTS } from './components/StudentSelector';
import { CalendarIcon, CheckCircleIcon, ClockIcon, FlagIcon, SparklesIcon } from './components/icons';
// Admin Components
import { UserManagement } from './components/admin/UserManagement';
import { SystemSettings } from './components/admin/SystemSettings';
import { UsageMonitor } from './components/admin/UsageMonitor';
import { DatabaseSeeder } from './components/admin/DatabaseSeeder';

// --- Login Screen ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) => {
  const [step, setStep] = useState<'email' | 'password' | 'change_password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    setError(null);
    setIsLoading(true);

    // Simulate network delay for better UX
    await new Promise(r => setTimeout(r, 300));

    const res = StorageService.login(email);
    if (!res.success && res.error === 'ユーザーが見つかりません') {
      setError('ユーザーが見つかりません');
      setIsLoading(false);
      return;
    }

    const check = StorageService.login(email, '');
    if (check.success) {
      onLoginSuccess(check.user!);
    } else if (check.error === 'パスワードを入力してください') {
      setStep('password');
    } else {
      setError(check.error || 'ログインエラー');
    }
    setIsLoading(false);
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('パスワードを入力してください');
      return;
    }
    setError(null);
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 300));

    const res = StorageService.login(email, password);
    if (res.success && res.user) {
      if (res.user.isInitialPassword) {
        setTempUser(res.user);
        setStep('change_password');
      } else {
        onLoginSuccess(res.user);
      }
    } else {
      setError(res.error || '認証に失敗しました');
    }
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      setError('パスワードは4文字以上にしてください');
      return;
    }
    setIsLoading(true);

    if (tempUser) {
      const success = StorageService.changePassword(tempUser.id, newPassword);
      if (success) {
        setStep('password');
        setPassword('');
        setNewPassword('');
        setTempUser(null);
        setError(null);
      } else {
        setError('パスワード変更に失敗しました');
      }
    }
    setIsLoading(false);
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl shadow-lg mb-4 transform hover:scale-105 transition-transform">
            <span className="text-3xl">🐝</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Manabee</h1>
          <p className="text-white/60 text-sm">自律学習を支援するプラットフォーム</p>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">メールアドレス</label>
              <input
                type="email"
                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleEmailSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  確認中...
                </>
              ) : '次へ →'}
            </button>
          </div>
        )}

        {/* Password Step */}
        {step === 'password' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {email[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm truncate">{email}</p>
              </div>
              <button onClick={() => setStep('email')} className="text-white/40 hover:text-white/80 text-xs">変更</button>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">パスワード</label>
              <input
                type="password"
                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
                disabled={isLoading}
                placeholder="••••••••"
              />
              <p className="text-white/40 text-xs mt-2">※初期パスワードは "123" です</p>
            </div>
            <button
              onClick={handlePasswordSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  ログイン中...
                </>
              ) : 'ログイン'}
            </button>
          </div>
        )}

        {/* Change Password Step */}
        {step === 'change_password' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-amber-500/20 border border-amber-400/30 p-4 rounded-xl text-amber-200 text-sm flex items-start gap-3">
              <span className="text-xl">🔐</span>
              <p>セキュリティのため、初回ログイン時はパスワードの変更が必要です。</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">新しいパスワード</label>
              <input
                type="password"
                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
                disabled={isLoading}
                placeholder="4文字以上"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '処理中...' : 'パスワードを変更'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-400/30 p-4 rounded-xl text-red-200 text-sm flex items-center gap-3 animate-shake">
            <span className="text-xl">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Quick Login Buttons */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/40 text-xs mb-3 text-center">開発用クイックログイン</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('tutor@manabee.com')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">👨‍🏫</span> 講師
            </button>
            <button
              onClick={() => quickLogin('student@manabee.com')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">👦</span> 生徒
            </button>
            <button
              onClick={() => quickLogin('mom@manabee.com')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">👩</span> 保護者
            </button>
            <button
              onClick={() => quickLogin('admin@manabee.com')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">⚙️</span> 管理者
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-shake { animation: shake 0.3s ease-out; }
      `}</style>
    </div>
  );
};


// --- Layout & Nav ---
interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  originalRole?: UserRole; // To toggle back
  onToggleStudentView?: () => void;
  isStudentView?: boolean;
}

const Layout = ({ children, currentUser, onLogout, originalRole, onToggleStudentView, isStudentView }: LayoutProps) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role based navigation
  const getNavItems = () => {
    const common = [
      { name: 'ダッシュボード', path: '/' },
    ];

    if (currentUser.role === UserRole.STUDENT) {
      return [
        ...common,
        { name: '写真で質問', path: '/questions' },
        { name: '宿題リスト', path: '/homework' },
      ];
    }

    if (currentUser.role === UserRole.TUTOR) {
      return [
        ...common,
        { name: '質問レビュー', path: '/questions' },
        { name: '宿題管理', path: '/homework' },
        { name: '成績管理', path: '/scores' },
        { name: '授業記録', path: '/lessons/l1' }, // Fixed ID for MVP
        { name: '受験校管理', path: '/schools' },
      ];
    }

    // Guardian / Admin
    if (currentUser.role === UserRole.ADMIN) {
      return [
        ...common,
        { name: 'ユーザー管理', path: '/admin/users' },
        { name: 'システム設定', path: '/admin/settings' },
        { name: '使用状況', path: '/admin/usage' },
        { name: 'DB初期化', path: '/admin/database' },
        { name: '宿題', path: '/homework' },
        { name: '成績', path: '/scores' },
        { name: '受験校', path: '/schools' },
      ];
    }

    // Guardian only
    return [
      ...common,
      { name: '宿題', path: '/homework' },
      { name: '成績', path: '/scores' },
      { name: '学習状況', path: '/lessons/l1' },
      { name: '受験校', path: '/schools' },
    ];
  };

  const navItems = getNavItems();

  // Close mobile menu on navigation
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop) + Mobile Drawer */}
      <div className={`w-64 bg-white shadow-xl fixed inset-y-0 z-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-xl font-bold text-indigo-600">Manabee</span>
            {isStudentView && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">生徒View</span>}
          </div>
          {/* Close button for mobile */}
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          {/* Student View Toggle for Guardians */}
          {originalRole === UserRole.GUARDIAN && (
            <button
              onClick={onToggleStudentView}
              className={`w-full text-xs mb-3 py-2 rounded border font-bold flex items-center justify-center gap-2 ${isStudentView ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
            >
              {isStudentView ? '保護者に戻る' : '生徒として表示'}
            </button>
          )}

          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
              {currentUser.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <RoleBadge role={currentUser.role} />
            </div>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded py-2">
            ログアウト
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 md:hidden">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold text-indigo-600">Manabee</span>
          <button onClick={onLogout} className="text-xs text-gray-500">ログアウト</button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


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

    // For Guardians, filter data by selected child
    if (user?.role === UserRole.GUARDIAN) {
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

  // Refresh data when selected student changes (for Guardians)
  useEffect(() => {
    if (user?.role === UserRole.GUARDIAN) {
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

  const handleLogout = () => {
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
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Effect: Masquerade as Student if viewAsStudent is true
  // IMPORTANT: Current implementation assumes single child (s1).
  // For multi-child support, add studentId selector when Guardian logs in.
  // The selected studentId should be stored in state and used here instead of INITIAL_STUDENT_CONTEXT.id.
  const effectiveUser = viewAsStudent
    ? {
      ...user,
      role: UserRole.STUDENT,
      id: INITIAL_STUDENT_CONTEXT.id, // TODO: Replace with selected studentId for multi-child
      name: `${user.name} (Preview)`
    }
    : user;

  return (
    <HashRouter>
      <Layout
        currentUser={effectiveUser}
        onLogout={handleLogout}
        originalRole={user.role}
        isStudentView={viewAsStudent}
        onToggleStudentView={() => setViewAsStudent(!viewAsStudent)}
      >
        <Routes>
          <Route path="/" element={
            <>
              {user && user.role === UserRole.GUARDIAN && (
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
            <QuestionBoard currentUser={effectiveUser} questions={questions} onUpdate={refreshData} />
          } />

          <Route path="/homework" element={
            <HomeworkList
              lesson={lesson}
              currentUser={effectiveUser}
              onUpdateLesson={handleUpdateLesson}
              onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
              studentId={selectedStudentId}
            />
          } />

          <Route path="/lessons/:id" element={
            <LessonDetail
              lesson={lesson}
              currentUser={effectiveUser}
              onUpdateLesson={handleUpdateLesson}
              onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
            />
          } />

          <Route path="/schools" element={
            <SchoolList
              schools={schools}
              currentUser={effectiveUser}
              onUpdateSchool={handleUpdateSchool}
              onAddSchool={handleAddSchool}
              onDeleteSchool={handleDeleteSchool}
              permissionMode={effectiveUser.role === UserRole.TUTOR ? 'strict' : 'collaborative'}
            />
          } />

          <Route path="/scores" element={
            <ExamScoreManager
              currentUser={effectiveUser}
              schools={schools}
              onAudit={(action, summary) => StorageService.addLog(user, action, summary)}
              studentId={selectedStudentId}
            />
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
      </Layout>
    </HashRouter>
  );
}
