import React, { useState } from 'react';
import { User, Goal, GoalType, GoalStatus } from '../../types';

interface GoalTrackerProps {
    currentUser: User;
    onAddGoal?: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const goalTypeConfig: Record<GoalType, { label: string; icon: string; color: string }> = {
    academic: { label: '学習', icon: '📚', color: 'from-blue-500 to-indigo-500' },
    habit: { label: '習慣', icon: '🔄', color: 'from-green-500 to-emerald-500' },
    exam: { label: '受験', icon: '🎯', color: 'from-red-500 to-rose-500' },
    skill: { label: 'スキル', icon: '⭐', color: 'from-purple-500 to-pink-500' },
};

const statusConfig: Record<GoalStatus, { label: string; color: string }> = {
    active: { label: '進行中', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '達成！', color: 'bg-green-100 text-green-700' },
    paused: { label: '一時停止', color: 'bg-gray-100 text-gray-600' },
    failed: { label: '未達成', color: 'bg-red-100 text-red-700' },
};

export const GoalTracker: React.FC<GoalTrackerProps> = ({ currentUser, onAddGoal }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'academic' as GoalType,
        targetValue: 100,
        unit: '%',
        deadline: ''
    });

    // Demo goals
    const [goals, setGoals] = useState<Goal[]>([
        {
            id: '1',
            studentId: currentUser.id,
            title: '算数のテストで90点以上',
            description: '計算ミスを減らして高得点を目指す',
            type: 'exam',
            targetValue: 90,
            currentValue: 75,
            unit: '点',
            status: 'active',
            deadline: '2025-01-15',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: '2',
            studentId: currentUser.id,
            title: '毎日30分の自主学習',
            description: '継続的な学習習慣を身につける',
            type: 'habit',
            targetValue: 30,
            currentValue: 25,
            unit: '日間継続',
            status: 'active',
            deadline: '2025-02-01',
            milestones: ['7日間達成', '14日間達成', '21日間達成'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: '3',
            studentId: currentUser.id,
            title: '漢字検定8級合格',
            description: '漢字力を強化する',
            type: 'skill',
            targetValue: 100,
            currentValue: 100,
            unit: '%',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newGoal: Goal = {
            id: Date.now().toString(),
            studentId: currentUser.id,
            ...formData,
            currentValue: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setGoals([...goals, newGoal]);
        setShowForm(false);
        setFormData({ title: '', description: '', type: 'academic', targetValue: 100, unit: '%', deadline: '' });
        onAddGoal?.(newGoal);
    };

    const updateProgress = (goalId: string, newValue: number) => {
        setGoals(goals.map(g => {
            if (g.id === goalId) {
                const progress = (newValue / g.targetValue) * 100;
                return {
                    ...g,
                    currentValue: newValue,
                    status: progress >= 100 ? 'completed' : g.status,
                    updatedAt: new Date().toISOString()
                };
            }
            return g;
        }));
    };

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        🎯
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">目標トラッカー</h2>
                        <p className="text-sm text-gray-500">目標を設定して達成しよう</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                    + 目標を追加
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-4 text-white">
                    <p className="text-blue-100 text-sm">進行中</p>
                    <p className="text-3xl font-bold mt-1">{activeGoals.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-white">
                    <p className="text-green-100 text-sm">達成済み</p>
                    <p className="text-3xl font-bold mt-1">{completedGoals.length}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
                    <p className="text-purple-100 text-sm">達成率</p>
                    <p className="text-3xl font-bold mt-1">
                        {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Add Goal Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-slide-up">
                    <h3 className="font-bold text-gray-900 mb-4">新しい目標を追加</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">目標タイトル</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="例: 算数のテストで90点以上"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as GoalType })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    {(Object.keys(goalTypeConfig) as GoalType[]).map(type => (
                                        <option key={type} value={type}>
                                            {goalTypeConfig[type].icon} {goalTypeConfig[type].label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">目標値</label>
                                <input
                                    type="number"
                                    value={formData.targetValue}
                                    onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">単位</label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="点、%、日など"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                            >
                                追加
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Active Goals */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-900">🔥 進行中の目標</h3>
                {activeGoals.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                        目標を追加して、達成を目指しましょう！
                    </div>
                ) : (
                    activeGoals.map(goal => {
                        const typeConfig = goalTypeConfig[goal.type!];
                        const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
                        const daysLeft = goal.deadline
                            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
                            : null;

                        return (
                            <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${typeConfig.color} rounded-xl flex items-center justify-center text-2xl text-white`}>
                                        {typeConfig.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-gray-900">{goal.title}</h4>
                                            {daysLeft !== null && daysLeft > 0 && (
                                                <span className={`text-sm px-3 py-1 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    あと{daysLeft}日
                                                </span>
                                            )}
                                        </div>
                                        {goal.description && (
                                            <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                                        )}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500">進捗</span>
                                                <span className="font-bold text-gray-900">
                                                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                                                </span>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${typeConfig.color} rounded-full transition-all`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                type="range"
                                                min={0}
                                                max={goal.targetValue}
                                                value={goal.currentValue}
                                                onChange={e => updateProgress(goal.id!, Number(e.target.value))}
                                                className="flex-1"
                                            />
                                            <span className="text-sm font-bold text-gray-700 w-12 text-right">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">🏆 達成した目標</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedGoals.map(goal => (
                            <div key={goal.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🏆</span>
                                    <div>
                                        <p className="font-bold text-green-800">{goal.title}</p>
                                        <p className="text-sm text-green-600">目標達成！</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalTracker;
