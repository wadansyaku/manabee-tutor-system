// Admin Usage Monitor Component
import React, { useState, useMemo } from 'react';
import { User, UserRole, AuditLog } from '../../types';
import { StorageService, DateUtils } from '../../services/storageService';

interface UsageMonitorProps {
    currentUser: User;
    logs: AuditLog[];
}

interface DailyUsage {
    date: string;
    aiCalls: number;
    logins: number;
    actions: number;
}

interface UserUsage {
    userId: string;
    userName: string;
    userRole: UserRole;
    totalActions: number;
    aiCalls: number;
    lastActive: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: '管理者',
    [UserRole.TUTOR]: '講師',
    [UserRole.GUARDIAN]: '保護者',
    [UserRole.STUDENT]: '生徒'
};

export const UsageMonitor: React.FC<UsageMonitorProps> = ({ currentUser, logs }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

    // Filter logs by time range
    const filteredLogs = useMemo(() => {
        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;
        const cutoff = timeRange === '7d'
            ? new Date(now.getTime() - 7 * msPerDay)
            : timeRange === '30d'
                ? new Date(now.getTime() - 30 * msPerDay)
                : new Date(0);

        return logs.filter(log => new Date(log.at) >= cutoff);
    }, [logs, timeRange]);

    // Calculate daily usage
    const dailyUsage = useMemo(() => {
        const usage: Record<string, DailyUsage> = {};

        filteredLogs.forEach(log => {
            const date = log.at.split('T')[0];
            if (!usage[date]) {
                usage[date] = { date, aiCalls: 0, logins: 0, actions: 0 };
            }
            usage[date].actions++;
            if (log.action.includes('ai_')) usage[date].aiCalls++;
            if (log.action === 'login') usage[date].logins++;
        });

        return Object.values(usage).sort((a, b) => b.date.localeCompare(a.date));
    }, [filteredLogs]);

    // Calculate per-user usage
    const userUsage = useMemo(() => {
        const usage: Record<string, UserUsage> = {};

        filteredLogs.forEach(log => {
            if (!usage[log.userId]) {
                usage[log.userId] = {
                    userId: log.userId,
                    userName: log.userName,
                    userRole: log.userRole,
                    totalActions: 0,
                    aiCalls: 0,
                    lastActive: log.at
                };
            }
            usage[log.userId].totalActions++;
            if (log.action.includes('ai_')) usage[log.userId].aiCalls++;
            if (log.at > usage[log.userId].lastActive) {
                usage[log.userId].lastActive = log.at;
            }
        });

        return Object.values(usage).sort((a, b) => b.totalActions - a.totalActions);
    }, [filteredLogs]);

    // Summary stats
    const stats = useMemo(() => {
        const totalActions = filteredLogs.length;
        const aiCalls = filteredLogs.filter(l => l.action.includes('ai_')).length;
        const uniqueUsers = new Set(filteredLogs.map(l => l.userId)).size;
        const avgActionsPerDay = dailyUsage.length > 0
            ? Math.round(totalActions / dailyUsage.length)
            : 0;

        // Estimated cost (example: 0.001 per AI call)
        const estimatedCost = aiCalls * 0.001;

        return { totalActions, aiCalls, uniqueUsers, avgActionsPerDay, estimatedCost };
    }, [filteredLogs, dailyUsage]);

    // Max bar height for chart
    const maxActions = Math.max(...dailyUsage.map(d => d.actions), 1);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm opacity-80">システム管理</p>
                        <h1 className="text-2xl font-bold">使用状況モニター</h1>
                        <p className="opacity-80 text-sm mt-1">API使用量とシステム利用状況を可視化</p>
                    </div>
                    <span className="text-4xl">📊</span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">総アクション</p>
                        <p className="text-2xl font-bold">{stats.totalActions}</p>
                    </div>
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">AI呼び出し</p>
                        <p className="text-2xl font-bold">{stats.aiCalls}</p>
                    </div>
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">アクティブユーザー</p>
                        <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                    </div>
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">日平均アクション</p>
                        <p className="text-2xl font-bold">{stats.avgActionsPerDay}</p>
                    </div>
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">推定コスト</p>
                        <p className="text-2xl font-bold">${stats.estimatedCost.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Time Range Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex gap-2">
                    {(['7d', '30d', 'all'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${timeRange === range
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {range === '7d' ? '過去7日' : range === '30d' ? '過去30日' : '全期間'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Daily Usage Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📈 日別アクティビティ</h3>

                {dailyUsage.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl block mb-2">📭</span>
                        <p>期間内のデータがありません</p>
                    </div>
                ) : (
                    <div className="flex items-end gap-1 h-48 bg-gray-50 rounded-xl p-4">
                        {dailyUsage.slice(0, 30).reverse().map((day, idx) => (
                            <div
                                key={day.date}
                                className="flex-1 flex flex-col items-center justify-end"
                            >
                                <div
                                    className="w-full bg-gradient-to-t from-teal-500 to-cyan-400 rounded-t"
                                    style={{ height: `${(day.actions / maxActions) * 100}%`, minHeight: '4px' }}
                                    title={`${day.date}: ${day.actions}アクション`}
                                />
                                {idx % 5 === 0 && (
                                    <p className="text-[10px] text-gray-400 mt-1 transform -rotate-45 origin-top-left">
                                        {day.date.slice(5)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User Usage Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">👥 ユーザー別使用状況</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">ユーザー</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">ロール</th>
                                <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase">アクション数</th>
                                <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase">AI呼び出し</th>
                                <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase">最終アクティブ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userUsage.slice(0, 20).map(user => (
                                <tr key={user.userId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {user.userName[0]}
                                            </div>
                                            <span className="font-medium text-gray-900">{user.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{ROLE_LABELS[user.userRole]}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-semibold text-gray-900">{user.totalActions}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-semibold ${user.aiCalls > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                                            {user.aiCalls}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm text-gray-500">
                                            {new Date(user.lastActive).toLocaleString('ja-JP', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {userUsage.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl block mb-2">👤</span>
                        <p>ユーザー使用データがありません</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsageMonitor;
