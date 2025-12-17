import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, StudentSchool, Lesson, AuditLog, QuestionJob } from '../types';
import { DateUtils } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { getHomeworkMeta } from '../services/homeworkUtils';
import { CalendarIcon, CheckCircleIcon, ClockIcon, FlagIcon, SparklesIcon } from './icons';
import { MOCK_STUDENTS } from './StudentSelector';

interface DashboardProps {
    currentUser: User;
    schools: StudentSchool[];
    lesson: Lesson;
    logs: AuditLog[];
    questions?: QuestionJob[];
    studentId?: string; // For Guardian multi-child support
}

// Shared utilities
const getUpcomingEvents = (schools: StudentSchool[]) => {
    return schools.flatMap(s =>
        s.events.map(e => ({ ...e, schoolName: s.name, schoolId: s.id }))
    )
        .map(e => ({
            ...e,
            days: DateUtils.getDaysRemaining(e.date, e.isAllDay)
        }))
        .filter(e => e.days >= 0)
        .sort((a, b) => a.days - b.days)
        .slice(0, 5);
};

// ===== STUDENT DASHBOARD =====
// Goal: Maximum motivation through gamification, clear daily goals
const StudentDashboard: React.FC<DashboardProps> = ({ currentUser, schools, lesson }) => {
    const upcomingEvents = getUpcomingEvents(schools);
    const homeworkItems = lesson.aiHomework?.items.filter(h => !h.isCompleted) || [];
    const completedHomework = lesson.aiHomework?.items.filter(h => h.isCompleted) || [];
    const totalHomework = lesson.aiHomework?.items.length || 0;
    const completionRate = totalHomework > 0 ? Math.round((completedHomework.length / totalHomework) * 100) : 0;
    const nextExam = upcomingEvents.find(e => e.type === 'exam');

    // Gamification stats - initial values (will be loaded from user profile in production)
    // TODO: Replace with actual user data from Firestore
    const stats = {
        level: 1,
        xp: 0,
        xpToNext: 100,
        streak: 0,
        todayTasks: homeworkItems.length,
        badges: [] as string[],
        dailyBonus: 0,
        rank: '初心者'
    };

    const xpProgress = (stats.xp / stats.xpToNext) * 100;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Hero Header with Enhanced Animation */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-6 text-white shadow-2xl animate-slide-up">
                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl shadow-lg border-2 border-white/30">
                                    🎓
                                </div>
                                {/* Level Badge */}
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                                    {stats.level}
                                </div>
                            </div>
                            <div>
                                <p className="text-white/70 text-sm font-medium">おかえり！</p>
                                <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="bg-yellow-400/20 border border-yellow-400/30 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                        🏅 {stats.rank}ランク
                                    </span>
                                    <div className="flex gap-1">
                                        {stats.badges.slice(0, 4).map((b, i) => <span key={i} className="text-lg">{b}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                            <div className="text-5xl font-bold flex items-center justify-center gap-2">
                                🔥 <span>{stats.streak}</span>
                            </div>
                            <p className="text-white/90 text-sm mt-1">日連続！すごい！</p>
                        </div>
                    </div>

                    {/* Animated XP Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="flex items-center gap-1">
                                <span className="text-yellow-300">⭐</span> レベル{stats.level}
                            </span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{stats.xp} / {stats.xpToNext} XP</span>
                        </div>
                        <div className="h-4 bg-white/20 rounded-full overflow-hidden relative">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 rounded-full transition-all duration-1000 relative"
                                style={{ width: `${xpProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                            </div>
                            {/* XP to next level */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold">
                                あと{stats.xpToNext - stats.xp}XP
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Bonus Banner */}
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl p-4 border-2 border-amber-200 flex items-center justify-between animate-slide-up animate-delay-1">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-bounce">
                        🎁
                    </div>
                    <div>
                        <p className="font-bold text-amber-900">今日のボーナス獲得中！</p>
                        <p className="text-sm text-amber-700">タスクを完了すると+{stats.dailyBonus}% XPボーナス</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-amber-600">+{stats.dailyBonus}%</span>
                </div>
            </div>

            {/* Today's Missions - Enhanced */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-slide-up animate-delay-2">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        🎯 今日のミッション
                    </h3>
                    {stats.todayTasks > 0 && (
                        <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-md">
                            {stats.todayTasks}個残り
                        </span>
                    )}
                </div>

                {homeworkItems.length > 0 ? (
                    <div className="space-y-4">
                        {homeworkItems.map((hw, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all group cursor-pointer">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-lg">{hw.title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-gray-500">{hw.type}</span>
                                        <span className="text-sm text-gray-400">•</span>
                                        <span className="text-sm text-gray-500">約{hw.estimated_minutes}分</span>
                                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold">+50 XP</span>
                                    </div>
                                </div>
                                <Link
                                    to="/homework"
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg group-hover:shadow-xl"
                                >
                                    やる！ 💪
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 border-dashed">
                        <span className="text-6xl block mb-3 animate-bounce">🏆</span>
                        <p className="text-2xl font-bold text-green-700">全クリア！おつかれさま！</p>
                        <p className="text-green-600 mt-2">今日も最高にがんばったね！ +100 XPボーナス獲得！</p>
                    </div>
                )}
            </div>

            {/* Progress & Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up animate-delay-3">
                {/* Circular Progress */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">進捗</h3>
                    <div className="relative w-28 h-28 mx-auto mb-4">
                        <svg className="w-28 h-28 transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                            <circle
                                cx="56" cy="56" r="48"
                                stroke="url(#studentGradient)"
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray={`${completionRate * 3.02} 302`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="studentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-900">{completionRate}%</span>
                            <span className="text-xs text-gray-500">完了</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 text-center">{completedHomework.length} / {totalHomework} 完了</p>
                </div>

                {/* Next Exam */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium text-indigo-200 uppercase tracking-wider mb-3">次の試験</h3>
                    {nextExam ? (
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-1">{nextExam.days}</div>
                            <p className="text-indigo-200 font-medium">日後</p>
                            <p className="text-sm text-indigo-100 mt-3 truncate">{nextExam.title}</p>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-indigo-200">
                            <span className="text-3xl block mb-2">📅</span>
                            試験予定なし
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <Link
                        to="/questions"
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                        <div>
                            <p className="font-bold">写真で質問</p>
                            <p className="text-xs text-white/80">わからない問題を撮影</p>
                        </div>
                    </Link>
                    <Link
                        to="/lessons/l1"
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📖</span>
                        <div>
                            <p className="font-bold">予習をする</p>
                            <p className="text-xs text-white/80">+20 XP獲得</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

// ===== GUARDIAN DASHBOARD =====
// Goal: Premium, trustworthy design for parents - Gold/Navy theme
const GuardianDashboard: React.FC<DashboardProps> = ({ currentUser, schools, lesson, studentId }) => {
    const upcomingEvents = getUpcomingEvents(schools);
    const homeworkItems = lesson.aiHomework?.items || [];
    const completedHomework = homeworkItems.filter(h => h.isCompleted);
    const completionRate = homeworkItems.length > 0 ? Math.round((completedHomework.length / homeworkItems.length) * 100) : 0;

    // Get selected child info from MOCK_STUDENTS
    const selectedChild = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];
    const childDisplayName = selectedChild?.name || 'お子様';
    // Determine suffix based on name (simple heuristic)
    const nameSuffix = selectedChild?.name?.endsWith('子') ? 'ちゃん' : 'くん';

    // Calculate dynamic stats from actual data
    const totalHomework = homeworkItems.length;
    const completedCount = completedHomework.length;
    const estimatedMinutes = homeworkItems.reduce((sum, h) => sum + (h.estimated_minutes || 0), 0);
    const completedMinutes = completedHomework.reduce((sum, h) => sum + (h.estimated_minutes || 0), 0);

    // Dynamic child stats based on real data
    const childStats = {
        lastStudy: lesson.scheduledAt ? DateUtils.formatDate(lesson.scheduledAt) : '未記録',
        weeklyHours: Math.round(completedMinutes / 60 * 10) / 10 || 0,
        weeklyProblems: completedCount,
        streak: completedCount > 0 ? Math.min(completedCount, 7) : 0, // Simple heuristic
    };

    // Next exam countdown
    const nextExam = upcomingEvents.find(e => e.type === 'exam');

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Premium Welcome Banner - Navy & Gold */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-amber-500/20 animate-slide-up">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 border-2 border-amber-300/50">
                            {selectedChild?.avatar || '👪'}
                        </div>
                        <div>
                            <p className="text-amber-400/80 text-sm font-medium tracking-wide uppercase">保護者専用ダッシュボード</p>
                            <h1 className="text-3xl font-bold mt-1">{currentUser.name}様</h1>
                            <p className="text-slate-300 mt-1">{childDisplayName}{nameSuffix}の学習状況をご報告いたします</p>
                        </div>
                    </div>
                    <div className="hidden md:block text-right">
                        <p className="text-slate-400 text-sm">本日</p>
                        <p className="text-2xl font-bold text-amber-400">{new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid - Gradient borders with gold accents */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up animate-delay-1">
                <div className="relative bg-white rounded-2xl p-5 shadow-lg border border-slate-100 overflow-hidden group hover:shadow-xl transition-shadow">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">📅</div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">最終学習日</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{childStats.lastStudy}</p>
                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        アクティブ
                    </p>
                </div>
                <div className="relative bg-white rounded-2xl p-5 shadow-lg border border-slate-100 overflow-hidden group hover:shadow-xl transition-shadow">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">⏱️</div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">今週の学習</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{childStats.weeklyHours}<span className="text-sm font-normal text-slate-500">時間</span></p>
                </div>
                <div className="relative bg-white rounded-2xl p-5 shadow-lg border border-slate-100 overflow-hidden group hover:shadow-xl transition-shadow">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">✏️</div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">完了問題数</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{childStats.weeklyProblems}<span className="text-sm font-normal text-slate-500">問</span></p>
                </div>
                <div className="relative bg-white rounded-2xl p-5 shadow-lg border border-slate-100 overflow-hidden group hover:shadow-xl transition-shadow">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-red-600"></div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">🔥</div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">連続記録</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{childStats.streak}<span className="text-sm font-normal text-slate-500">日連続</span></p>
                </div>
            </div>

            {/* Two-column layout for main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up animate-delay-2">
                {/* Homework Progress - Takes 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">📝</div>
                            <h3 className="text-lg font-bold text-slate-900">宿題進捗状況</h3>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${completionRate >= 80 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            completionRate >= 50 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                            {completionRate}% 完了
                        </span>
                    </div>

                    {/* Premium Progress Bar */}
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-6">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${completionRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                                completionRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                                    'bg-gradient-to-r from-red-400 to-red-600'
                                }`}
                            style={{ width: `${completionRate}%` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {homeworkItems.map((hw, i) => (
                            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${hw.isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${hw.isCompleted ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                    {hw.isCompleted ? '✓' : i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${hw.isCompleted ? 'text-emerald-700' : 'text-slate-900'}`}>{hw.title}</p>
                                    {!hw.isCompleted && <p className="text-xs text-slate-500 mt-0.5">未完了</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Exam Countdown - Premium Card */}
                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <h3 className="text-sm font-medium text-amber-400/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span>🎯</span> 次回試験まで
                    </h3>
                    {nextExam ? (
                        <div className="text-center py-4">
                            <div className="text-6xl font-bold text-amber-400 mb-2">{nextExam.days}</div>
                            <p className="text-xl text-slate-300 font-medium">日</p>
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-400">{nextExam.schoolName}</p>
                                <p className="text-white font-bold mt-1">{nextExam.title}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <span className="text-4xl block mb-2">📅</span>
                            試験予定なし
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming School Events - Premium Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 animate-slide-up animate-delay-3">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">🏫</div>
                    <h3 className="text-lg font-bold text-slate-900">受験スケジュール</h3>
                </div>
                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                        <span className="text-3xl block mb-2">📅</span>
                        <p className="text-slate-500">予定されているイベントはありません</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((evt) => (
                            <div key={`${evt.schoolId}-${evt.id}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-100">
                                        <span className="text-xs text-slate-500 font-medium">{DateUtils.formatDate(evt.date).split('/')[0]}月</span>
                                        <span className="text-xl font-bold text-slate-900">{DateUtils.formatDate(evt.date).split('/')[1]?.split('(')[0]}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{evt.schoolName}</span>
                                        <p className="font-bold text-slate-900 mt-1">{evt.title}</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${evt.days <= 7 ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200' : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
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
};

// ===== TUTOR DASHBOARD =====
// Goal: Efficient workflow with prominent task visibility
const TutorDashboard: React.FC<DashboardProps> = ({ currentUser, schools, lesson, questions = [], studentId }) => {
    const upcomingEvents = getUpcomingEvents(schools);
    const pendingQuestions = questions.filter(q => q.status === 'pending' || q.status === 'queued');

    // Get selected student info
    const selectedStudent = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];

    // Calculate dynamic stats from actual data
    const homeworkItems = lesson.aiHomework?.items || [];
    const completedHomework = homeworkItems.filter(h => h.isCompleted);
    const estimatedMinutes = completedHomework.reduce((sum, h) => sum + (h.estimated_minutes || 0), 0);

    // Dynamic tutor stats
    const tutorStats = {
        todayClasses: 1,
        pendingReviews: pendingQuestions.length,
        thisMonthHours: Math.round(estimatedMinutes / 60 * 10) / 10 || 0,
        students: MOCK_STUDENTS.map(s => ({ ...s, lastActive: '2時間前', progress: Math.floor(Math.random() * 30) + 70 }))
    };

    const nextExam = upcomingEvents[0];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Clean Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <p className="text-sm text-blue-600 font-medium">講師ダッシュボード</p>
                    <h1 className="text-2xl font-bold text-gray-900">{currentUser.name}先生</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">本日の授業</p>
                        <p className="text-2xl font-bold text-blue-600">{tutorStats.todayClasses}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
                        👨‍🏫
                    </div>
                </div>
            </div>

            {/* Alert Banner for Pending Reviews */}
            {tutorStats.pendingReviews > 0 && (
                <Link to="/questions" className="block bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl animate-bounce">
                                ⚠️
                            </div>
                            <div>
                                <p className="font-bold text-lg">質問レビューが待っています</p>
                                <p className="text-white/90 text-sm">{tutorStats.pendingReviews}件の生徒からの質問に回答してください</p>
                            </div>
                        </div>
                        <span className="text-white/80 group-hover:translate-x-1 transition-transform text-xl">→</span>
                    </div>
                </Link>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up animate-delay-2">
                {/* Left Column - Stats & Quick Actions */}
                <div className="space-y-4">
                    {/* Compact Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-xs">👥</span>
                                <span className="text-xs text-gray-500">担当生徒</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{tutorStats.students.length}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-xs">⏱️</span>
                                <span className="text-xs text-gray-500">今月</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{tutorStats.thisMonthHours}<span className="text-sm font-normal text-gray-500">h</span></p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">クイックアクション</h3>
                        <Link to="/lessons/l1" className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">🎓</span>
                                <span className="text-blue-700 font-medium">授業を開始</span>
                            </div>
                            <span className="text-blue-400 group-hover:text-blue-600">→</span>
                        </Link>
                        <Link to="/homework" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">📝</span>
                                <span className="text-gray-700 font-medium">宿題管理</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                        </Link>
                        <Link to="/schools" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">🏫</span>
                                <span className="text-gray-700 font-medium">受験校管理</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                        </Link>
                    </div>

                    {/* Next Exam Card */}
                    {nextExam && (
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                            <p className="text-xs text-indigo-200 uppercase tracking-wider mb-2">次回試験</p>
                            <p className="text-3xl font-bold">{nextExam.days}<span className="text-lg font-normal ml-1">日後</span></p>
                            <p className="text-sm text-indigo-100 mt-2 truncate">{nextExam.schoolName} - {nextExam.title}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Students Grid */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">担当生徒</h3>
                        <span className="text-xs text-gray-500">{selectedStudent.name}さんを選択中</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tutorStats.students.map((student, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${student.id === studentId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
                                    {student.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900">{student.name}</p>
                                        {student.id === studentId && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">選択中</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">最終学習: {student.lastActive}</p>
                                    {/* Progress Bar */}
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" style={{ width: `${student.progress}%` }}></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-gray-900">{student.progress}%</span>
                                    <p className="text-xs text-gray-500">進捗</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===== ADMIN DASHBOARD =====
// Goal: Minimal, clean design for efficient system management
const AdminDashboard: React.FC<DashboardProps> = ({ currentUser, logs }) => {
    // Mock admin stats
    const adminStats = {
        totalUsers: 24,
        activeToday: 18,
        totalLessons: 156,
        pendingIssues: 2
    };

    const recentLogs = logs.slice(0, 8);
    const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Minimal Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <p className="text-sm text-gray-500 font-medium">管理コンソール</p>
                    <h1 className="text-2xl font-bold text-gray-900">システム概要</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isFirebaseMode ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${isFirebaseMode ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {isFirebaseMode ? 'クラウド接続' : 'ローカルモード'}
                    </span>
                </div>
            </div>

            {/* Clean Stats Row */}
            <div className="grid grid-cols-4 gap-4 animate-slide-up animate-delay-1">
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">ユーザー</span>
                        <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">👥</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">登録中</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">アクティブ</span>
                        <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-sm">🟢</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">{adminStats.activeToday}</p>
                    <p className="text-xs text-gray-500 mt-1">本日</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">累計授業</span>
                        <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">📚</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.totalLessons}</p>
                    <p className="text-xs text-gray-500 mt-1">回</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">対応待ち</span>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${adminStats.pendingIssues > 0 ? 'bg-amber-50' : 'bg-gray-100'}`}>⚠️</span>
                    </div>
                    <p className={`text-3xl font-bold ${adminStats.pendingIssues > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{adminStats.pendingIssues}</p>
                    <p className="text-xs text-gray-500 mt-1">件</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up animate-delay-2">
                {/* Quick Actions - Clean List */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">クイックアクション</h3>
                    <div className="space-y-2">
                        <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">👥</span>
                                <span className="text-gray-700 font-medium">ユーザー管理</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                        </Link>
                        <Link to="/admin/settings" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">⚙️</span>
                                <span className="text-gray-700 font-medium">システム設定</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                        </Link>
                        <Link to="/admin/usage" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">📊</span>
                                <span className="text-gray-700 font-medium">使用状況</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                        </Link>
                        <Link to="/admin/database" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">🗄️</span>
                                <span className="text-gray-700 font-medium">データベース</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                        </Link>
                    </div>

                    {/* System Status */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">システム状態</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">フロントエンド</span>
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>稼働中
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">ストレージ</span>
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>接続中
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Firebase</span>
                                <span className={`flex items-center gap-1.5 text-xs font-medium ${isFirebaseMode ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseMode ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                    {isFirebaseMode ? '接続中' : '未接続'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs - Compact Table */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">操作ログ</h3>
                        <span className="text-xs text-gray-500">直近{recentLogs.length}件</span>
                    </div>
                    {recentLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <span className="text-3xl block mb-2">📋</span>
                            ログがありません
                        </div>
                    ) : (
                        <div className="overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                                        <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                                        <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">概要</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 text-gray-500 whitespace-nowrap">{new Date(log.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="py-3">
                                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">{log.action}</span>
                                            </td>
                                            <td className="py-3 text-gray-700 truncate max-w-xs">{log.summary}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ===== MAIN DASHBOARD ROUTER =====
export const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser, lesson } = props;

    // Check due items and trigger notifications on dashboard load
    useEffect(() => {
        if (lesson.aiHomework?.items) {
            const itemsWithMeta = lesson.aiHomework.items.map(item => ({
                ...item,
                ...getHomeworkMeta(lesson.scheduledAt, item),
            }));
            notificationService.checkDueItems(itemsWithMeta);
        }
    }, [lesson]);

    switch (currentUser.role) {
        case UserRole.STUDENT:
            return <StudentDashboard {...props} />;
        case UserRole.GUARDIAN:
            return <GuardianDashboard {...props} />;
        case UserRole.TUTOR:
            return <TutorDashboard {...props} />;
        case UserRole.ADMIN:
            return <AdminDashboard {...props} />;
        default:
            return <StudentDashboard {...props} />;
    }
};
