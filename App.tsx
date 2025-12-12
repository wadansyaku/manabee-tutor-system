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

  const handleEmailSubmit = () => {
    setError(null);
    const res = StorageService.login(email); // Check if user exists (mock auth check)
    if (!res.success && res.error === 'ユーザーが見つかりません') {
      setError('ユーザーが見つかりません');
      return;
    }

    // Check role by peeking at error message (hacky but effective for mock)
    // If "パスワードを入力してください" -> User exists but needs password.
    // If success -> Student (no password needed).
    
    const check = StorageService.login(email, ''); 
    if (check.success) {
      onLoginSuccess(check.user!);
    } else if (check.error === 'パスワードを入力してください') {
      setStep('password');
    } else {
      setError(check.error || 'ログインエラー');
    }
  };

  const handlePasswordSubmit = () => {
    setError(null);
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
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 4) {
      setError('パスワードは4文字以上にしてください');
      return;
    }
    if (tempUser) {
      const success = StorageService.changePassword(tempUser.id, newPassword);
      if (success) {
        alert('パスワードを変更しました。新しいパスワードでログインしてください。');
        setStep('password');
        setPassword('');
        setNewPassword('');
        setTempUser(null);
      } else {
        setError('パスワード変更に失敗しました');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">Manabee</h1>
        <p className="text-gray-500 mb-6 text-sm">自律学習を支援するプラットフォーム</p>
        
        {step === 'email' && (
          <div className="space-y-4 animate-fade-in">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
               <input 
                 type="email" 
                 className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 placeholder="demo@manabee.com"
                 onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
               />
             </div>
             <button 
               onClick={handleEmailSubmit}
               className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 transition"
             >
               次へ
             </button>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-4 animate-fade-in">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
               <input 
                 type="password" 
                 className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                 autoFocus
               />
               <p className="text-xs text-gray-400 mt-1">※初期パスワードは "123" です</p>
             </div>
             <button 
               onClick={handlePasswordSubmit}
               className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 transition"
             >
               ログイン
             </button>
             <button onClick={() => setStep('email')} className="w-full text-sm text-gray-500 mt-2 hover:underline">戻る</button>
          </div>
        )}

        {step === 'change_password' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800 mb-2">
               初回ログインのため、パスワード変更が必要です。
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">新しいパスワード</label>
               <input 
                 type="password" 
                 className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                 value={newPassword}
                 onChange={e => setNewPassword(e.target.value)}
                 autoFocus
               />
             </div>
             <button 
               onClick={handleChangePassword}
               className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 transition"
             >
               変更してログインへ
             </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-4 text-center bg-red-50 p-2 rounded">{error}</p>}

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
           <p className="font-bold mb-2">開発用ショートカット:</p>
           <div className="grid grid-cols-2 gap-2">
             <button onClick={() => setEmail('tutor@manabee.com')} className="bg-gray-100 p-2 rounded hover:bg-gray-200">👨‍🏫 Tutor (PW:123)</button>
             <button onClick={() => setEmail('student@manabee.com')} className="bg-gray-100 p-2 rounded hover:bg-gray-200">👦 Student (PW不要)</button>
             <button onClick={() => setEmail('mom@manabee.com')} className="bg-gray-100 p-2 rounded hover:bg-gray-200">👩 Guardian (PW:123)</button>
             <button onClick={() => setEmail('admin@manabee.com')} className="bg-gray-100 p-2 rounded hover:bg-gray-200">⚙️ Admin (PW:123)</button>
           </div>
        </div>
      </div>
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

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-white shadow-xl fixed inset-y-0 z-10 hidden md:block border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-indigo-600">Manabee</span>
          {isStudentView && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">生徒View</span>}
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
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
    days: DateUtils.getDaysRemaining(e.date, e.isAllDay) // Remove fixed CURRENT_DATE
  }))
  .filter(e => e.days >= 0) // Only future or today
  .sort((a, b) => a.days - b.days)
  .slice(0, 5);

  const homeworkItems = lesson.aiHomework?.items.filter(h => !h.isCompleted) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
       <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">こんにちは、{currentUser.name}さん</h1>
          <p className="opacity-90">
            {currentUser.role === UserRole.STUDENT 
             ? "今日の目標をクリアして、自由時間をゲットしよう！"
             : "今日の学習状況と進捗を確認しましょう。"}
          </p>
       </div>

       {/* Next Lesson Info */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex-1 w-full">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> 次回の授業
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-3">
                <div className="text-3xl font-bold text-gray-900">12月17日 (水)</div>
                <div className="text-xl text-indigo-600 font-medium">18:30 - 20:30 (120分)</div>
              </div>
           </div>
           {currentUser.role !== UserRole.GUARDIAN && (
             <Link to="/lessons/l1" className="w-full md:w-auto text-center bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm shrink-0">
               {currentUser.role === UserRole.TUTOR ? "授業を開始" : "予習をする"}
             </Link>
           )}
       </div>

       {/* Tasks / Homework */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
           <CheckCircleIcon className="w-4 h-4" /> 今日やること
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkItems.length > 0 ? (
              homeworkItems.map((hw, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-orange-100 bg-orange-50">
                   <div>
                      <p className="font-bold text-gray-900">{hw.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{hw.type} • 約{hw.estimated_minutes}分</p>
                   </div>
                   <div className="text-xs font-bold text-orange-600 bg-white px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                     あと{hw.due_days_from_now}日
                   </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-gray-500 italic p-4 text-center bg-gray-50 rounded-lg">未完了のタスクはありません 🎉</p>
            )}
         </div>
       </div>

       {/* Event Countdown */}
       <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-500" /> 直近の重要イベント
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-gray-500 text-center">予定はありません</div>
            ) : (
              upcomingEvents.map((evt) => (
                <div key={`${evt.schoolId}-${evt.id}`} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="text-center w-14 shrink-0">
                          <span className="block text-sm font-bold text-gray-500">{DateUtils.formatDate(evt.date).split('(')[0]}</span>
                          <span className="block text-xs text-gray-400">{evt.isAllDay ? '終日' : DateUtils.formatTime(evt.date)}</span>
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{evt.schoolName}</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">{evt.title}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold leading-none ${evt.days <= 7 ? 'text-red-600' : 'text-indigo-600'}`}>
                        {evt.days === 0 ? '今日' : <>{evt.days}<span className="text-xs font-normal text-gray-400 ml-1">日後</span></>}
                      </p>
                    </div>
                </div>
              ))
            )}
          </div>
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
  // IMPORTANT: We also switch the ID to the student's ID (s1) to ensure data access works correctly.
  const effectiveUser = viewAsStudent 
    ? { 
        ...user, 
        role: UserRole.STUDENT, 
        id: INITIAL_STUDENT_CONTEXT.id, // Masquerade ID as s1
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