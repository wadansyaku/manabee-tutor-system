import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LinearProgress, CircularProgress } from '../ui/Progress';
import { Badge, StatusBadge } from '../ui/Badge';

// ===== CHILD STATS TYPE =====

interface ChildStats {
    weeklyStudyHours: number;
    weeklyProblems: number;
    homeworkCompletion: number;
    streak: number;
    lastStudy: string;
    trend: 'up' | 'down' | 'stable';
    strengths: string[];
    improvements: string[];
}

// ===== CHILD PROGRESS CARD =====

interface ChildProgressCardProps {
    childName: string;
    childAvatar?: string;
    stats: ChildStats;
    className?: string;
}

export const ChildProgressCard: React.FC<ChildProgressCardProps> = ({
    childName,
    childAvatar = '👦',
    stats,
    className = '',
}) => {
    const trendIcon = stats.trend === 'up' ? '📈' : stats.trend === 'down' ? '📉' : '➡️';
    const trendColor = stats.trend === 'up' ? 'text-green-600' : stats.trend === 'down' ? 'text-red-600' : 'text-gray-600';

    return (
        <Card className={className}>
            {/* Header with Avatar */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-orange-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    {childAvatar}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{childName}の学習状況</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status="online" label={stats.lastStudy} showDot={true} />
                        <span className={`text-sm font-medium ${trendColor}`}>
                            {trendIcon} 先週比
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-rose-50 rounded-xl p-4">
                    <p className="text-xs text-rose-600 font-medium mb-1">今週の学習時間</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.weeklyStudyHours}<span className="text-sm font-normal">時間</span></p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs text-orange-600 font-medium mb-1">解いた問題数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.weeklyProblems}<span className="text-sm font-normal">問</span></p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs text-amber-600 font-medium mb-1">宿題完了率</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.homeworkCompletion}<span className="text-sm font-normal">%</span></p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-xs text-yellow-600 font-medium mb-1">連続学習</p>
                    <p className="text-2xl font-bold text-gray-900">🔥 {stats.streak}<span className="text-sm font-normal">日</span></p>
                </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                        <span>💪</span> 強み
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.strengths.map((strength, i) => (
                            <Badge key={i} variant="success" size="sm">{strength}</Badge>
                        ))}
                    </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-2">
                        <span>📚</span> 今後の課題
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.improvements.map((item, i) => (
                            <Badge key={i} variant="warning" size="sm">{item}</Badge>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

// ===== WEEKLY SUMMARY CARD =====

interface WeeklySummaryData {
    days: {
        day: string;
        studyMinutes: number;
        problems: number;
    }[];
}

interface WeeklySummaryCardProps {
    data: WeeklySummaryData;
    className?: string;
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
    data,
    className = '',
}) => {
    const maxMinutes = Math.max(...data.days.map(d => d.studyMinutes), 60);

    return (
        <Card className={className}>
            <CardHeader icon="📊">今週の学習グラフ</CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2 h-32">
                    {data.days.map((day, i) => {
                        const height = (day.studyMinutes / maxMinutes) * 100;
                        const isToday = i === data.days.length - 1;
                        return (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-gray-600">{day.studyMinutes}分</span>
                                <div
                                    className={`w-full rounded-t-lg transition-all ${isToday
                                            ? 'bg-gradient-to-t from-rose-500 to-orange-400'
                                            : 'bg-gradient-to-t from-gray-300 to-gray-200'
                                        }`}
                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                />
                                <span className={`text-xs ${isToday ? 'font-bold text-rose-600' : 'text-gray-500'}`}>
                                    {day.day}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-600">
                        週合計: <strong className="text-gray-900">{data.days.reduce((sum, d) => sum + d.studyMinutes, 0)}分</strong>
                    </span>
                    <span className="text-gray-600">
                        問題数: <strong className="text-gray-900">{data.days.reduce((sum, d) => sum + d.problems, 0)}問</strong>
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

// ===== TUTOR MESSAGE CARD =====

interface TutorMessage {
    date: string;
    message: string;
    tutorName: string;
}

interface TutorMessageCardProps {
    messages: TutorMessage[];
    className?: string;
}

export const TutorMessageCard: React.FC<TutorMessageCardProps> = ({
    messages,
    className = '',
}) => {
    if (messages.length === 0) return null;

    const latestMessage = messages[0];

    return (
        <Card className={className}>
            <CardHeader icon="💬" action={<Badge variant="info" size="sm">新着</Badge>}>
                先生からのメッセージ
            </CardHeader>
            <CardContent>
                <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{latestMessage.message}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>{latestMessage.tutorName}</span>
                        <span>{new Date(latestMessage.date).toLocaleDateString('ja-JP')}</span>
                    </div>
                </div>

                {messages.length > 1 && (
                    <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        過去のメッセージを見る ({messages.length - 1}件)
                    </button>
                )}
            </CardContent>
        </Card>
    );
};

// ===== SAMPLE DATA GENERATOR =====

export const getSampleChildStats = (): ChildStats => ({
    weeklyStudyHours: 12.5,
    weeklyProblems: 47,
    homeworkCompletion: 75,
    streak: 5,
    lastStudy: '2時間前',
    trend: 'up',
    strengths: ['算数・図形', '理科・実験'],
    improvements: ['国語・記述', '社会・年号'],
});

export const getSampleWeeklyData = (): WeeklySummaryData => ({
    days: [
        { day: '月', studyMinutes: 45, problems: 8 },
        { day: '火', studyMinutes: 60, problems: 12 },
        { day: '水', studyMinutes: 30, problems: 5 },
        { day: '木', studyMinutes: 90, problems: 15 },
        { day: '金', studyMinutes: 75, problems: 10 },
        { day: '土', studyMinutes: 120, problems: 20 },
        { day: '日', studyMinutes: 40, problems: 7 },
    ],
});
