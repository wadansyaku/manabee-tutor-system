// Weekly Summary Component for Guardians
// Displays a comprehensive view of the child's weekly progress
import React, { useMemo, useState } from 'react';
import { User, Lesson, HomeworkItem } from '../../types';

interface WeeklySummaryProps {
    currentUser: User;
    studentName?: string;
    lessons?: Lesson[];
    homeworkItems?: HomeworkItem[];
}

interface DayProgress {
    date: Date;
    dayName: string;
    studyMinutes: number;
    completedTasks: number;
    totalTasks: number;
    hasLesson: boolean;
}

// Generate mock weekly data (in production, this would come from Firestore)
const generateWeeklyData = (): DayProgress[] => {
    const today = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));

        const isPast = i < 6;
        const isToday = i === 6;

        return {
            date,
            dayName: days[date.getDay()],
            studyMinutes: isPast ? Math.floor(Math.random() * 90) + 15 : (isToday ? Math.floor(Math.random() * 60) : 0),
            completedTasks: isPast ? Math.floor(Math.random() * 3) + 1 : (isToday ? 1 : 0),
            totalTasks: Math.floor(Math.random() * 3) + 2,
            hasLesson: isPast && Math.random() > 0.6,
        };
    });
};

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
    currentUser,
    studentName = 'お子様',
}) => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const weeklyData = useMemo(() => generateWeeklyData(), []);

    // Calculate summary stats
    const totalMinutes = weeklyData.reduce((sum, d) => sum + d.studyMinutes, 0);
    const totalCompleted = weeklyData.reduce((sum, d) => sum + d.completedTasks, 0);
    const totalTasks = weeklyData.reduce((sum, d) => sum + d.totalTasks, 0);
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const lessonsCount = weeklyData.filter(d => d.hasLesson).length;

    // Find max for chart scaling
    const maxMinutes = Math.max(...weeklyData.map(d => d.studyMinutes), 60);

    // Compare with "last week" (mock)
    const lastWeekMinutes = totalMinutes * (0.8 + Math.random() * 0.4);
    const weekOverWeekChange = Math.round(((totalMinutes - lastWeekMinutes) / lastWeekMinutes) * 100);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg">
                            📊
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">今週のサマリー</h3>
                            <p className="text-slate-300 text-sm">
                                {new Date(weeklyData[0].date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                {' ~ '}
                                {new Date(weeklyData[6].date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${weekOverWeekChange >= 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                        {weekOverWeekChange >= 0 ? '↑' : '↓'} {Math.abs(weekOverWeekChange)}% 前週比
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 p-5 border-b border-slate-100 bg-slate-50">
                <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{Math.round(totalMinutes / 60 * 10) / 10}</p>
                    <p className="text-xs text-slate-500 mt-1">学習時間</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{totalCompleted}</p>
                    <p className="text-xs text-slate-500 mt-1">完了タスク</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
                    <p className="text-xs text-slate-500 mt-1">達成率</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{lessonsCount}</p>
                    <p className="text-xs text-slate-500 mt-1">授業回数</p>
                </div>
            </div>

            {/* Daily Chart */}
            <div className="p-5">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">日別学習時間</h4>

                <div className="flex items-end justify-between gap-2 h-32 mb-2">
                    {weeklyData.map((day, i) => {
                        const height = (day.studyMinutes / maxMinutes) * 100;
                        const isToday = i === 6;
                        const isSelected = selectedDay === i;

                        return (
                            <div
                                key={i}
                                className="flex-1 flex flex-col items-center cursor-pointer group"
                                onClick={() => setSelectedDay(isSelected ? null : i)}
                            >
                                {/* Bar */}
                                <div className="w-full relative flex items-end justify-center h-24">
                                    <div
                                        className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${isToday
                                                ? 'bg-gradient-to-t from-amber-400 to-amber-300'
                                                : isSelected
                                                    ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                                                    : 'bg-gradient-to-t from-slate-300 to-slate-200 group-hover:from-slate-400 group-hover:to-slate-300'
                                            }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />

                                    {/* Lesson indicator */}
                                    {day.hasLesson && (
                                        <span className="absolute -top-6 text-sm">📚</span>
                                    )}
                                </div>

                                {/* Day label */}
                                <span className={`text-xs mt-2 font-medium ${isToday ? 'text-amber-600' : 'text-slate-500'
                                    }`}>
                                    {day.dayName}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Selected day details */}
                {selectedDay !== null && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-900">
                                    {new Date(weeklyData[selectedDay].date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
                                </p>
                                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                    <span>⏱️ {weeklyData[selectedDay].studyMinutes}分</span>
                                    <span>✅ {weeklyData[selectedDay].completedTasks}/{weeklyData[selectedDay].totalTasks}タスク</span>
                                    {weeklyData[selectedDay].hasLesson && <span>📚 授業あり</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="px-5 pb-5">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                            <p className="font-bold text-emerald-800">今週のポイント</p>
                            <p className="text-sm text-emerald-700 mt-1">
                                {studentName}は今週{totalCompleted}個のタスクを完了しました。
                                {completionRate >= 80
                                    ? '素晴らしい進捗です！この調子で続けましょう。'
                                    : completionRate >= 50
                                        ? '順調に進んでいます。週末でさらに追い上げましょう！'
                                        : 'もう少しペースアップが必要かもしれません。'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklySummary;
