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
// Goal: Motivation, gamification, clear tasks
const StudentDashboard: React.FC<DashboardProps> = ({ currentUser, schools, lesson }) => {
    const upcomingEvents = getUpcomingEvents(schools);
    const homeworkItems = lesson.aiHomework?.items.filter(h => !h.isCompleted) || [];
    const completedHomework = lesson.aiHomework?.items.filter(h => h.isCompleted) || [];
    const totalHomework = lesson.aiHomework?.items.length || 0;
    const completionRate = totalHomework > 0 ? Math.round((completedHomework.length / totalHomework) * 100) : 0;
    const nextExam = upcomingEvents.find(e => e.type === 'exam');

    // Mock stats (would be from real data)
    const stats = {
        level: 12,
        xp: 2450,
        xpToNext: 3000,
        streak: 5,
        todayTasks: homeworkItems.length,
        badges: ['📚', '🌟', '🔥']
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Gamified Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                            🎓
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Lv.{stats.level}</span>
                                <div className="flex gap-1">
                                    {stats.badges.map((b, i) => <span key={i} className="text-lg">{b}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">🔥 {stats.streak}</div>
                        <p className="text-white/80 text-sm">日連続学習中！</p>
                    </div>
                </div>

                {/* XP Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>経験値</span>
                        <span>{stats.xp} / {stats.xpToNext} XP</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Today's Missions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🎯 今日のミッション
                    {stats.todayTasks > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{stats.todayTasks}個</span>
                    )}
                </h3>

                {homeworkItems.length > 0 ? (
                    <div className="space-y-3">
                        {homeworkItems.map((hw, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{hw.title}</p>
                                    <p className="text-sm text-gray-500">{hw.type} • 約{hw.estimated_minutes}分 • +50 XP</p>
                                </div>
                                <Link
                                    to="/homework"
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
                                >
                                    やる！
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-green-50 rounded-xl">
                        <span className="text-5xl block mb-2">🏆</span>
                        <p className="text-lg font-bold text-green-700">全クリア！おつかれさま！</p>
                        <p className="text-sm text-green-600 mt-1">今日も頑張ったね！</p>
                    </div>
                )}
            </div>

            {/* Progress & Exams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Homework Progress */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">宿題進捗</h3>
                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${completionRate * 2.51} 251`}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#34d399" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{completedHomework.length} / {totalHomework} 完了</p>
                    </div>
                </div>

                {/* Next Exam Countdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">次の試験まで</h3>
                    {nextExam ? (
                        <div className="text-center">
                            <div className="text-5xl font-bold text-indigo-600 mb-2">
                                {nextExam.days}
                            </div>
                            <p className="text-lg text-gray-700">日</p>
                            <p className="text-sm text-gray-500 mt-2 truncate">{nextExam.title}</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-4">
                            <span className="text-3xl block mb-2">📅</span>
                            試験予定なし
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link
                    to="/questions"
                    className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow group"
                >
                    <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                    <div>
                        <p className="font-bold">写真で質問</p>
                        <p className="text-sm opacity-80">わからない問題を撮影</p>
                    </div>
                </Link>
                <Link
                    to="/lessons/l1"
                    className="flex items-center gap-4 p-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow group"
                >
                    <span className="text-3xl group-hover:scale-110 transition-transform">📖</span>
                    <div>
                        <p className="font-bold">予習をする</p>
                        <p className="text-sm opacity-80">次の授業の準備</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

// ===== GUARDIAN DASHBOARD =====
// Goal: Quick overview of child's progress, peace of mind
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

    // Mock child stats (would be per-child in real implementation)
    const childStats = {
        lastStudy: '2時間前',
        weeklyHours: 12.5,
        weeklyProblems: 47,
        streak: 5
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-rose-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl">
                        {selectedChild?.avatar || '👪'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">こんにちは、{currentUser.name}さん</h1>
                        <p className="text-white/90">{childDisplayName}{nameSuffix}の学習状況をお伝えします</p>
                    </div>
                </div>
            </div>

            {/* Child Status Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">最終学習</p>
                    <p className="text-xl font-bold text-gray-900">{childStats.lastStudy}</p>
                    <p className="text-xs text-green-600 mt-1">🟢 オンライン</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">今週の学習時間</p>
                    <p className="text-xl font-bold text-gray-900">{childStats.weeklyHours}<span className="text-sm font-normal">時間</span></p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">解いた問題数</p>
                    <p className="text-xl font-bold text-gray-900">{childStats.weeklyProblems}<span className="text-sm font-normal">問</span></p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">連続学習記録</p>
                    <p className="text-xl font-bold text-gray-900">🔥 {childStats.streak}<span className="text-sm font-normal">日</span></p>
                </div>
            </div>

            {/* Homework Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">宿題の進捗</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${completionRate >= 80 ? 'bg-green-100 text-green-700' :
                        completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {completionRate}% 完了
                    </span>
                </div>

                <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                        className={`h-full rounded-full transition-all ${completionRate >= 80 ? 'bg-green-500' :
                            completionRate >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                            }`}
                        style={{ width: `${completionRate}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {homeworkItems.map((hw, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${hw.isCompleted ? 'bg-green-50' : 'bg-orange-50'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hw.isCompleted ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                                {hw.isCompleted ? '✓' : i + 1}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${hw.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{hw.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming School Events */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📅 受験スケジュール</h3>
                {upcomingEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">予定されているイベントはありません</p>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((evt) => (
                            <div key={`${evt.schoolId}-${evt.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-xs text-gray-500">{DateUtils.formatDate(evt.date).split('/')[0]}</span>
                                        <span className="text-lg font-bold text-gray-900">{DateUtils.formatDate(evt.date).split('/')[1]?.split('(')[0]}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500">{evt.schoolName}</span>
                                        <p className="font-bold text-gray-900">{evt.title}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${evt.days <= 7 ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
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
// Goal: Efficient class management, student overview
const TutorDashboard: React.FC<DashboardProps> = ({ currentUser, schools, lesson, questions = [] }) => {
    const upcomingEvents = getUpcomingEvents(schools);
    const pendingQuestions = questions.filter(q => q.status === 'pending');

    // Mock tutor data
    const tutorStats = {
        todayClasses: 3,
        pendingReviews: pendingQuestions.length,
        thisMonthHours: 48,
        students: ['たけし', 'まなみ', 'けんた']
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl">
                            👨‍🏫
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{currentUser.name}先生</h1>
                            <p className="text-white/90">{new Date().toLocaleDateString('ja-JP', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{tutorStats.todayClasses}</p>
                        <p className="text-white/80 text-sm">本日の授業</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">❓</div>
                        <span className="text-xs text-gray-500">要対応</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{tutorStats.pendingReviews}</p>
                    <p className="text-xs text-gray-500">質問レビュー</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">👥</div>
                        <span className="text-xs text-gray-500">担当</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{tutorStats.students.length}</p>
                    <p className="text-xs text-gray-500">生徒数</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">⏱️</div>
                        <span className="text-xs text-gray-500">今月</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{tutorStats.thisMonthHours}</p>
                    <p className="text-xs text-gray-500">授業時間</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">📅</div>
                        <span className="text-xs text-gray-500">直近</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{upcomingEvents[0]?.days ?? '-'}</p>
                    <p className="text-xs text-gray-500">日後に試験</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tutorStats.pendingReviews > 0 && (
                    <Link
                        to="/questions"
                        className="flex items-center gap-4 p-5 bg-red-50 border-2 border-red-200 rounded-2xl hover:bg-red-100 transition-colors group"
                    >
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <p className="font-bold text-red-700">質問レビュー</p>
                            <p className="text-sm text-red-600">{tutorStats.pendingReviews}件の回答待ち</p>
                        </div>
                    </Link>
                )}
                <Link
                    to="/lessons/l1"
                    className="flex items-center gap-4 p-5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-colors"
                >
                    <span className="text-3xl">🎓</span>
                    <div>
                        <p className="font-bold text-indigo-700">授業を開始</p>
                        <p className="text-sm text-indigo-600">次の授業: 18:30</p>
                    </div>
                </Link>
                <Link
                    to="/schools"
                    className="flex items-center gap-4 p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                    <span className="text-3xl">🏫</span>
                    <div>
                        <p className="font-bold text-gray-700">受験校管理</p>
                        <p className="text-sm text-gray-600">{schools.length}校登録中</p>
                    </div>
                </Link>
            </div>

            {/* Students Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">👥 担当生徒</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tutorStats.students.map((name, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{name}</p>
                                <p className="text-xs text-gray-500">最終学習: 2時間前</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ===== ADMIN DASHBOARD =====
// Goal: System monitoring, user management
const AdminDashboard: React.FC<DashboardProps> = ({ currentUser, logs }) => {
    // Mock admin stats
    const adminStats = {
        totalUsers: 24,
        activeToday: 18,
        totalLessons: 156,
        pendingIssues: 2
    };

    const recentLogs = logs.slice(0, 10);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-2xl">
                        ⚙️
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">管理コンソール</h1>
                        <p className="text-white/70">システム状態: <span className="text-green-400">正常稼働中</span></p>
                    </div>
                </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">総ユーザー数</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">本日のアクティブ</p>
                    <p className="text-3xl font-bold text-green-600">{adminStats.activeToday}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">累計授業数</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.totalLessons}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">対応待ち</p>
                    <p className="text-3xl font-bold text-orange-600">{adminStats.pendingIssues}</p>
                </div>
            </div>

            {/* Recent Audit Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 最近の操作ログ</h3>
                {recentLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">ログがありません</p>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-500 w-36 shrink-0">{new Date(log.at).toLocaleString('ja-JP')}</span>
                                <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">{log.action}</span>
                                <span className="text-gray-700 truncate">{log.summary}</span>
                            </div>
                        ))}
                    </div>
                )}
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
