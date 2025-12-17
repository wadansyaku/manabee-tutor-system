import React, { useState, useEffect } from 'react';
import { User, DashboardStats, UserRole } from '../../types';
import { isFirebaseConfigured } from '../../services/firebaseService';
import { LoadingState } from '../ui/EmptyState';

interface AnalyticsDashboardProps {
    currentUser: User;
}

interface ChartData {
    label: string;
    value: number;
    color: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentUser }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    useEffect(() => {
        loadStats();
    }, [timeRange]);

    const loadStats = async () => {
        // Demo stats for now
        setStats({
            totalStudents: 24,
            totalTutors: 5,
            totalGuardians: 18,
            totalLessons: 156,
            totalLessonHours: 312,
            activeStudentsThisWeek: 18,
            questionsThisWeek: 42,
            homeworkCompletionRate: 78,
            averageStudyMinutesPerDay: 45
        });
        setLoading(false);
    };

    if (loading || !stats) {
        return <LoadingState message="分析データを読み込み中..." />;
    }

    const userDistribution: ChartData[] = [
        { label: '生徒', value: stats.totalStudents, color: 'bg-blue-500' },
        { label: '講師', value: stats.totalTutors, color: 'bg-indigo-500' },
        { label: '保護者', value: stats.totalGuardians, color: 'bg-pink-500' }
    ];

    const totalUsers = stats.totalStudents + stats.totalTutors + stats.totalGuardians;

    // Weekly activity data (demo)
    const weeklyActivity = [
        { day: '月', lessons: 8, studyHours: 24 },
        { day: '火', lessons: 12, studyHours: 36 },
        { day: '水', lessons: 10, studyHours: 30 },
        { day: '木', lessons: 14, studyHours: 42 },
        { day: '金', lessons: 11, studyHours: 33 },
        { day: '土', lessons: 18, studyHours: 54 },
        { day: '日', lessons: 6, studyHours: 18 }
    ];

    const maxLessons = Math.max(...weeklyActivity.map(d => d.lessons));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📈
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">分析ダッシュボード</h2>
                        <p className="text-sm text-gray-500">システム全体の統計情報</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {range === 'week' ? '週間' : range === 'month' ? '月間' : '年間'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">総生徒数</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
                        </div>
                        <div className="text-4xl opacity-80">👨‍🎓</div>
                    </div>
                    <p className="text-blue-100 text-xs mt-2">
                        今週アクティブ: {stats.activeStudentsThisWeek}人
                    </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">総授業時間</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalLessonHours}h</p>
                        </div>
                        <div className="text-4xl opacity-80">📚</div>
                    </div>
                    <p className="text-green-100 text-xs mt-2">
                        授業回数: {stats.totalLessons}回
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm">宿題完了率</p>
                            <p className="text-3xl font-bold mt-1">{stats.homeworkCompletionRate}%</p>
                        </div>
                        <div className="text-4xl opacity-80">✅</div>
                    </div>
                    <div className="mt-2 bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all"
                            style={{ width: `${stats.homeworkCompletionRate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">週間質問数</p>
                            <p className="text-3xl font-bold mt-1">{stats.questionsThisWeek}</p>
                        </div>
                        <div className="text-4xl opacity-80">❓</div>
                    </div>
                    <p className="text-purple-100 text-xs mt-2">
                        平均学習: {stats.averageStudyMinutesPerDay}分/日
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">ユーザー分布</h3>
                    <div className="flex items-center gap-6">
                        {/* Simple pie chart representation */}
                        <div className="relative w-32 h-32">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                {userDistribution.reduce((acc, item, i) => {
                                    const percentage = (item.value / totalUsers) * 100;
                                    const dashArray = `${percentage * 2.51327} ${251.327 - percentage * 2.51327}`;
                                    const dashOffset = acc.offset;
                                    acc.offset -= percentage * 2.51327;
                                    acc.elements.push(
                                        <circle
                                            key={i}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke={item.color.replace('bg-', 'var(--tw-')}
                                            strokeWidth="20"
                                            strokeDasharray={dashArray}
                                            strokeDashoffset={dashOffset}
                                            className={item.color.replace('bg-', 'stroke-current text-').replace('-500', '-500')}
                                        />
                                    );
                                    return acc;
                                }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{totalUsers}</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            {userDistribution.map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                        <span className="text-sm text-gray-600">{item.label}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Weekly Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">週間アクティビティ</h3>
                    <div className="flex items-end justify-between h-40 gap-2">
                        {weeklyActivity.map(day => (
                            <div key={day.day} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all hover:from-indigo-600 hover:to-purple-600"
                                    style={{ height: `${(day.lessons / maxLessons) * 100}%` }}
                                />
                                <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                        <span>授業数 (棒グラフ)</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">最近のアクティビティ</h3>
                <div className="space-y-3">
                    {[
                        { time: '10分前', action: '山田太郎さんが宿題を完了しました', icon: '✅', color: 'bg-green-100 text-green-600' },
                        { time: '30分前', action: '佐藤先生が授業を記録しました', icon: '📚', color: 'bg-blue-100 text-blue-600' },
                        { time: '1時間前', action: '田中さんが質問を投稿しました', icon: '❓', color: 'bg-purple-100 text-purple-600' },
                        { time: '2時間前', action: '新規ユーザーが登録しました', icon: '👤', color: 'bg-indigo-100 text-indigo-600' },
                        { time: '3時間前', action: '月次レポートが生成されました', icon: '📊', color: 'bg-amber-100 text-amber-600' }
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.color}`}>
                                {activity.icon}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-900">{activity.action}</p>
                            </div>
                            <span className="text-xs text-gray-400">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
                <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <span>📥</span>
                    レポートをエクスポート
                </button>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
