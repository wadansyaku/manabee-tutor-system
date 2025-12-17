import React, { useState } from 'react';
import { User, Lesson } from '../../types';
import { HomeworkList } from '../HomeworkList';
import { HomeworkCalendar } from './HomeworkCalendar';
import { resolveDueDate } from '../../services/homeworkUtils';

interface HomeworkPageProps {
    currentUser: User;
    lesson: Lesson;
    onUpdateLesson: (updated: Lesson) => void;
    onAudit: (action: string, summary: string) => void;
    studentId?: string;
}

type ViewMode = 'list' | 'calendar';

export const HomeworkPage: React.FC<HomeworkPageProps> = ({
    currentUser,
    lesson,
    onUpdateLesson,
    onAudit,
    studentId
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    // Filter items (if needed) or pass all to children
    const homeworkItems = lesson.aiHomework?.items || [];

    const handleCompleteFromCalendar = (id: string) => {
        // Find item and toggle it
        // Note: Logic duplicated from HomeworkList temporarily.
        // In a real refactor, we should hoist the "Toggle Homework" logic to a hook or parent.
        const targetItem = homeworkItems.find(i => (i.id || '') === id);
        if (!targetItem) return;

        const wasCompleted = targetItem.isCompleted;
        const nowCompleting = !wasCompleted;

        const updatedItems = homeworkItems.map(item => {
            if ((item.id || '') !== id) return item;
            return {
                ...item,
                isCompleted: nowCompleting,
                completedAt: nowCompleting ? new Date().toISOString() : undefined
            };
        });

        onUpdateLesson({ ...lesson, aiHomework: { items: updatedItems } });
        onAudit('homework_status_changed', `${targetItem.title} を${wasCompleted ? '未完了' : '完了'}に変更 (カレンダーより)`);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">宿題・タスク管理</h1>
                    <p className="text-gray-500 text-sm">学習計画を立てて、着実に進めよう</p>
                </div>

                <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        📝 リスト表示
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        📅 カレンダー表示
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="animate-fade-in">
                {viewMode === 'list' ? (
                    <HomeworkList
                        lesson={lesson}
                        currentUser={currentUser}
                        onUpdateLesson={onUpdateLesson}
                        onAudit={onAudit}
                        studentId={studentId}
                    />
                ) : (
                    <HomeworkCalendar
                        currentUser={currentUser}
                        homeworkItems={homeworkItems}
                        onCompleteHomework={handleCompleteFromCalendar}
                    />
                )}
            </div>
        </div>
    );
};
