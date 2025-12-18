import React, { useState, useEffect } from 'react';
import { User, StudyLog, StudyType } from '../../types';
import { EmptyState } from '../ui/EmptyState';

interface StudyLogTrackerProps {
    currentUser: User;
}

const studyTypes: Record<StudyType, { label: string; color: string; icon: string }> = {
    homework: { label: '宿題', color: 'bg-blue-500', icon: '📝' },
    review: { label: '復習', color: 'bg-green-500', icon: '🔄' },
    self_study: { label: '自習', color: 'bg-purple-500', icon: '📖' },
    exam_prep: { label: '受験対策', color: 'bg-red-500', icon: '🎯' },
    lesson: { label: '授業', color: 'bg-indigo-500', icon: '👨‍🏫' }
};

export const StudyLogTracker: React.FC<StudyLogTrackerProps> = ({ currentUser }) => {
    const [logs, setLogs] = useState<StudyLog[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        subject: '算数',
        durationMinutes: 30,
        type: 'self_study' as StudyType,
        notes: ''
    });

    // Load study logs from storage or Firestore (no mock data)
    useEffect(() => {
        // In production, load from Firestore
        // For now, start with empty array - user adds their own logs
        setLogs([]);
    }, [currentUser.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newLog: StudyLog = {
            id: Date.now().toString(),
            studentId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            ...formData,
            createdAt: new Date().toISOString()
        };
        setLogs([newLog, ...logs]);
        setShowForm(false);
        setFormData({ subject: '算数', durationMinutes: 30, type: 'self_study', notes: '' });
    };

    // Calculate weekly stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekLogs = logs.filter(log => new Date(log.date) >= weekStart);

    const totalMinutesThisWeek = weekLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const todayLogs = logs.filter(log => log.date === new Date().toISOString().split('T')[0]);
    const todayMinutes = todayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

    // Calculate study time by type
    const timeByType = weekLogs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + log.durationMinutes;
        return acc;
    }, {} as Record<StudyType, number>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📊
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">学習ログ</h2>
                        <p className="text-sm text-gray-500">今日の学習を記録しよう</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                    + 学習を記録
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
                    <p className="text-emerald-100 text-sm">今日の学習</p>
                    <p className="text-3xl font-bold mt-1">{todayMinutes}分</p>
                    <p className="text-emerald-100 text-xs mt-1">{todayLogs.length}件の記録</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-4 text-white">
                    <p className="text-blue-100 text-sm">今週の合計</p>
                    <p className="text-3xl font-bold mt-1">{Math.floor(totalMinutesThisWeek / 60)}時間{totalMinutesThisWeek % 60}分</p>
                    <p className="text-blue-100 text-xs mt-1">{weekLogs.length}件の記録</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
                    <p className="text-purple-100 text-sm">連続学習</p>
                    <p className="text-3xl font-bold mt-1">{currentUser.streak || 0}日</p>
                    <p className="text-purple-100 text-xs mt-1">🔥 継続中！</p>
                </div>
            </div>

            {/* Study Time by Type */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">今週の学習内訳</h3>
                <div className="space-y-3">
                    {(Object.keys(studyTypes) as StudyType[]).map(type => {
                        const minutes = timeByType[type] || 0;
                        const values = Object.values(timeByType) as number[];
                        const maxMinutes = Math.max(...values, 1);
                        const percentage = (minutes / maxMinutes) * 100;
                        const info = studyTypes[type];

                        return (
                            <div key={type} className="flex items-center gap-4">
                                <div className="w-20 flex items-center gap-2">
                                    <span>{info.icon}</span>
                                    <span className="text-sm text-gray-600">{info.label}</span>
                                </div>
                                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${info.color} rounded-full transition-all`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-16 text-right text-sm font-medium text-gray-900">
                                    {minutes}分
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">学習を記録</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                            <select
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option>算数</option>
                                <option>国語</option>
                                <option>理科</option>
                                <option>社会</option>
                                <option>英語</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">時間 (分)</label>
                            <input
                                type="number"
                                value={formData.durationMinutes}
                                onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                min={1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as StudyType })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {(Object.keys(studyTypes) as StudyType[]).map(type => (
                                    <option key={type} value={type}>{studyTypes[type].label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                            >
                                記録する
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Log List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">最近の記録</h3>
                </div>
                {logs.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon="📝"
                            title="記録がありません"
                            description="学習を記録すると、ここに表示されます"
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.slice(0, 10).map(log => {
                            const typeInfo = studyTypes[log.type];
                            return (
                                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${typeInfo.color}`}>
                                        {typeInfo.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{log.subject}</p>
                                        <p className="text-sm text-gray-500">{typeInfo.label}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{log.durationMinutes}分</p>
                                        <p className="text-xs text-gray-500">{log.date}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyLogTracker;
