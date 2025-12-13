import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { MOCK_LESSON, INITIAL_STUDENT_CONTEXT } from './constants';
import { UserRole, Lesson, StudentSchool, AuditLog, User, QuestionJob } from './types';
import { StorageService, DateUtils } from './services/storageService';
import { LessonDetail } from './components/LessonDetail';
import { SchoolList } from './components/SchoolList';
import { RoleBadge } from './components/RoleBadge';
import { QuestionBoard } from './components/QuestionBoard';
import { CalendarIcon, CheckCircleIcon, ClockIcon, FlagIcon, SparklesIcon } from './components/icons';

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
        { name: '授業記録', path: '/lessons/l1' }, // Fixed ID for MVP
        { name: '受験校管理', path: '/schools' },
      ];
    }

    // Guardian / Admin
    return [
      ...common,
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

// --- Dashboard ---
const Dashboard = ({ currentUser, schools, lesson, logs }: { currentUser: User, schools: StudentSchool[], lesson: Lesson, logs: AuditLog[] }) => {
  // Sort schools by priority
  const sortedSchools = [...schools].sort((a, b) => a.priority - b.priority);

  // Upcoming Events (Using STRICT DateUtils with Realtime NOW)
  const upcomingEvents = schools.flatMap(s =>
    s.events.map(e => ({ ...e, schoolName: s.name, schoolId: s.id }))
  )
    .map(e => ({
      ...e,
      days: DateUtils.getDaysRemaining(e.date, e.isAllDay)
    }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const homeworkItems = lesson.aiHomework?.items.filter(h => !h.isCompleted) || [];
  const completedHomework = lesson.aiHomework?.items.filter(h => h.isCompleted) || [];
  const totalHomework = lesson.aiHomework?.items.length || 0;
  const completionRate = totalHomework > 0 ? Math.round((completedHomework.length / totalHomework) * 100) : 0;

  // Find next exam
  const nextExam = upcomingEvents.find(e => e.type === 'exam');

  // Stats data (mock for now - would be calculated from actual data)
  const stats = {
    studyHours: 12.5,
    problemsSolved: 47,
    streak: 5,
    daysToExam: nextExam?.days ?? null
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">
              {currentUser.role === UserRole.STUDENT ? '🎓' : currentUser.role === UserRole.TUTOR ? '👨‍🏫' : '👪'}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">こんにちは、{currentUser.name}さん！</h1>
              <p className="opacity-80 text-sm">
                {new Date().toLocaleDateString('ja-JP', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <p className="text-white/90 text-lg mt-4">
            {currentUser.role === UserRole.STUDENT
              ? "今日も一歩ずつ、目標に近づこう！💪"
              : currentUser.role === UserRole.TUTOR
                ? "生徒の成長を一緒に支えましょう"
                : "お子さまの学習状況をチェック"}
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Hours Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <ClockIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-400 font-medium">今週</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.studyHours}<span className="text-sm font-normal text-gray-500 ml-1">時間</span></p>
          <p className="text-xs text-gray-500 mt-1">学習時間</p>
        </div>

        {/* Problems Solved Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:scale-110 transition-transform">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-400 font-medium">今週</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.problemsSolved}<span className="text-sm font-normal text-gray-500 ml-1">問</span></p>
          <p className="text-xs text-gray-500 mt-1">解いた問題数</p>
        </div>

        {/* Streak Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
              <span className="text-lg">🔥</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">連続記録</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.streak}<span className="text-sm font-normal text-gray-500 ml-1">日</span></p>
          <p className="text-xs text-gray-500 mt-1">学習ストリーク</p>
        </div>

        {/* Days to Exam Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
              <FlagIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-400 font-medium">次の試験</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.daysToExam !== null ? (
              <>{stats.daysToExam}<span className="text-sm font-normal text-gray-500 ml-1">日後</span></>
            ) : (
              <span className="text-sm font-normal text-gray-400">未設定</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1 truncate">{nextExam?.title || '試験予定なし'}</p>
        </div>
      </div>

      {/* Progress & Next Lesson Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Homework Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-purple-500" /> 宿題進捗
          </h3>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">完了率</span>
              <span className="text-lg font-bold text-gray-900">{completionRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{completedHomework.length} / {totalHomework} 完了</p>
          </div>

          {/* Pending items */}
          {homeworkItems.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {homeworkItems.slice(0, 3).map((hw, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center text-orange-700 text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{hw.title}</p>
                      <p className="text-xs text-gray-500">約{hw.estimated_minutes}分</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-orange-600">あと{hw.due_days_from_now}日</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-green-50 rounded-xl">
              <span className="text-2xl">🎉</span>
              <p className="text-sm text-green-700 font-medium mt-1">全て完了！</p>
            </div>
          )}
        </div>

        {/* Next Lesson Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-500" /> 次回の授業
          </h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-xs text-indigo-600 font-medium">12月</span>
              <span className="text-2xl font-bold text-indigo-900">17</span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">水曜日</p>
              <p className="text-indigo-600 font-medium">18:30 - 20:30</p>
              <p className="text-xs text-gray-500">120分授業</p>
            </div>
          </div>
          {currentUser.role !== UserRole.GUARDIAN && (
            <Link
              to="/lessons/l1"
              className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-200"
            >
              {currentUser.role === UserRole.TUTOR ? "授業を開始 →" : "予習をする →"}
            </Link>
          )}
        </div>
      </div>

      {/* Event Countdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-red-500" /> 直近の重要イベント
        </h3>
        {upcomingEvents.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <span className="text-3xl block mb-2">📅</span>
            予定されているイベントはありません
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((evt) => (
              <div
                key={`${evt.schoolId}-${evt.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center group-hover:shadow-md transition-shadow">
                    <span className="text-xs text-gray-500">{DateUtils.formatDate(evt.date).split('/')[0]}</span>
                    <span className="text-lg font-bold text-gray-900">{DateUtils.formatDate(evt.date).split('/')[1]?.split('(')[0]}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{evt.schoolName}</span>
                    <p className="font-bold text-gray-900 mt-1">{evt.title}</p>
                  </div>
                </div>
                <div className={`text-right px-4 py-2 rounded-xl font-bold ${evt.days <= 0 ? 'bg-orange-100 text-orange-700' :
                  evt.days <= 7 ? 'bg-red-100 text-red-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                  {DateUtils.formatDaysRemaining(evt.days)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [viewAsStudent, setViewAsStudent] = useState(false); // For Guardian preview
  const [lesson, setLesson] = useState<Lesson>(MOCK_LESSON);
  const [schools, setSchools] = useState<StudentSchool[]>([]);
  const [questions, setQuestions] = useState<QuestionJob[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Data Loading
  const refreshData = () => {
    setSchools(StorageService.loadSchools());
    setLesson(StorageService.loadLesson());
    setLogs(StorageService.loadLogs());
    setQuestions(StorageService.loadQuestions());
  };

  useEffect(() => {
    refreshData();
  }, []);

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
          <Route path="/" element={<Dashboard currentUser={effectiveUser} schools={schools} lesson={lesson} logs={logs} />} />

          <Route path="/questions" element={
            <QuestionBoard currentUser={effectiveUser} questions={questions} onUpdate={refreshData} />
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

          {/* Fallback for old routes or mis-navigation */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}