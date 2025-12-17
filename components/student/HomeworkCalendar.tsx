import React, { useState } from 'react';
import { User, HomeworkItem } from '../../types';

interface HomeworkCalendarProps {
    currentUser: User;
    homeworkItems?: HomeworkItem[];
    onCompleteHomework?: (id: string) => void;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    homework: HomeworkItem[];
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export const HomeworkCalendar: React.FC<HomeworkCalendarProps> = ({
    currentUser,
    homeworkItems = [],
    onCompleteHomework
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Demo homework data
    const demoHomework: HomeworkItem[] = homeworkItems.length > 0 ? homeworkItems : [
        { id: '1', title: '算数 計算ドリル P.20-25', due_days_from_now: 0, type: 'practice', estimated_minutes: 30, dueDate: new Date().toISOString().split('T')[0] },
        { id: '2', title: '国語 漢字プリント', due_days_from_now: 1, type: 'practice', estimated_minutes: 20, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
        { id: '3', title: '理科 実験レポート', due_days_from_now: 3, type: 'challenge', estimated_minutes: 45, dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
        { id: '4', title: '算数 文章問題', due_days_from_now: 5, type: 'review', estimated_minutes: 40, dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], isCompleted: true },
    ];

    const getCalendarDays = (): CalendarDay[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add days from previous month
        const startDayOfWeek = firstDay.getDay();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                homework: []
            });
        }

        // Add days of current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayHomework = demoHomework.filter(h => h.dueDate === dateStr);

            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                homework: dayHomework
            });
        }

        // Add days from next month
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                homework: []
            });
        }

        return days;
    };

    const navigateMonth = (direction: -1 | 1) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const getTypeColor = (type: HomeworkItem['type']) => {
        switch (type) {
            case 'practice': return 'bg-blue-500';
            case 'review': return 'bg-green-500';
            case 'challenge': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const selectedDayHomework = selectedDate
        ? demoHomework.filter(h => h.dueDate === selectedDate.toISOString().split('T')[0])
        : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📅
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">宿題カレンダー</h2>
                        <p className="text-sm text-gray-500">期限を確認して計画的に</p>
                    </div>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        ←
                    </button>
                    <h3 className="text-lg font-bold">
                        {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                    </h3>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        →
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                    {DAYS_OF_WEEK.map((day, i) => (
                        <div
                            key={day}
                            className={`py-2 text-center text-sm font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {getCalendarDays().map((day, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(day.date)}
                            className={`min-h-[80px] p-2 border-b border-r border-gray-50 text-left transition-colors hover:bg-gray-50 ${!day.isCurrentMonth ? 'bg-gray-50/50' : ''
                                } ${day.isToday ? 'bg-blue-50' : ''} ${selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-inset ring-blue-500' : ''
                                }`}
                        >
                            <span className={`text-sm font-medium ${!day.isCurrentMonth ? 'text-gray-300' :
                                    day.isToday ? 'text-blue-600 font-bold' :
                                        day.date.getDay() === 0 ? 'text-red-500' :
                                            day.date.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'
                                }`}>
                                {day.date.getDate()}
                            </span>
                            <div className="mt-1 space-y-0.5">
                                {day.homework.slice(0, 2).map((hw, j) => (
                                    <div
                                        key={j}
                                        className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${getTypeColor(hw.type)} ${hw.isCompleted ? 'opacity-50 line-through' : ''}`}
                                    >
                                        {hw.title.substring(0, 8)}...
                                    </div>
                                ))}
                                {day.homework.length > 2 && (
                                    <div className="text-[10px] text-gray-400">
                                        +{day.homework.length - 2}件
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Day Detail */}
            {selectedDate && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
                    <h3 className="font-bold text-gray-900 mb-4">
                        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の宿題
                    </h3>
                    {selectedDayHomework.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            📚 この日の宿題はありません
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {selectedDayHomework.map(hw => (
                                <div
                                    key={hw.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border ${hw.isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 shadow-sm'
                                        }`}
                                >
                                    <button
                                        onClick={() => onCompleteHomework?.(hw.id!)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${hw.isCompleted
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 hover:border-green-500'
                                            }`}
                                    >
                                        {hw.isCompleted && '✓'}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`font-medium ${hw.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {hw.title}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            ⏱️ 約{hw.estimated_minutes}分
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(hw.type)}`}>
                                        {hw.type === 'practice' ? '練習' : hw.type === 'review' ? '復習' : 'チャレンジ'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">練習</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">復習</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600">チャレンジ</span>
                </div>
            </div>
        </div>
    );
};

export default HomeworkCalendar;
